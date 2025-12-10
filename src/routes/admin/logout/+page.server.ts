import { supabase } from '$lib/api/supabase';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    await supabase.auth.signOut();
  }
  throw redirect(302, '/');
};

export const actions: Actions = {
  default: async () => {
    await supabase.auth.signOut();
    throw redirect(302, '/');
  }
};
