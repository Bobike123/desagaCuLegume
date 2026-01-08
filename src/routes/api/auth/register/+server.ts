import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  try {
    const { email, password } = await request.json();

    const { data, error } = await locals.supabase.auth.signUp({ email, password });
    if (error) return json({ error: error.message }, { status: 400 });

    return json({ success: true, user: data.user }, { status: 200 });
  } catch {
    return json({ error: 'Register failed' }, { status: 500 });
  }
}
