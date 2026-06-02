import { createServerClient } from '@supabase/ssr';
import { json, redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { clearSessionCookie, resolveSessionFromToken, touchSession } from '$lib/server/auth';
import { rateLimit } from '$lib/server/rate-limit';
import { SESSION_COOKIE_NAME } from '$lib/server/supabase';
import { LIMITS } from '$lib/server/validation';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);
const AUTH_ATTEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/change-password',
]);

function enforceRequestEnvelope(event: RequestEvent) {
  const { pathname } = event.url;
  if (!pathname.startsWith('/api')) return null;

  const isAuthAttempt = AUTH_ATTEMPT_PATHS.has(pathname) && event.request.method === 'POST';
  const authLimit = isAuthAttempt
    ? rateLimit(event, { scope: 'api-auth-attempt', limit: 5, windowMs: FIFTEEN_MINUTES })
    : null;

  if (authLimit) return authLimit;

  const generalLimit = rateLimit(event, {
    scope: event.request.method === 'GET' ? 'api-read' : 'api-write',
    limit: event.request.method === 'GET' ? 300 : 120,
    windowMs: FIFTEEN_MINUTES,
  });

  if (generalLimit) return generalLimit;

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
  const blockedResponse = enforceRequestEnvelope(event);
  if (blockedResponse) return blockedResponse;

  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (name: string) => event.cookies.get(name),
      set: (name: string, value: string, options: any) =>
        event.cookies.set(name, value, { ...options, path: '/' }),
      remove: (name: string, options: any) =>
        event.cookies.delete(name, { ...options, path: '/' }),
    },
  });

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

        await touchSession(resolved.sessionId);
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

  return resolve(event);
};
