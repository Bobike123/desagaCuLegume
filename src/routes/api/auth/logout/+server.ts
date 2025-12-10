import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseServer } from '$lib/api/supabase';
import { handleApiError } from '$lib/helpers';

export async function POST({ locals }: RequestEvent) {
  try {
    const supabase = supabaseServer(); // Call without arguments

    // Sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    // Clear locals
    locals.user = null;
    locals.session = null;

    return json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Logout failed');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}