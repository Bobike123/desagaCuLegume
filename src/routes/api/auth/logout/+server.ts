import { json } from '@sveltejs/kit';
import { clearSessionCookie, getRequestMeta, logoutSession } from '$lib/server/auth';
import { SESSION_COOKIE_NAME } from '$lib/server/supabase';

export async function POST({ request, cookies, getClientAddress }) {
  const token = cookies.get(SESSION_COOKIE_NAME);

  if (token) {
    try {
      await logoutSession(token, getRequestMeta(request, getClientAddress()));
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  clearSessionCookie(cookies);
  return json({ success: true }, { status: 200 });
}
