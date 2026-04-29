import { redirect, error as kitError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.isAdmin) throw redirect(303, '/admin/login');

  const { data, error } = await createAdminClient()
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) throw kitError(404, 'Eveniment inexistent');

  return { item: data };
};
