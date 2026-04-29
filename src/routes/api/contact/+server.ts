import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

function cleanString(value: unknown) {
  return String(value ?? '').trim();
}

export async function POST({ request, locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară pentru trimiterea mesajului.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Administratorii răspund din panoul de mesaje.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  const name = cleanString(body.name || locals.user.fullName || locals.user.username);
  const email = cleanString(body.email || locals.user.email);
  const phone = cleanString(body.phone || locals.user.phone);
  const subject = cleanString(body.subject) || 'Mesaj contact';
  const message = cleanString(body.message);

  if (!message) {
    return json({ error: 'Mesajul este obligatoriu.' }, { status: 400 });
  }

  const messageBody = [
    name ? `Nume: ${name}` : null,
    email ? `Email: ${email}` : null,
    phone ? `Telefon: ${phone}` : null,
    '',
    message,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  try {
    const admin = createAdminClient();

    const { data: conversation, error: conversationError } = await admin
      .from('support_conversations')
      .insert({
        user_id: locals.user.id,
        subject,
        status: 'OPEN',
      })
      .select('conversation_id, subject, status, created_at, updated_at')
      .single();

    if (conversationError) throw conversationError;

    const { data: insertedMessage, error: messageError } = await admin
      .from('support_messages')
      .insert({
        conversation_id: conversation.conversation_id,
        sender_user_id: locals.user.id,
        sender_type: 'USER',
        message_body: messageBody,
        is_read: false,
      })
      .select('message_id, sender_type, message_body, is_read, created_at')
      .single();

    if (messageError) throw messageError;

    return json(
      {
        success: true,
        item: {
          id: String(conversation.conversation_id),
          subject: conversation.subject,
          status: conversation.status,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          message: {
            id: String(insertedMessage.message_id),
            senderType: insertedMessage.sender_type,
            body: insertedMessage.message_body,
            isRead: Boolean(insertedMessage.is_read),
            createdAt: insertedMessage.created_at,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send contact message';
    return json({ error: message }, { status: 400 });
  }
}