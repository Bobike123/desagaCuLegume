import { supabaseServer } from '$lib/api/supabase';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
  const supabase = supabaseServer();
  const category = url.searchParams.get('category');

  try {
    let query = supabase.from('products').select('*').eq('in_stock', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return json(data || []);
  } catch (err) {
    return json({ error: err.message }, { status: 400 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServer();
  const formData = await request.json();

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([formData])
      .select();

    if (error) throw error;
    return json(data, { status: 201 });
  } catch (err) {
    return json({ error: err.message }, { status: 400 });
  }
}
