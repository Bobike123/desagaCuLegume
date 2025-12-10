import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseServer } from '$lib/api/supabase';
import { isValidEmail, isStrongPassword, validateRequired, handleApiError } from '$lib/helpers';

export async function POST(event: RequestEvent) {
  try {
    const body = await event.request.json();
    const { email, password, name } = body;

    // Validate required fields
    const missing = validateRequired({ email, password, name }, ['email', 'password', 'name']);
    if (missing.length > 0) {
      return json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return json({
        error: 'Password must be at least 8 characters with 1 uppercase letter and 1 number'
      }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({
      success: true,
      message: 'Registration successful. Please check your email to confirm.',
      user: data.user
    }, { status: 201 });
  } catch (err) {
    const errorData = handleApiError(err, 'Registration failed');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}
