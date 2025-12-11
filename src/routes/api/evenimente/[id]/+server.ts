import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseServer } from '$lib/api/supabase';
import { isValidUUID, handleApiError } from '$lib/helpers';

// GET single event
export async function GET(event: RequestEvent) {
  try {
    const { id } = event.params;

    if (!isValidUUID(id)) {
      return json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return json({ error: 'Event not found' }, { status: 404 });
      }
      throw error;
    }

    return json(data, { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to fetch event');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}

// PATCH update event
export async function PATCH(event: RequestEvent) {
  try {
    if (!event.locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = event.params;
    if (!isValidUUID(id)) {
      return json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const body = await event.request.json();
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from('events')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return json(data, { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to update event');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}

// DELETE event
export async function DELETE(event: RequestEvent) {
  try {
    if (!event.locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = event.params;
    if (!isValidUUID(id)) {
      return json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return json({ success: true }, { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to delete event');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}
