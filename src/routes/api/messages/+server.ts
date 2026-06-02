import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { LIMITS, readJsonBody, stringField, validationErrorResponse } from '$lib/server/validation';

function mapConversation(row: any, userMap: Map<number, any>, messagesByConversation: Map<number, any[]>) {
  const messages = messagesByConversation.get(row.conversation_id) ?? [];
  const lastMessage = messages[messages.length - 1] ?? null;
  const unreadCount = messages.filter((message) => {
    if (row.__viewer === 'ADMIN') return message.sender_type === 'USER' && !message.is_read;
    return message.sender_type === 'ADMIN' && !message.is_read;
  }).length;

  const user = userMap.get(row.user_id);

  return {
    id: String(row.conversation_id),
    subject: row.subject,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: user
      ? {
          id: String(user.user_id),
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          phone: user.phone,
        }
      : null,
    lastMessage: lastMessage
      ? {
          id: String(lastMessage.message_id),
          body: lastMessage.message_body,
          senderType: lastMessage.sender_type,
          createdAt: lastMessage.created_at,
        }
      : null,
    unreadCount,
  };
}

export async function GET({ locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    let query = admin
      .from('support_conversations')
      .select('conversation_id, user_id, subject, status, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (!locals.isAdmin) {
      query = query.eq('user_id', locals.user.id);
    }

    const { data: conversations, error } = await query;
    if (error) throw error;

    const rows = (conversations ?? []).map((row: any) => ({ ...row, __viewer: locals.isAdmin ? 'ADMIN' : 'USER' }));
    const conversationIds = rows.map((row: any) => row.conversation_id);
    const userIds = [...new Set(rows.map((row: any) => row.user_id))];

    const messageResult = conversationIds.length
      ? await admin
          .from('support_messages')
          .select('message_id, conversation_id, sender_user_id, sender_type, message_body, is_read, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true })
      : { data: [], error: null };

    if (messageResult.error) throw messageResult.error;

    const userResult = userIds.length
      ? await admin.from('users').select('user_id, email, username, full_name, phone').in('user_id', userIds)
      : { data: [], error: null };

    if (userResult.error) throw userResult.error;

    const userMap = new Map((userResult.data ?? []).map((row: any) => [row.user_id, row]));
    const messagesByConversation = new Map<number, any[]>();

    for (const message of messageResult.data ?? []) {
      const list = messagesByConversation.get(message.conversation_id) ?? [];
      list.push(message);
      messagesByConversation.set(message.conversation_id, list);
    }

    return json({ items: rows.map((row: any) => mapConversation(row, userMap, messagesByConversation)) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load messages';
    return json({ error: message }, { status: 400 });
  }
}

export async function POST({ locals, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Administratorii răspund din conversații existente.' }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const subject = stringField(body, 'subject', { max: 140, fieldLabel: 'Subiectul' }) || 'Mesaj nou';
    const messageBody = stringField(body, 'message', {
      required: true,
      max: LIMITS.message,
      fieldLabel: 'Mesajul',
    });

    const admin = createAdminClient();
    const { data: conversation, error: conversationError } = await admin
      .from('support_conversations')
      .insert({
        user_id: locals.user.id,
        subject,
        status: 'OPEN',
      })
      .select('conversation_id, user_id, subject, status, created_at, updated_at')
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
      .select('message_id, conversation_id, sender_user_id, sender_type, message_body, is_read, created_at')
      .single();

    if (messageError) throw messageError;

    return json(
      {
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
            createdAt: insertedMessage.created_at,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to create conversation';
    return json({ error: message }, { status: 400 });
  }
}
