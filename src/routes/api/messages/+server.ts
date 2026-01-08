// src/routes/api/messages/+server.ts
import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
    if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await locals.supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return json({ error: error.message }, { status: 400 });
    return json({ items: data ?? [] }, { status: 200 });
}
