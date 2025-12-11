import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { logout } from '$lib/stores/auth';
import { handleApiError } from '$lib/helpers';

export async function POST(event: RequestEvent) {
  try {
    const token = event.cookies.get('auth-token');

    if (token) {
      await logout(); // removed argument
    }

    // Clear auth token cookie
    event.cookies.delete('auth-token', { path: '/' });

    // Clear locals
    event.locals.user = null;
    event.locals.session = null;

    return json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Logout failed');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}
