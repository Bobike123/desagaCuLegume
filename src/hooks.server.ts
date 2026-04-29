import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { clearSessionCookie, resolveSessionFromToken, touchSession } from '$lib/server/auth';
import { SESSION_COOKIE_NAME } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
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
