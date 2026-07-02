import { json, redirect, type Handle, type HandleServerError, type RequestEvent } from '@sveltejs/kit';
import {
  clearSessionCookie,
  getSessionTimeoutMinutes,
  resolveSessionFromToken,
  setSessionCookie,
  shouldTouchSession,
  touchSession,
} from '$lib/server/auth';
import { getServerEnv } from '$lib/server/env';
import { checkRateLimit, rateLimit, rateLimitMany, type ScopedRateLimitConfig } from '$lib/server/rate-limit';
import { SESSION_COOKIE_NAME } from '$lib/server/supabase';
import { LIMITS } from '$lib/server/validation';
import { recordSecurityEvent } from '$lib/server/security-events';
import { recordUserActivity } from '$lib/server/user-activity';
import {
  buildDecoyPage,
  isAllowedSameOriginRequest,
  isSuspiciousDecoyPath,
  safeRequestMethod,
  setSecurityHeaders,
} from '$lib/server/security-helpers';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const AUTH_ATTEMPT_LIMIT = 10;
const AUTH_ATTEMPT_WINDOW_MS = 15 * 1000;
const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);
const AUTH_ATTEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/change-password',
]);
const CHECKOUT_PATHS = new Set(['/api/checkout']);

function csrfErrorResponse() {
  return json({ error: 'Cerere respinsă.' }, { status: 403 });
}

async function handleSuspiciousDecoyRequest(event: RequestEvent) {
  if (!isSuspiciousDecoyPath(event.url.pathname)) return null;

  const requestId = crypto.randomUUID();
  const method = safeRequestMethod(event.request.method);
  const timestamp = new Date().toISOString();
  const decision = await checkRateLimit(event, {
    scope: 'security-decoy',
    limit: 5,
    windowMs: FIFTEEN_MINUTES,
  });
  const rateLimited = !decision.allowed;

  await recordSecurityEvent({
    event,
    eventType: rateLimited ? 'RATE_LIMIT' : 'DECOY_HIT',
    requestId,
    route: event.url.pathname,
    rateLimited,
  });

  return new Response(
    buildDecoyPage({
      path: event.url.pathname,
      method,
      timestamp,
      requestId,
      rateLimited,
    }),
    {
      status: rateLimited ? 429 : 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        ...(rateLimited ? { 'Retry-After': String(decision.retryAfterSeconds) } : {}),
      },
    }
  );
}

async function enforceRequestEnvelope(event: RequestEvent) {
  const { pathname } = event.url;
  if (!pathname.startsWith('/api')) return null;

  if (!isAllowedSameOriginRequest(event.request, event.url)) {
    return csrfErrorResponse();
  }

  // All applicable scopes are consumed in one consume_rate_limits round-trip;
  // the first violated scope (most specific first) produces the 429.
  const limiterConfigs: ScopedRateLimitConfig[] = [];

  if (AUTH_ATTEMPT_PATHS.has(pathname) && event.request.method === 'POST') {
    limiterConfigs.push({
      scope: 'api-auth-attempt-v2',
      limit: AUTH_ATTEMPT_LIMIT,
      windowMs: AUTH_ATTEMPT_WINDOW_MS,
    });
  }

  if (CHECKOUT_PATHS.has(pathname) && event.request.method === 'POST') {
    limiterConfigs.push({ scope: 'checkout', limit: 20, windowMs: FIFTEEN_MINUTES });
  }

  if (pathname.startsWith('/api/admin')) {
    limiterConfigs.push({ scope: 'admin-api', limit: 100, windowMs: FIFTEEN_MINUTES });
  }

  limiterConfigs.push({
    scope: event.request.method === 'GET' ? 'api-read' : 'api-write',
    limit: event.request.method === 'GET' ? 300 : 120,
    windowMs: FIFTEEN_MINUTES,
  });

  const limited = await rateLimitMany(event, limiterConfigs);
  if (limited) return limited;

  if (!METHODS_WITH_BODY.has(event.request.method)) return null;

  const contentType = event.request.headers.get('content-type')?.toLowerCase() ?? '';
  const contentLength = Number(event.request.headers.get('content-length') ?? 0);
  const hasBody = contentLength > 0 || Boolean(contentType);
  const isUpload = pathname === '/api/products/upload';
  const maxBytes = isUpload ? LIMITS.upload : LIMITS.largeJson;

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return json({ error: 'Payload prea mare.' }, { status: 413 });
  }

  if (!hasBody) return null;

  if (isUpload) {
    if (!contentType.includes('multipart/form-data')) {
      return json({ error: 'Content-Type trebuie să fie multipart/form-data.' }, { status: 415 });
    }
    return null;
  }

  if (!contentType.includes('application/json')) {
    return json({ error: 'Content-Type trebuie să fie application/json.' }, { status: 415 });
  }

  return null;
}

