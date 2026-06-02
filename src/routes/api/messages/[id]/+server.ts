import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  booleanField,
  LIMITS,
  optionalEnumField,
  readJsonBody,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

async function fetchConversation(admin: ReturnType<typeof createAdminClient>, id: string) {
  const conversationId = requireNumericId(id, 'ID conversație');
  const conversationResult = await admin
    .from('support_conversations')
    .select('conversation_id, user_id, subject, status, created_at, updated_at')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (conversationResult.error) throw conversationResult.error;
  return conversationResult.data;
}

export async function GET({ locals, params }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const conversation = await fetchConversation(admin, params.id);
    if (!conversation) return json({ error: 'Conversația nu există.' }, { status: 404 });

    if (!locals.isAdmin && conversation.user_id !== locals.user.id) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const messagesResult = await admin
      .from('support_messages')
      .select('message_id, sender_user_id, sender_type, message_body, is_read, created_at')
      .eq('conversation_id', conversation.conversation_id)
      .order('created_at', { ascending: true });
    if (messagesResult.error) throw messagesResult.error;

    const userResult = await admin
      .from('users')
      .select('user_id, email, username, full_name, phone')
      .eq('user_id', conversation.user_id)
      .maybeSingle();
    if (userResult.error) throw userResult.error;

    return json(
      {
        item: {
          id: String(conversation.conversation_id),
          subject: conversation.subject,
          status: conversation.status,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          user: userResult.data
            ? {
                id: String(userResult.data.user_id),
                email: userResult.data.email,
                username: userResult.data.username,
                fullName: userResult.data.full_name,
                phone: userResult.data.phone,
              }
            : null,
          messages: (messagesResult.data ?? []).map((message: any) => ({
            id: String(message.message_id),
            senderUserId: message.sender_user_id != null ? String(message.sender_user_id) : null,
            senderType: message.sender_type,
            body: message.message_body,
            isRead: Boolean(message.is_read),
            createdAt: message.created_at,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to load conversation';
    return json({ error: message }, { status: 400 });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const messageBody = stringField(body, 'message', {
      required: true,
      max: LIMITS.message,
      fieldLabel: 'Mesajul',
    });

    const admin = createAdminClient();
    const conversation = await fetchConversation(admin, params.id);
    if (!conversation) return json({ error: 'Conversația nu există.' }, { status: 404 });

    if (!locals.isAdmin && conversation.user_id !== locals.user.id) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await admin
      .from('support_messages')
      .insert({
        conversation_id: conversation.conversation_id,
        sender_user_id: locals.user.id,
        sender_type: locals.isAdmin ? 'ADMIN' : 'USER',
        message_body: messageBody,
        is_read: false,
      })
      .select('message_id, sender_user_id, sender_type, message_body, is_read, created_at')
      .single();

    if (error) throw error;

    const updateConversation = await admin
      .from('support_conversations')
      .update({ status: 'OPEN', updated_at: new Date().toISOString() })
      .eq('conversation_id', conversation.conversation_id);
    if (updateConversation.error) throw updateConversation.error;

    return json(
      {
        item: {
          id: String(data.message_id),
          senderUserId: data.sender_user_id != null ? String(data.sender_user_id) : null,
          senderType: data.sender_type,
          body: data.message_body,
          isRead: Boolean(data.is_read),
          createdAt: data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to send reply';
    return json({ error: message }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const admin = createAdminClient();
    const conversation = await fetchConversation(admin, params.id);
    if (!conversation) return json({ error: 'Conversația nu există.' }, { status: 404 });

    if (!locals.isAdmin && conversation.user_id !== locals.user.id) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (booleanField(body, 'markRead', false)) {
      const senderType = locals.isAdmin ? 'USER' : 'ADMIN';
      const markReadResult = await admin
        .from('support_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversation.conversation_id)
        .eq('sender_type', senderType);
      if (markReadResult.error) throw markReadResult.error;
    }

    const nextStatus = optionalEnumField(body, 'status', ['OPEN', 'CLOSED', 'ARCHIVED']);
    if (nextStatus) {
      const statusResult = await admin
        .from('support_conversations')
        .update({
          status: nextStatus,
          closed_at: nextStatus === 'CLOSED' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversation.conversation_id);
      if (statusResult.error) throw statusResult.error;
    }

    const updated = await fetchConversation(admin, String(conversation.conversation_id));
    return json({ item: updated }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to update conversation';
    return json({ error: message }, { status: 400 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const conversationId = requireNumericId(params.id, 'ID conversație');
    const { error } = await admin
      .from('support_conversations')
      .update({
        status: 'CLOSED',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId);
    if (error) throw error;

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to close conversation';
    return json({ error: message }, { status: 400 });
  }
}
