import { supabaseServer } from '$lib/api/supabase';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const supabase = supabaseServer();

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    return json(data);
  } catch (err) {
    return json({ error: err.message }, { status: 400 });
  }
}

export async function PUT({ params, request, locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServer();
  const formData = await request.json();

  try {
    const { data, error } = await supabase
      .from('products')
      .update(formData)
      .eq('id', params.id)
      .select();

    if (error) throw error;
    return json(data);
  } catch (err) {
    return json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE({ params, locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServer();

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return json({ success: true });
  } catch (err) {
    return json({ error: err.message }, { status: 400 });
  }
}
