import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
  const supabase = locals.supabase;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return json(data ?? []);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return json({ error: msg }, { status: 400 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = locals.supabase;
  const payload = await request.json();

  try {
    const { data, error } = await supabase.from('evenimente').insert([payload]).select('*');
    if (error) throw error;
    return json(data, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return json({ error: msg }, { status: 400 });
  }
}
