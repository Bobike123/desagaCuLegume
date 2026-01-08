import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
  const supabase = locals.supabase;
  const category = url.searchParams.get('category');

  try {
    let query = supabase.from('products').select('*').eq('in_stock', true);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;

    return json(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, { status: 400 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = locals.supabase;
  const payload = await request.json();

  try {
    const { data, error } = await supabase.from('products').insert([payload]).select('*');
    if (error) throw error;

    return json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, { status: 400 });
  }
}
