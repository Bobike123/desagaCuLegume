import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  booleanField,
  enumField,
  LIMITS,
  parseIsoDate,
  safeUrl,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

const EVENT_TYPES = ['FESTIVAL', 'PIATA', 'ATELIER'] as const;

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.isAdmin) throw redirect(303, '/admin/login');
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.isAdmin) {
      return fail(401, { error: 'Unauthorized' });
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > LIMITS.largeJson) {
      return fail(413, { error: 'Payload prea mare.' });
    }

    const form = await request.formData();
    const payload = Object.fromEntries(form.entries());

    let row;
    try {
      const published = booleanField(payload, 'published', false);
      const date = parseIsoDate(stringField(payload, 'date', { required: true, max: 80, fieldLabel: 'Data' }), 'Data');

      row = {
        title: stringField(payload, 'title', { required: true, max: 180, fieldLabel: 'Titlul' }),
        description: stringField(payload, 'description', {
          required: true,
          max: LIMITS.longText,
          fieldLabel: 'Descrierea',
        }),
        date,
        location: stringField(payload, 'location', { required: true, max: 180, fieldLabel: 'Locația' }),
        event_type: enumField(payload, 'event_type', EVENT_TYPES, 'FESTIVAL').toLowerCase(),
        image_url: safeUrl(payload.image_url),
        published,
        published_at: published ? new Date().toISOString() : null
      };
    } catch (error) {
      const validation = validationErrorResponse(error);
      if (validation) {
        const body = await validation.json().catch(() => ({ error: 'Payload invalid.' }));
        return fail(validation.status, { error: body?.error ?? 'Payload invalid.' });
      }

      return fail(400, { error: 'Payload invalid.' });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from('events')
      .insert(row)
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
