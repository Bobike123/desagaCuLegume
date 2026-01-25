// FILE: src/hooks.server.ts

import { createServerClient } from "@supabase/ssr";
import { redirect, type Handle } from "@sveltejs/kit";
import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get: (name: string) => event.cookies.get(name),
                set: (name: string, value: string, options: any) =>
                    event.cookies.set(name, value, { ...options, path: "/" }),
                remove: (name: string, options: any) =>
                    event.cookies.delete(name, { ...options, path: "/" }),
            },
        }
    );

    // Cookie-only admin auth (no Supabase auth session/user)
    event.locals.isAdmin = event.cookies.get("admin") === "1";

    if (
        event.url.pathname.startsWith("/admin") &&
        event.url.pathname !== "/admin/login"
    ) {
        if (!event.locals.isAdmin) throw redirect(303, "/admin/login");
    }

    return resolve(event);
};
