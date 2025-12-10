import { supabase } from '$lib/api/supabase';
import { redirect } from '@sveltejs/kit';

export async function POST() {
  await supabase.auth.signOut();
  throw redirect(302, '/');
}

export async function load({ locals }) {
  if (locals.user) {
    // Perform logout
    await supabase.auth.signOut();
  }
  throw redirect(302, '/');
}
