import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { validateRequired, handleApiError } from '$lib/helpers';

// GET all noutati
export async function GET(event: RequestEvent) {
  try {
    const { data, error } = await event.locals.supabase
      .from('noutati')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return json(data || [], { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to fetch noutati');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}

// POST create new noutate
export async function POST(event: RequestEvent) {
  try {
    // Check authentication using event.locals.user
    if (!event.locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await event.request.json();
    const { title, content, image_url } = body;

    // Validate required fields
    const missing = validateRequired({ title, content }, ['title', 'content']);
    if (missing.length > 0) {
      return json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // Use event.locals.supabase
    const { data, error } = await event.locals.supabase
      .from('noutati')
      .insert([
        {
          title,
          content,
          image_url: image_url || null,
          date: new Date().toISOString(),
          published: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return json(data, { status: 201 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to create noutate');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}
