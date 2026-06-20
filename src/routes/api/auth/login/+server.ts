import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import {
  createSession,
  findUserByIdentity,
  getRequestMeta,
  getRolesForUser,
  getSessionTimeoutMinutes,
  setSessionCookie,
  verifyPassword,
} from '$lib/server/auth';
import { identityRateLimit } from '$lib/server/rate-limit';
import { recordSecurityEvent } from '$lib/server/security-events';
import { booleanField, LIMITS, readJsonBody, stringField, validationErrorResponse } from '$lib/server/validation';

const LOGIN_IDENTITY_ATTEMPT_LIMIT = 10;
const LOGIN_IDENTITY_ATTEMPT_WINDOW_MS = 15 * 1000;

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

    const user = await findUserByIdentity(identity);

    if (!user || user.status !== 'ACTIVE') {
      await recordSecurityEvent({
        event,
        eventType: 'LOGIN_FAILED',
        route: '/api/auth/login',
        details: { reason: 'invalid_credentials' },
      });
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      await recordSecurityEvent({
        event,
        eventType: 'LOGIN_FAILED',
        route: '/api/auth/login',
        details: { reason: 'invalid_credentials' },
      });
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    const roles = await getRolesForUser(user.user_id);

    if (requireAdmin && !roles.includes('ADMIN')) {
      await recordSecurityEvent({
        event,
        eventType: 'LOGIN_FAILED',
        route: '/api/auth/login',
        details: { reason: 'admin_role_required' },
      });
      return json({ error: 'Credențiale invalide.' }, { status: 401 });
    }

    const meta = getRequestMeta(request, event.getClientAddress());
    const timeoutMinutes = getSessionTimeoutMinutes(roles);
    const { token } = await createSession(user.user_id, meta, timeoutMinutes);
    setSessionCookie(cookies, token, timeoutMinutes);

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Login failed', error);
    return json({ error: 'Autentificarea a eșuat.' }, { status: 500 });
  }
}
