import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabaseServer } from '$lib/api/supabase';

export async function load({ locals }) {
    // If already logged in, redirect to dashboard
    if (locals.user) {
        throw redirect(302, '/admin/dashboard');
    }

    return {};
}

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const supabase = supabaseServer();
        const email = import.meta.env.ADMIN_EMAIL;
        const password = import.meta.env.ADMIN_PASSWORD;

        if (!email || !password) {
            return fail(400, { message: 'Email și parolă sunt necesare' });
        }

        try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                return fail(401, { message: 'Email sau parolă incorectă' });
            }

            if (!authData.user) {
                return fail(401, { message: 'Autentificare eșuată' });
            }

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (userError || userData?.role !== 'admin') {
                await supabase.auth.signOut();
                return fail(403, { message: 'Acces neautorizat' });
            }

            // Set auth cookie
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
                cookies.set('sb-auth-token', sessionData.session.access_token, {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                });
            }

            throw redirect(303, '/admin/dashboard');
        } catch (err) {
            if (err instanceof Error && 'status' in err) {
                throw err;
            }
            console.error('Login error:', err);
            return fail(500, { message: 'A apărut o eroare. Încearcă din nou!' });
        }
    },
};
