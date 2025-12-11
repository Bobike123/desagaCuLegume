import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getSession } from '$lib/stores/auth';

export async function GET({ cookies }: RequestEvent) {
    try {
        const token = cookies.get('auth-token');

        if (!token) {
            return json({ user: null, isAdmin: false });
        }

        const { user, isAdmin, error } = await getSession(token);

        if (error) {
            return json({ user: null, isAdmin: false, error }, { status: 401 });
        }

        return json({ user, isAdmin });
    } catch (err) {
        return json(
            { user: null, isAdmin: false, error: 'Session check failed' },
            { status: 500 }
        );
    }
}
