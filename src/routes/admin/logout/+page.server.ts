import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { clearSessionCookie, getRequestMeta, logoutSession } from '$lib/server/auth';
import { SESSION_COOKIE_NAME } from '$lib/server/supabase';

async function destroySession(request: Request, cookies: import('@sveltejs/kit').Cookies) {
  const token = cookies.get(SESSION_COOKIE_NAME);

  if (token) {
    try {
      await logoutSession(token, getRequestMeta(request));
    } catch (error) {
      console.error('Admin logout failed', error);
    }
  }

  clearSessionCookie(cookies);
}

export const load: PageServerLoad = async ({ request, cookies }) => {
  await destroySession(request, cookies);
  throw redirect(302, '/');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    await destroySession(request, cookies);
    throw redirect(302, '/');
  },
};
