// src/routes/api/messages/[id]/+server.ts
import { json } from '@sveltejs/kit';

export async function PATCH({ locals, params, request }) {
    if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const read = Boolean(body.read);

    const { data, error } = await locals.supabase
        .from('contact_messages')
        .update({ read })
        .eq('id', params.id)
        .select()
        .single();

    if (error) return json({ error: error.message }, { status: 400 });
    return json({ item: data }, { status: 200 });
}

export async function DELETE({ locals, params }) {
    if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await locals.supabase
        .from('contact_messages')
        .delete()
        .eq('id', params.id);

    if (error) return json({ error: error.message }, { status: 400 });
    return json({ success: true }, { status: 200 });
}
