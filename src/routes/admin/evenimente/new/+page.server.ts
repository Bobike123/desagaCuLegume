// src/routes/admin/evenimente/new/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();

    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const date = String(form.get('date') ?? '').trim();
    const location = String(form.get('location') ?? '').trim();
    const event_type = String(form.get('event_type') ?? '').trim();
    const image_url = String(form.get('image_url') ?? '').trim();
    const published = form.get('published') === 'on';

    if (!title || !description || !date || !location || !event_type) {
      return fail(400, { error: 'Câmpuri obligatorii lipsă' });
    }

    const { data, error } = await locals.supabase
      .from('events')
      .insert({
        title,
        description,
        date,
        location,
        event_type,
        image_url: image_url || null,
        published,
        published_at: published ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error || !data) {
      return fail(400, { error: error?.message ?? 'Inserarea a eșuat' });
    }

    return {
      success: true,
      createdId: data.id
    };
  }
};
