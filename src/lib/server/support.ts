import { normalizeSupportTopic } from '$lib/support-messages';
import type { createAdminClient } from '$lib/server/supabase';
import type { Pagination } from '$lib/server/pagination';
import type { SupportConversationSummariesArgs } from '$lib/server/rpc-contracts';

export const CONVERSATION_SELECT =
  'conversation_id, user_id, subject, status, created_at, updated_at, closed_at, order_id, topic';

export const ORDER_SELECT =
  'order_id, order_number, user_id, customer_full_name, customer_email, customer_phone, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at';

export const CONVERSATION_STATUSES = ['OPEN', 'CLOSED', 'ARCHIVED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export type SupportConversationRow = {
  conversation_id: number;
  user_id: number;
  subject: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  order_id: number | null;
  topic: string | null;
};

type SupportSummaryRow = SupportConversationRow & {
  user_email?: string | null;
  username?: string | null;
  full_name?: string | null;
  phone?: string | null;
  order_number?: string | null;
  total_amount?: number | string | null;
  currency_code?: string | null;
  order_status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  order_created_at?: string | null;
  placed_at?: string | null;
  last_message_id?: number | null;
  last_message_body?: string | null;
  last_message_sender_type?: string | null;
  last_message_created_at?: string | null;
  unread_count?: number | string | null;
  total_count?: number | string | null;
};

export function mapOrder(row: any) {
  if (!row) return null;

  return {
    id: String(row.order_id),
    orderNumber: row.order_number,
    userId: row.user_id != null ? String(row.user_id) : null,
    customerFullName: row.customer_full_name ?? null,
    customerEmail: row.customer_email ?? null,
    customerPhone: row.customer_phone ?? null,
    total: Number(row.total_amount ?? 0),
    currency: row.currency_code ?? 'RON',
    status: row.status ?? row.order_status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    createdAt: row.created_at ?? row.order_created_at,
    placedAt: row.placed_at,
  };
}

export async function getUserOrder(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  userId: number
) {
  const { data, error } = await admin
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function mapUser(row: any) {
  if (!row) return null;

  return {
    id: String(row.user_id),
    email: row.email ?? row.user_email,
    username: row.username,
    fullName: row.full_name,
    phone: row.phone,
  };
}

export function mapConversationUpdate(row: SupportConversationRow | null) {
  if (!row) return null;

  return {
    id: String(row.conversation_id),
    subject: row.subject,
    status: row.status,
    topic: normalizeSupportTopic(row.topic),
    orderId: row.order_id != null ? String(row.order_id) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at ?? null,
  };
}

function mapConversationSummary(row: SupportSummaryRow) {
  return {
    id: String(row.conversation_id),
    subject: row.subject,
    status: row.status,
    topic: normalizeSupportTopic(row.topic),
    orderId: row.order_id != null ? String(row.order_id) : null,
    order:
      row.order_id != null
        ? mapOrder({
            order_id: row.order_id,
            order_number: row.order_number,
            total_amount: row.total_amount,
            currency_code: row.currency_code,
            status: row.order_status,
            payment_status: row.payment_status,
            fulfillment_status: row.fulfillment_status,
            created_at: row.order_created_at,
            placed_at: row.placed_at,
          })
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at ?? null,
    user: mapUser(row),
    lastMessage:
      row.last_message_id != null
        ? {
            id: String(row.last_message_id),
            body: row.last_message_body ?? '',
            senderType: row.last_message_sender_type,
            createdAt: row.last_message_created_at,
          }
        : null,
    unreadCount: Number(row.unread_count ?? 0),
  };
}

export function mapMessage(row: any) {
  return {
    id: String(row.message_id),
    senderUserId: row.sender_user_id != null ? String(row.sender_user_id) : null,
    senderType: row.sender_type,
    body: row.message_body,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export function mapConversation(row: SupportConversationRow, user: any, messages: any[], order: any) {
  return {
    id: String(row.conversation_id),
    subject: row.subject,
    status: row.status,
    topic: row.topic,
    orderId: row.order_id != null ? String(row.order_id) : null,
    order: mapOrder(order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at ?? null,
    user: mapUser(user),
    messages: messages.map(mapMessage),
  };
}

export async function archiveEligibleConversations(admin: ReturnType<typeof createAdminClient>) {
  const cutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const { error } = await admin
    .from('support_conversations')
    .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
    .eq('status', 'CLOSED')
    .not('closed_at', 'is', null)
    .lte('closed_at', cutoff);

  if (error) throw error;
}

export async function loadConversationSummaries(
  admin: ReturnType<typeof createAdminClient>,
  locals: App.Locals,
  pagination: Pagination,
  filters: { status?: string | null; topic?: string | null; search?: string | null } = {}
) {
  const { data, error } = await admin.rpc('support_conversation_summaries', {
    p_viewer_user_id: locals.user?.id ?? null,
    p_is_admin: Boolean(locals.isAdmin),
    p_status: filters.status || null,
    p_topic: filters.topic || null,
    p_search: filters.search || null,
    p_limit: pagination.limit,
    p_offset: pagination.offset,
  } satisfies SupportConversationSummariesArgs);

  if (error) {
    throw new Error(
      `Support conversation summary RPC is not installed or failed: ${error.message}. Run the provided Supabase SQL before using messaging in production.`
    );
  }

  const rows = (data ?? []) as SupportSummaryRow[];
  const total = rows.length ? Number(rows[0].total_count ?? rows.length) : 0;

  return {
    items: rows.map(mapConversationSummary),
    total,
  };
}
