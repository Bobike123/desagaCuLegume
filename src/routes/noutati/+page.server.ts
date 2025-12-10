import { getSupabaseServer } from '$lib/api/supabase';

export async function load() {
  const supabase = getSupabaseServer();

  try {
    const { data: noutati, error } = await supabase
      .from('noutati')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    return {
      noutati: noutati || []
    };
  } catch (err) {
    console.error('Error loading noutati:', err);
    return {
      noutati: []
    };
  }
}
