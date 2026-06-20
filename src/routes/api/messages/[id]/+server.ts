import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta } from '$lib/server/pagination';
import {
  CONVERSATION_SELECT,
  CONVERSATION_STATUSES,
  ORDER_SELECT,
  type SupportConversationRow,
  archiveEligibleConversations,
  mapConversation,
  mapConversationUpdate,
  mapMessage,
  mapOrder,
  mapUser,
} from '$lib/server/support';
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
  const { data, error } = await admin
    .from('support_conversations')
    .select(CONVERSATION_SELECT)
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (error) throw error;
  return data as SupportConversationRow | null;
}

async function fetchOrder(admin: ReturnType<typeof createAdminClient>, orderId: unknown) {
  if (orderId == null) return null;

  const { data, error } = await admin.from('orders').select(ORDER_SELECT).eq('order_id', orderId).maybeSingle();
  if (error) throw error;
  return data;
}

function assertConversationAccess(conversation: SupportConversationRow, locals: App.Locals) {
  if (!locals.isAdmin && conversation.user_id !== locals.user?.id) {
    return json({ error: 'Acces neautorizat.' }, { status: 403 });
  }

  return null;
}

export async function GET({ locals, params, url }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    await archiveEligibleConversations(admin);
    const conversation = await fetchConversation(admin, params.id);
    if (!conversation) return json({ error: 'Conversația nu există.' }, { status: 404 });

    const accessError = assertConversationAccess(conversation, locals);
    if (accessError) return accessError;

    const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });
    const messagesResult = await admin
      .from('support_messages')
      .select('message_id, sender_user_id, sender_type, message_body, is_read, created_at', {
        count: 'exact',
      })
      .eq('conversation_id', conversation.conversation_id)
      .order('created_at', { ascending: true })
      .order('message_id', { ascending: true })
      .range(pagination.offset, pagination.to);
    if (messagesResult.error) throw messagesResult.error;

    const userResult = await admin
      .from('users')
      .select('user_id, email, username, full_name, phone')
      .eq('user_id', conversation.user_id)
      .maybeSingle();
    if (userResult.error) throw userResult.error;

    const order = await fetchOrder(admin, conversation.order_id);

    return json(
      {
        item: mapConversation(conversation, userResult.data, messagesResult.data ?? [], order),
        messagesPage: getPaginationMeta(pagination, messagesResult.count ?? 0),
      },
      { status: 200 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Conversation load failed', error);
    return json({ error: 'Nu am putut încărca conversația.' }, { status: 400 });
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

    const accessError = assertConversationAccess(conversation, locals);
    if (accessError) return accessError;

    if (conversation.status === 'CLOSED' || conversation.status === 'ARCHIVED') {
      return json(
        { error: 'Această conversație este închisă. Nu mai poți trimite mesaje.' },
        { status: 409 }
      );
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
      .update({ updated_at: new Date().toISOString() })
      .eq('conversation_id', conversation.conversation_id);
    if (updateConversation.error) throw updateConversation.error;

    return json({ item: mapMessage(data) }, { status: 201 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Conversation reply failed', error);
    return json({ error: 'Nu am putut trimite răspunsul.' }, { status: 400 });
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

    const accessError = assertConversationAccess(conversation, locals);
    if (accessError) return accessError;

    if (booleanField(body, 'markRead', false)) {
      const senderType = locals.isAdmin ? 'USER' : 'ADMIN';
      const markReadResult = await admin
        .from('support_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversation.conversation_id)
        .eq('sender_type', senderType)
        .eq('is_read', false);
      if (markReadResult.error) throw markReadResult.error;
    }

    const nextStatus = optionalEnumField(body, 'status', CONVERSATION_STATUSES);
    if (nextStatus) {
      // Conversation status is admin-triage state; only the admin UI exposes these
      // controls. Enforce that server-side so a conversation owner cannot
      // close/archive/reopen via a crafted request.
      if (!locals.isAdmin) {
        return json(
          { error: 'Doar administratorii pot schimba statusul conversației.' },
          { status: 403 }
        );
      }

      const now = new Date().toISOString();
      const statusResult = await admin
        .from('support_conversations')
        .update({
          status: nextStatus,
          closed_at:
            nextStatus === 'OPEN'
              ? null
              : nextStatus === 'CLOSED'
                ? conversation.closed_at ?? now
                : conversation.closed_at ?? now,
          updated_at: now,
        })
        .eq('conversation_id', conversation.conversation_id);
      if (statusResult.error) throw statusResult.error;
    }

    const updated = await fetchConversation(admin, String(conversation.conversation_id));
    return json({ item: mapConversationUpdate(updated) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Conversation update failed', error);
    return json({ error: 'Nu am putut actualiza conversația.' }, { status: 400 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
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

    console.error('Conversation close failed', error);
    return json({ error: 'Nu am putut închide conversația.' }, { status: 400 });
  }
}
