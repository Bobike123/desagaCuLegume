import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

function cleanString(value: unknown) {
  return String(value ?? '').trim();
}

function mapOrder(row: any) {
  return {
    id: String(row.order_id),
    orderNumber: row.order_number,
    userId: row.user_id != null ? String(row.user_id) : null,
    customerFullName: row.customer_full_name,
    customerEmail: row.customer_email,
    total: Number(row.total_amount ?? 0),
    currency: row.currency_code ?? 'RON',
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    createdAt: row.created_at,
    placedAt: row.placed_at,
  };
}

function mapMessage(row: any) {
  return {
    id: String(row.message_id),
    senderUserId: row.sender_user_id != null ? String(row.sender_user_id) : null,
    senderType: row.sender_type,
    body: row.message_body,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

function mapConversation(row: any, messages: any[]) {
  const orderedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const lastMessage = orderedMessages[orderedMessages.length - 1] ?? null;
  const unreadCount = orderedMessages.filter(
    (message) => message.sender_type === 'ADMIN' && !message.is_read
  ).length;

  return {
    id: String(row.conversation_id),
    subject: row.subject,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unreadCount,
    lastMessage: lastMessage
      ? {
          id: String(lastMessage.message_id),
          body: lastMessage.message_body,
          senderType: lastMessage.sender_type,
          createdAt: lastMessage.created_at,
        }
      : null,
    messages: orderedMessages.map(mapMessage),
  };
}

function conversationBelongsToOrder(conversation: any, order: any) {
  const subject = String(conversation.subject ?? '').toLowerCase();
  const orderNumber = String(order.order_number ?? '').toLowerCase();
  const orderId = String(order.order_id ?? '').toLowerCase();

  return Boolean(
    orderNumber && subject.includes(orderNumber)
  ) || Boolean(
    orderId && subject.includes(orderId)
  );
}

async function getUserOrder(admin: ReturnType<typeof createAdminClient>, orderId: string, userId: number) {
  const { data, error } = await admin
    .from('orders')
    .select(
      'order_id, order_number, user_id, customer_full_name, customer_email, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at'
    )
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findOpenConversationForOrder(
  admin: ReturnType<typeof createAdminClient>,
  userId: number,
  orderNumber: string
) {
  const subject = `Comandă ${orderNumber}`;

  const { data, error } = await admin
    .from('support_conversations')
    .select('conversation_id, user_id, subject, status, created_at, updated_at')
    .eq('user_id', userId)
    .eq('subject', subject)
    .neq('status', 'CLOSED')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function GET({ locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Administratorii folosesc panoul de mesaje.' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();

    const { data: orders, error: ordersError } = await admin
      .from('orders')
      .select(
        'order_id, order_number, user_id, customer_full_name, customer_email, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at'
      )
      .eq('user_id', locals.user.id)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const { data: conversations, error: conversationsError } = await admin
      .from('support_conversations')
      .select('conversation_id, user_id, subject, status, created_at, updated_at')
      .eq('user_id', locals.user.id)
      .order('updated_at', { ascending: false });

    if (conversationsError) throw conversationsError;

    const conversationIds = (conversations ?? []).map((conversation: any) => conversation.conversation_id);

    const messageResult = conversationIds.length
      ? await admin
          .from('support_messages')
          .select('message_id, conversation_id, sender_user_id, sender_type, message_body, is_read, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true })
      : { data: [], error: null };

    if (messageResult.error) throw messageResult.error;

    const messagesByConversation = new Map<number, any[]>();

    for (const message of messageResult.data ?? []) {
      const list = messagesByConversation.get(message.conversation_id) ?? [];
      list.push(message);
      messagesByConversation.set(message.conversation_id, list);
    }

    const mappedOrders = (orders ?? []).map((order: any) => {
      const orderConversations = (conversations ?? [])
        .filter((conversation: any) => conversationBelongsToOrder(conversation, order))
        .map((conversation: any) =>
          mapConversation(
            conversation,
            messagesByConversation.get(conversation.conversation_id) ?? []
          )
        );

      return {
        ...mapOrder(order),
        conversations: orderConversations,
      };
    });

    return json({ orders: mappedOrders }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load contact data';
    return json({ error: message }, { status: 400 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară pentru trimiterea mesajului.' }, { status: 401 });
  }

  if (locals.isAdmin) {
    return json({ error: 'Administratorii răspund din panoul de mesaje.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const orderId = cleanString(body.orderId);
  const messageBody = cleanString(body.message);

  if (!orderId) {
    return json({ error: 'Selectează comanda pentru care trimiți mesajul.' }, { status: 400 });
  }

  if (!messageBody) {
    return json({ error: 'Mesajul este obligatoriu.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const order = await getUserOrder(admin, orderId, locals.user.id);

    if (!order) {
      return json({ error: 'Comanda nu a fost găsită.' }, { status: 404 });
    }

    const subject = `Comandă ${order.order_number}`;
    let conversation = await findOpenConversationForOrder(admin, locals.user.id, order.order_number);

    if (!conversation) {
      const { data, error } = await admin
        .from('support_conversations')
        .insert({
          user_id: locals.user.id,
          subject,
          status: 'OPEN',
        })
        .select('conversation_id, user_id, subject, status, created_at, updated_at')
        .single();

      if (error) throw error;
      conversation = data;
    }

    const finalMessageBody = [
      `Comandă: ${order.order_number}`,
      `Status comandă: ${order.status}`,
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
          message: mapMessage(insertedMessage),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send contact message';
    return json({ error: message }, { status: 400 });
  }
}