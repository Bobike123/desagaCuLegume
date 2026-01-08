import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    const { name, email, phone, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
        return json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await locals.supabase
        .from('contact_messages')
        .insert({
            name,
            email,
            phone: phone || null,
            subject,
            message,
            read: false
        });

    if (error) {
        return json({ error: error.message }, { status: 400 });
    }

    return json({ success: true }, { status: 200 });
}
