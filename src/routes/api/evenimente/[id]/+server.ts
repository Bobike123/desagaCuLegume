import { json } from '@sveltejs/kit';

export async function GET({ params, locals }) {
  const supabase = locals.supabase;

  try {
    const { data, error } = await supabase
      .from('evenimente')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    return json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return json({ error: msg }, { status: 400 });
  }
}

export async function PATCH({ params, request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = locals.supabase;
  const payload = await request.json();

  try {
    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) throw error;
    return json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return json({ error: msg }, { status: 400 });
  }
}

export async function DELETE({ params, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = locals.supabase;

  try {
    const { error } = await supabase.from('evenimente').delete().eq('id', params.id);
    if (error) throw error;
    return json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return json({ error: msg }, { status: 400 });
  }
}
