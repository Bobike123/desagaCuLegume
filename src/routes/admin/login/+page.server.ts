import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
    // If already logged in, redirect to dashboard
    if (locals.user) {
        throw redirect(302, '/admin/dashboard');
    }

    return {};
}
