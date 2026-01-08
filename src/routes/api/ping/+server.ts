import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function GET() {
    return json({
        supabase: {
            hasUrl: !!PUBLIC_SUPABASE_URL,
            hasAnonKey: !!PUBLIC_SUPABASE_ANON_KEY,
            urlPrefix: PUBLIC_SUPABASE_URL ? PUBLIC_SUPABASE_URL.slice(0, 25) : null
        },
        admin: {
            hasEmail: !!import.meta.env.VITE_ADMIN_EMAIL,
            hasPassword: !!import.meta.env.VITE_ADMIN_PASSWORD
        }
    });
}
