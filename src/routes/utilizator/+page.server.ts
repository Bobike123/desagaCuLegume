import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.isAuthenticated || !locals.user) {
    throw redirect(303, '/cont');
  }

  if (locals.isAdmin) {
    throw redirect(303, '/admin/dashboard');
  }

  return {
    user: locals.user,
  };
};
