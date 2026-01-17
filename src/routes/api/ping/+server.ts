import { json } from '@sveltejs/kit';
import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import {
    VITE_ADMIN_EMAIL,
    VITE_ADMIN_PASSWORD
} from '$env/static/private';

export function GET() {
    return json({
        supabase: {
            hasUrl: Boolean(PUBLIC_SUPABASE_URL),
            hasAnonKey: Boolean(PUBLIC_SUPABASE_ANON_KEY),
            urlPrefix: PUBLIC_SUPABASE_URL
                ? PUBLIC_SUPABASE_URL.slice(0, 25)
                : null
        },
        admin: {
            hasEmail: Boolean(VITE_ADMIN_EMAIL),
            hasPassword: Boolean(VITE_ADMIN_PASSWORD)
        }
    });
}