export const handle: Handle = async ({ event, resolve }) => {
  const env = getServerEnv();

  const decoyResponse = await handleSuspiciousDecoyRequest(event);
  if (decoyResponse) {
    setSecurityHeaders(decoyResponse.headers, event, env.publicSupabaseUrl);
    return decoyResponse;
  }

  if (!isAllowedSameOriginRequest(event.request, event.url)) {
    const response = csrfErrorResponse();
    setSecurityHeaders(response.headers, event, env.publicSupabaseUrl);
    return response;
  }

  if (event.url.pathname.startsWith('/admin')) {
    const adminPageLimit = await rateLimit(event, {
      scope: 'admin-page',
      limit: 120,
      windowMs: FIFTEEN_MINUTES,
    });

    if (adminPageLimit) {
      setSecurityHeaders(adminPageLimit.headers, event, env.publicSupabaseUrl);
      return adminPageLimit;
    }
  }

  const blockedResponse = await enforceRequestEnvelope(event);
  if (blockedResponse) {
    setSecurityHeaders(blockedResponse.headers, event, env.publicSupabaseUrl);
    return blockedResponse;
  }

  event.locals.isAdmin = false;
  event.locals.isAuthenticated = false;
  event.locals.user = null;
  event.locals.session = null;

  const token = event.cookies.get(SESSION_COOKIE_NAME);

  if (token) {
    try {
      const resolved = await resolveSessionFromToken(token);

      if (!resolved) {
        clearSessionCookie(event.cookies);
      } else {
        event.locals.isAdmin = resolved.isAdmin;
        event.locals.isAuthenticated = true;
        event.locals.user = resolved.user;
        event.locals.session = {
          sessionId: resolved.sessionId,
          user: resolved.user,
          isAdmin: resolved.isAdmin,
          roles: resolved.roles,
        };

        const timeoutMinutes = getSessionTimeoutMinutes(resolved.roles);
        if (shouldTouchSession(resolved.lastActivityAt)) {
          await touchSession(resolved.sessionId, timeoutMinutes);
          setSessionCookie(event.cookies, token, timeoutMinutes);
        }
      }
    } catch (error) {
      console.error('Session resolution failed', error);
      clearSessionCookie(event.cookies);
    }
  }

  if (event.url.pathname.startsWith('/admin')) {
    if (event.url.pathname === '/admin/login' && event.locals.isAdmin) {
      throw redirect(303, '/admin/dashboard');
    }

    if (event.url.pathname !== '/admin/login' && !event.locals.isAdmin) {
      throw redirect(303, '/admin/login');
    }
  }

  const response = await resolve(event);

  if (event.locals.isAuthenticated) {
    await recordUserActivity(event);
  }

  setSecurityHeaders(response.headers, event, env.publicSupabaseUrl);
  return response;
};

export const handleError: HandleServerError = ({ error, event }) => {
  const requestId = crypto.randomUUID();
  console.error('Unhandled server error', {
    requestId,
    path: event.url.pathname,
    method: event.request.method,
    error,
  });

  return {
    message: 'A apărut o eroare. Încearcă din nou.',
    requestId,
  };
};
