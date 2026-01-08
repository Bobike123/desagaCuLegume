import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

/**
 * On page load, sign the user out if authenticated and redirect to the home page.
 */
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    await locals.supabase.auth.signOut();
    locals.user = null;
    locals.session = null;
  }
  throw redirect(302, '/');
};

export const actions: Actions = {
  default: async ({ locals }) => {
    await locals.supabase.auth.signOut();
    locals.user = null;
    locals.session = null;
    throw redirect(302, '/');
  }
};
