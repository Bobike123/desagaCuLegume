import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseServer } from '$lib/api/supabase';
import { validateRequired, handleApiError } from '$lib/helpers';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  event_type: string;
}

// GET all evenimente
export async function GET(event: RequestEvent) {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return json(data || [], { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to fetch events');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}

// POST create new event
export async function POST(event: RequestEvent) {
  try {
    if (!event.locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await event.request.json();
    const { title, description, date, location, image_url, event_type } = body;

    const missing = validateRequired(
      { title, description, date, location },
      ['title', 'description', 'date', 'location']
    );
    if (missing.length > 0) {
      return json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          title,
          description,
          date,
          location,
          image_url: image_url || null,
          event_type: event_type || 'general'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return json(data, { status: 201 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to create event');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}
