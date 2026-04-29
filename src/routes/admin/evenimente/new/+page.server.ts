import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.isAdmin) throw redirect(303, '/admin/login');
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.isAdmin) {
      return fail(401, { error: 'Unauthorized' });
    }

    const form = await request.formData();

    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const date = String(form.get('date') ?? '').trim();
    const location = String(form.get('location') ?? '').trim();
    const event_type = String(form.get('event_type') ?? '').trim();
    const image_url = String(form.get('image_url') ?? '').trim();
    const published = form.get('published') === 'true';

    if (!title || !description || !date || !location || !event_type) {
      return fail(400, { error: 'Câmpuri obligatorii lipsă' });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from('events')
      .insert({
        title,
        description,
        date: new Date(date).toISOString(),
        location,
        event_type,
        image_url: image_url || null,
        published,
        published_at: published ? new Date().toISOString() : null
      })
      .select('*')
      .single();

    if (error || !data) {
      return fail(400, { error: error?.message ?? 'Inserarea a eșuat' });
    }

    return {
      success: true,
      createdId: String(data.id)
    };
  }
};
