import { json } from '@sveltejs/kit';
import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import { env } from '$env/dynamic/private';

export function GET({ locals }) {
    if (!locals.isAdmin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    return json({
        supabase: {
            hasUrl: Boolean(PUBLIC_SUPABASE_URL),
            hasAnonKey: Boolean(PUBLIC_SUPABASE_ANON_KEY)
        },
        admin: {
            hasEmail: Boolean(env.ADMIN_EMAIL),
            hasPassword: Boolean(env.ADMIN_PASSWORD)
        }
    });
}
