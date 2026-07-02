import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import type { RequestEvent } from '@sveltejs/kit';
import {
  createSession,
  DUMMY_PASSWORD_HASH,
  findUserByIdentity,
  getRequestMeta,
  getRolesForUser,
  getSessionTimeoutMinutes,
  insertAuthLog,
  setSessionCookie,
  verifyPassword,
} from '$lib/server/auth';
import {
  checkRateLimitKey,
  getClientIp,
  identityRateLimit,
  identityRateLimitKey,
  peekRateLimitKey,
  resetRateLimitKey,
} from '$lib/server/rate-limit';
import { recordSecurityEvent } from '$lib/server/security-events';
import { createAdminClient } from '$lib/server/supabase';
import { booleanField, LIMITS, readJsonBody, stringField, validationErrorResponse } from '$lib/server/validation';

const LOGIN_IDENTITY_ATTEMPT_LIMIT = 10;
const LOGIN_IDENTITY_ATTEMPT_WINDOW_MS = 15 * 1000;

// Lockout: failed-credential counters, consumed only on failures and cleared
// on success. Separate from the burst limiters above, which count all attempts.
const LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAIL_IDENTITY_LIMIT = 5;
const LOGIN_FAIL_IP_LIMIT = 20;

function lockedOutResponse(retryAfterSeconds: number) {
  return json(
    { error: 'Prea multe încercări eșuate. Te rugăm să încerci din nou mai târziu.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, retryAfterSeconds)) },
    }
  );
}

export async function POST(event: RequestEvent) {
  const { request, cookies } = event;

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const identity =
      stringField(body, 'identity', { max: 120 }) ||
      stringField(body, 'email', { max: 120 }) ||
      stringField(body, 'username', { max: 80 });
    const password = stringField(body, 'password', { required: true, min: 1, max: 200, fieldLabel: 'Parola' });
    const requireAdmin = booleanField(body, 'requireAdmin', false);

    if (!identity) {
      return json({ error: 'Email sau username și parola sunt obligatorii.' }, { status: 400 });
    }

    const identityLimit = await identityRateLimit(identity, {
      scope: 'api-auth-attempt-identity-v2',
      limit: LOGIN_IDENTITY_ATTEMPT_LIMIT,
      windowMs: LOGIN_IDENTITY_ATTEMPT_WINDOW_MS,
    });

    if (identityLimit) return identityLimit;

    const failIdentityKey = identityRateLimitKey('login-fail-identity', identity);
    const failIpKey = `login-fail-ip:${getClientIp(event)}`;

    const [identityLock, ipLock] = await Promise.all([
      failIdentityKey
        ? peekRateLimitKey(failIdentityKey, LOGIN_FAIL_IDENTITY_LIMIT)
        : Promise.resolve({ allowed: true, retryAfterSeconds: 0 }),
      peekRateLimitKey(failIpKey, LOGIN_FAIL_IP_LIMIT),
    ]);

    if (!identityLock.allowed || !ipLock.allowed) {
      await recordSecurityEvent({
        event,
        eventType: 'LOGIN_FAILED',
        route: '/api/auth/login',
        rateLimited: true,
        details: { reason: 'locked_out' },
      });
      return lockedOutResponse(Math.max(identityLock.retryAfterSeconds, ipLock.retryAfterSeconds));
    }

    const recordFailure = async (reason: string, userId?: number | null) => {
      const failureMeta = getRequestMeta(request, event.getClientAddress());
      await Promise.all([
        failIdentityKey
          ? checkRateLimitKey({ key: failIdentityKey, limit: LOGIN_FAIL_IDENTITY_LIMIT, windowMs: LOGIN_FAIL_WINDOW_MS })
          : Promise.resolve(null),
        checkRateLimitKey({ key: failIpKey, limit: LOGIN_FAIL_IP_LIMIT, windowMs: LOGIN_FAIL_WINDOW_MS }),
        recordSecurityEvent({
          event,
          eventType: 'LOGIN_FAILED',
          route: '/api/auth/login',
          severity: reason === 'locked_out' ? 'HIGH' : 'MEDIUM',
          targetUserId: userId ?? null,
          details: { reason },
        }),
        userId
          ? insertAuthLog({
              userId,
              eventType: 'LOGIN_FAILED',
              meta: failureMeta,
              details: { reason },
            }).catch(() => undefined)
          : Promise.resolve(undefined),
      ]);
    };

    const user = await findUserByIdentity(identity);

    if (!user || user.status !== 'ACTIVE') {
      // Burn the same scrypt cost as the real check so response timing does
      // not reveal whether the account exists.
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      await recordFailure('invalid_credentials', user?.user_id ?? null);
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      await recordFailure('invalid_credentials', user.user_id);
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    const roles = await getRolesForUser(user.user_id);
    const isAdminLogin = roles.includes('ADMIN');

    if (requireAdmin && !roles.includes('ADMIN')) {
      await recordFailure('admin_role_required', user.user_id);
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    if (failIdentityKey) {
      await resetRateLimitKey(failIdentityKey);
    }

    const meta = getRequestMeta(request, event.getClientAddress());
    let knownIpResult: { data: unknown[] | null; error: unknown | null } = { data: [], error: null };
    let knownAgentResult: { data: unknown[] | null; error: unknown | null } = { data: [], error: null };

    if (process.env.NODE_ENV !== 'test') {
      const admin = createAdminClient();
      [knownIpResult, knownAgentResult] = await Promise.all([
        meta.ipAddress
          ? admin
              .from('sessions')
              .select('session_id')
              .eq('user_id', user.user_id)
              .eq('ip_address', meta.ipAddress)
              .limit(1)
          : Promise.resolve({ data: [], error: null }),
        meta.userAgent
          ? admin
              .from('sessions')
              .select('session_id')
              .eq('user_id', user.user_id)
              .eq('user_agent', meta.userAgent)
              .limit(1)
          : Promise.resolve({ data: [], error: null }),
      ]);
    }

    const timeoutMinutes = getSessionTimeoutMinutes(roles);
    const { token } = await createSession(user.user_id, meta, timeoutMinutes);

    if (!isAdminLogin && process.env.NODE_ENV !== 'test' && knownIpResult.error == null && meta.ipAddress && (knownIpResult.data?.length ?? 0) === 0) {
      await recordSecurityEvent({
        event,
        eventType: 'NEW_IP_LOGIN',
        route: '/api/auth/login',
        targetUserId: user.user_id,
        severity: 'LOW',
        details: { reason: 'first_successful_login_from_ip' },
      });
    }

    if (!isAdminLogin && process.env.NODE_ENV !== 'test' && knownAgentResult.error == null && meta.userAgent && (knownAgentResult.data?.length ?? 0) === 0) {
      await recordSecurityEvent({
        event,
        eventType: 'NEW_DEVICE_LOGIN',
        route: '/api/auth/login',
        targetUserId: user.user_id,
        severity: 'LOW',
        details: { reason: 'first_successful_login_from_user_agent' },
      });
    }
    setSessionCookie(cookies, token, timeoutMinutes);

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Login failed', error);
    return json({ error: 'Autentificarea a eșuat.', requestId }, { status: 500 });
  }
}
