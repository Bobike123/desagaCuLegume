import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;


const supabase: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            get: (key) => event.cookies.get(key),
            set: (key, value, options) => {
                event.cookies.set(key, value, { ...options, path: '/' });
            },
            remove: (key, options) => {
                event.cookies.delete(key, { ...options, path: '/' });
            }
        }
    });

    event.locals.getSession = async () => {
        const {
            data: { session }
        } = await event.locals.supabase.auth.getSession();
        return session;
    };

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range';
        }
    });
};

const authGuard: Handle = async ({ event, resolve }) => {
    const session = await event.locals.getSession();
    event.locals.session = session;
    event.locals.user = session?.user ?? null;

    // Protect admin routes
    if (event.url.pathname.startsWith('/admin')) {
        if (!session) {
            throw redirect(303, '/admin/login');
        }
    }

    return resolve(event);
};

export const handle = sequence(supabase, authGuard);
