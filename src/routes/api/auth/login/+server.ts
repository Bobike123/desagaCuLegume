import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isValidEmail, validateRequired, handleApiError } from '$lib/helpers';

export async function POST(event: RequestEvent) {
  try {
    const body = await event.request.json();
    const { email, password } = body;

    // Validate required fields
    const missing = validateRequired({ email, password }, ['email', 'password']);
    if (missing.length > 0) {
      return json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Use event.locals.supabase from hooks
    const { data, error } = await event.locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return json({ error: 'No session created' }, { status: 400 });
    }

    // Set auth token in HTTP-only cookie
    event.cookies.set('auth-token', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set locals
    event.locals.session = data.session;
    event.locals.user = data.user;

    return json({
      success: true,
      user: data.user,
      session: data.session
    }, { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return json({ error: 'Login failed' }, { status: 500 });
  }
}
