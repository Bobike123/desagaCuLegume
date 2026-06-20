import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta } from '$lib/server/pagination';
import {
  CONVERSATION_SELECT,
  ORDER_SELECT,
  getUserOrder,
  loadConversationSummaries,
  mapMessage,
  mapOrder,
} from '$lib/server/support';
import {
  LIMITS,
  readJsonBody,
  requireNumericId,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

async function findOpenConversationForOrder(
  admin: ReturnType<typeof createAdminClient>,
  userId: number,
  orderId: string
) {
  const { data, error } = await admin
    .from('support_conversations')
    .select(CONVERSATION_SELECT)
    .eq('user_id', userId)
    .eq('order_id', orderId)
    .neq('status', 'CLOSED')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}

async function createOrderConversation(admin: ReturnType<typeof createAdminClient>, userId: number, order: any) {
  const { data, error } = await admin
    .from('support_conversations')
    .insert({
      user_id: userId,
      subject: `Comandă ${order.order_number}`,
      status: 'OPEN',
      topic: 'ORDER',
      order_id: order.order_id,
    })
    .select(CONVERSATION_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function GET({ locals, url }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Administratorii folosesc panoul de mesaje.' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const pagination = getPagination(url, { defaultLimit: 30, maxLimit: 100 });

    const { data: orders, error: ordersError, count } = await admin
      .from('orders')
      .select(ORDER_SELECT, { count: 'exact' })
      .eq('user_id', locals.user.id)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.to);

    if (ordersError) throw ordersError;

    const summaryPagination = {
      page: 1,
      limit: 100,
      offset: 0,
      to: 99,
    };
    const summaries = await loadConversationSummaries(admin, locals, summaryPagination, { topic: 'ORDER' });
    const conversationsByOrder = new Map<string, any[]>();

    for (const conversation of summaries.items) {
      if (!conversation.orderId) continue;
      const existing = conversationsByOrder.get(conversation.orderId) ?? [];
      existing.push(conversation);
      conversationsByOrder.set(conversation.orderId, existing);
    }

    const mappedOrders = (orders ?? []).map((order: any) => ({
      ...mapOrder(order),
      conversations: conversationsByOrder.get(String(order.order_id)) ?? [],
    }));

    return json(
      {
        orders: mappedOrders,
        page: getPaginationMeta(pagination, count ?? 0),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact data load failed', error);
    return json({ error: 'Nu am putut încărca datele de contact.' }, { status: 400 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară pentru trimiterea mesajului.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Administratorii răspund din panoul de mesaje.' }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.smallJson });
    const orderId = requireNumericId(body.orderId, 'ID comandă');
    const messageBody = stringField(body, 'message', {
      required: true,
      max: LIMITS.message,
      fieldLabel: 'Mesajul',
    });

    const admin = createAdminClient();
    const order = await getUserOrder(admin, orderId, locals.user.id);

    if (!order) {
      return json({ error: 'Comanda nu a fost găsită.' }, { status: 404 });
    }

    let conversation = await findOpenConversationForOrder(admin, locals.user.id, orderId);

    if (!conversation) {
      conversation = await createOrderConversation(admin, locals.user.id, order);
    }

    const finalMessageBody = [
      `Comandă: ${order.order_number}`,
      `Stare comandă: ${order.status}`,
      '',
      messageBody,
    ].join('\n');

    const { data: insertedMessage, error: messageError } = await admin
      .from('support_messages')
      .insert({
        conversation_id: conversation.conversation_id,
        sender_user_id: locals.user.id,
        sender_type: 'USER',
        message_body: finalMessageBody,
        is_read: false,
      })
      .select('message_id, conversation_id, sender_user_id, sender_type, message_body, is_read, created_at')
      .single();

    if (messageError) throw messageError;

    const { error: updateError } = await admin
      .from('support_conversations')
      .update({
        status: 'OPEN',
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversation.conversation_id);

    if (updateError) throw updateError;

    return json(
      {
        success: true,
        item: {
          id: String(conversation.conversation_id),
          subject: conversation.subject,
          status: 'OPEN',
          topic: conversation.topic ?? 'ORDER',
          orderId: conversation.order_id != null ? String(conversation.order_id) : String(order.order_id),
          message: mapMessage(insertedMessage),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    console.error('Contact message send failed', error);
    return json({ error: 'Nu am putut trimite mesajul.' }, { status: 400 });
  }
}
