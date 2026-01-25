// FILE: src/routes/api/contact/+server.ts
// Conforms to table: contact_messages(id, name, email, phone(string), subject, message, created_at, read)

import { json } from "@sveltejs/kit";

export async function POST({ request, locals }) {
    const { name, email, phone, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
        return json({ error: "Missing fields" }, { status: 400 });
    }

    const phoneStr =
        phone === undefined || phone === null ? null : String(phone).trim() || null;

    const { error } = await locals.supabase.from("contact_messages").insert({
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phoneStr, // phone is string or null
        subject: String(subject).trim(),
        message: String(message).trim(),
        read: false,
        // created_at handled by DB default timestamptz
    });

    if (error) {
        return json({ error: error.message }, { status: 400 });
    }

    return json({ success: true }, { status: 200 });
}
