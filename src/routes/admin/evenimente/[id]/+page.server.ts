// src/routes/admin/evenimente/[id]/+page.server.ts
import { redirect, error as kitError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const TABLE = 'events'

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.isAdmin) throw redirect(303, '/admin/login');

  const { data, error } = await locals.supabase
    .from(TABLE)
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) throw kitError(404, 'Eveniment inexistent');

  return { item: data };
};
