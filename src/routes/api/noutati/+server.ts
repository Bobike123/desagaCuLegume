import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseServer } from '$lib/api/supabase';
import { validateRequired, handleApiError } from '$lib/helpers';

interface Noutate {
  id: string;
  title: string;
  content: string;
  image_url: string;
  date: string;
  published: boolean;
}

// GET all noutati
export async function GET(event: RequestEvent) {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('noutati')
      .select('*')
      .eq('published', true)
      .order('date', { ascending: false });

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
    // Check authentication
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

    const supabase = supabaseServer();
    const { data, error } = await supabase
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
