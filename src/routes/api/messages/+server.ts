import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { SUPPORT_TOPICS } from '$lib/support-messages';
import { getPagination, getPaginationMeta } from '$lib/server/pagination';
import {
  CONVERSATION_SELECT,
  CONVERSATION_STATUSES,
  getUserOrder,
  loadConversationSummaries,
  mapOrder,
} from '$lib/server/support';
import {
  LIMITS,
  optionalEnumField,
  readJsonBody,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

function buildSubject(topic: string, subject: string, order: any) {
  if (subject) return subject;
  if (order) return `Comandă #${order.order_number}`;
  if (topic === 'DELIVERY') return 'Livrare / ridicare';
  if (topic === 'PAYMENT') return 'Întrebare despre plată';
  if (topic === 'PRODUCT_AVAILABILITY') return 'Disponibilitate produs';
  if (topic === 'RETURN') return 'Retur / reclamație';
  if (topic === 'HORECA') return 'HORECA';
  return 'Întrebare generală';
}

async function createConversation(admin: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  const { data, error } = await admin
    .from('support_conversations')
    .insert(payload)
    .select(CONVERSATION_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function GET({ locals, url }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const pagination = getPagination(url, { defaultLimit: 30, maxLimit: 100 });
    const status = optionalEnumField(
      { status: url.searchParams.get('status') },
      'status',
      CONVERSATION_STATUSES
    );
    const topic = optionalEnumField({ topic: url.searchParams.get('topic') }, 'topic', SUPPORT_TOPICS);
    const search = stringField({ q: url.searchParams.get('q') }, 'q', {
      max: 120,
      fieldLabel: 'Căutarea',
    });

    const admin = createAdminClient();
    // Closed→archived promotion runs in pg_cron (run_archive_support,
    // 20260710_07) instead of as a write inside every list read.
    const result = await loadConversationSummaries(admin, locals, pagination, {
      status,
      topic,
      search,
    });

    return json(
      {
        items: result.items,
        page: getPaginationMeta(pagination, result.total),
      },
      { status: 200 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Messages load failed', error);
    return json({ error: 'Nu am putut încărca mesajele.', requestId }, { status: 400 });
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
    const requestedTopic = optionalEnumField(body, 'topic', SUPPORT_TOPICS);
    const orderId = body.orderId == null || body.orderId === '' ? null : requireNumericId(body.orderId, 'ID comandă');
    const subject = stringField(body, 'subject', { max: 140, fieldLabel: 'Subiectul' });
    const messageBody = stringField(body, 'message', {
      required: true,
      max: LIMITS.message,
      fieldLabel: 'Mesajul',
    });

    const admin = createAdminClient();
    const order = orderId ? await getUserOrder(admin, orderId, locals.user.id) : null;
    if (orderId && !order) return json({ error: 'Comanda nu a fost găsită.' }, { status: 404 });

    const topic = requestedTopic ?? (order ? 'ORDER' : 'GENERAL');
    const conversation = await createConversation(admin, {
      user_id: locals.user.id,
      subject: buildSubject(topic, subject, order),
      status: 'OPEN',
      topic,
      order_id: order ? order.order_id : null,
    });

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
          topic,
          orderId: conversation.order_id != null ? String(conversation.order_id) : order ? String(order.order_id) : null,
          order: mapOrder(order),
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

    const requestId = logRouteError('Conversation create failed', error);
    return json({ error: 'Nu am putut crea conversația.', requestId }, { status: 400 });
  }
}
