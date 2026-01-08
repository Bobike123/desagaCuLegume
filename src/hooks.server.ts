// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            get: (name: string) => event.cookies.get(name),
            set: (name: string, value: string, options: any) =>
                event.cookies.set(name, value, { ...options, path: '/' }),
            remove: (name: string, options: any) =>
                event.cookies.delete(name, { ...options, path: '/' })
        }
    });

    event.locals.getSession = async () => {
        const { data } = await event.locals.supabase.auth.getSession();
        return data.session;
    };

    const session = await event.locals.getSession();
    event.locals.session = session;
    event.locals.user = session?.user ?? null;

    event.locals.isAdmin = event.cookies.get('admin') === '1';

    if (event.url.pathname.startsWith('/admin') && event.url.pathname !== '/admin/login') {
        if (!event.locals.isAdmin) throw redirect(303, '/admin/login');
    }

    return resolve(event);
};
