import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseServer } from '$lib/api/supabase';
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

    const supabase = supabaseServer();

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return json({ error: 'No session created' }, { status: 400 });
    }

    // Set session cookie (optional - depends on your auth flow)
    event.locals.session = data.session;
    event.locals.user = data.user;

    return json({
      success: true,
      user: data.user,
      session: data.session
    }, { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Login failed');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}
