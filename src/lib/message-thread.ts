/**
 * Pure data helpers for the support message thread (MessageThread.svelte).
 *
 * Extracted from the component so the conversation normalization/mapping logic
 * is unit-testable and the component stays focused on UI/state. These functions
 * are side-effect free and do not touch Svelte reactive state.
 */
import { formatMoney, statusLabel } from '$lib/format';
import { normalizeSupportTopic, SUPPORT_TOPIC_META, type SupportTopic } from '$lib/support-messages';

export type Mode = 'user' | 'admin';

export type OrderItem = {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
};

export type RawConversation = {
  id?: unknown;
  subject?: unknown;
  status?: unknown;
  topic?: unknown;
  orderId?: unknown;
  order?: Partial<OrderItem> | null;
  unreadCount?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  closedAt?: unknown;
  user?: {
    fullName?: unknown;
    email?: unknown;
    phone?: unknown;
  } | null;
  lastMessage?: {
    body?: unknown;
    senderType?: unknown;
    createdAt?: unknown;
  } | null;
};

export type ConversationUser = {
  fullName: string | null;
  email: string;
  phone: string | null;
} | null;

export type ConversationListItem = {
  id: string;
  subject: string;
  status: string;
  topic: SupportTopic;
  unreadCount: number;
  updatedAt: string;
  closedAt: string | null;
  orderId: string | null;
  order: OrderItem | null;
  kind: 'order' | 'general';
  user: ConversationUser;
  lastMessage: {
    body: string;
    senderType: string;
    createdAt: string;
  } | null;
};

export type ConversationDetail = {
  id: string;
  subject: string;
  status: string;
  topic: SupportTopic;
  orderId: string | null;
  order: OrderItem | null;
  user: ConversationUser;
  closedAt: string | null;
  messages: Array<{
    id: string;
    senderType: string;
    body: string;
    createdAt: string;
    isRead: boolean;
  }>;
};

export function normalizeStatus(value: string | null | undefined) {
  return String(value ?? 'OPEN').trim().toUpperCase();
}

export function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

export function readNullableString(value: unknown) {
  const normalized = readString(value).trim();
  return normalized || null;
}

export function readUser(value: RawConversation['user']): ConversationUser {
  if (!value) return null;
  return {
    fullName: readNullableString(value.fullName),
    email: readString(value.email),
    phone: readNullableString(value.phone),
  };
}

export function readOrder(value: RawConversation['order']): OrderItem | null {
  if (!value || typeof value !== 'object') return null;

  const order = value as Record<string, unknown>;
  const id = readString(order.id);
  const orderNumber = readString(order.orderNumber);
  if (!id && !orderNumber) return null;

  return {
    id,
    orderNumber,
    total: Number(order.total ?? 0),
    currency: readString(order.currency, 'RON'),
    status: readString(order.status, 'PENDING'),
    paymentStatus: readString(order.paymentStatus, 'PENDING'),
    fulfillmentStatus: readString(order.fulfillmentStatus, 'UNFULFILLED'),
    createdAt: readString(order.createdAt),
  };
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ă|â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș|ş/g, 's')
    .replace(/ț|ţ/g, 't');
}

export function customerName(item: ConversationListItem | ConversationDetail | null) {
  return item?.user?.fullName || item?.user?.email || 'Utilizator';
}

export function topicMeta(value: unknown) {
  return SUPPORT_TOPIC_META[normalizeSupportTopic(value)];
}

export function conversationTitle(item: ConversationListItem | ConversationDetail | null) {
  if (!item) return '';
  if (item.order?.orderNumber) return `Comandă #${item.order.orderNumber}`;
  return item.subject || topicMeta(item.topic).label;
}

export function conversationContext(item: ConversationListItem | ConversationDetail | null) {
  if (!item) return '';
  if (item.order) {
    return `${topicMeta(item.topic).label} · ${formatMoney(item.order.total, item.order.currency)} · ${statusLabel(item.order.status)}`;
  }

  return topicMeta(item.topic).label;
}

export function conversationMatchesOrder(conversation: RawConversation, order: OrderItem) {
  const rawOrder = readOrder(conversation.order);
  const conversationOrderId = readString(conversation.orderId || rawOrder?.id);
  if (conversationOrderId && conversationOrderId === order.id) return true;

  const subject = readString(conversation.subject).toLowerCase();
  const orderNumber = String(order.orderNumber ?? '').toLowerCase();
  const orderId = String(order.id ?? '').toLowerCase();
  return Boolean(orderNumber && subject.includes(orderNumber)) || Boolean(orderId && subject.includes(orderId));
}

export function mapConversation(conversation: RawConversation, order: OrderItem | null): ConversationListItem {
  const embeddedOrder = readOrder(conversation.order);
  const resolvedOrder = order ?? embeddedOrder;
  const topic = normalizeSupportTopic(conversation.topic ?? (resolvedOrder ? 'ORDER' : 'GENERAL'));
  const updatedAt = readString(conversation.updatedAt || conversation.createdAt || resolvedOrder?.createdAt || new Date().toISOString());
  const subjectFallback = resolvedOrder ? `Comandă ${resolvedOrder.orderNumber}` : topicMeta(topic).label;

  return {
    id: readString(conversation.id),
    subject: readString(conversation.subject, subjectFallback),
    status: readString(conversation.status, 'OPEN'),
    topic,
    unreadCount: Number(conversation.unreadCount ?? 0),
    updatedAt,
    closedAt: readNullableString(conversation.closedAt),
    orderId: readNullableString(conversation.orderId) ?? resolvedOrder?.id ?? null,
    order: resolvedOrder,
    kind: resolvedOrder ? 'order' : 'general',
    user: readUser(conversation.user),
    lastMessage: conversation.lastMessage
      ? {
          body: readString(conversation.lastMessage.body),
          senderType: readString(conversation.lastMessage.senderType),
          createdAt: readString(conversation.lastMessage.createdAt),
        }
      : null,
  };
}

export function mapConversationDetail(value: unknown): ConversationDetail {
  const conversation = (value ?? {}) as RawConversation & {
    messages?: Array<{
      id?: unknown;
      senderType?: unknown;
      body?: unknown;
      createdAt?: unknown;
      isRead?: unknown;
    }>;
  };
  const order = readOrder(conversation.order);
  const topic = normalizeSupportTopic(conversation.topic ?? (order ? 'ORDER' : 'GENERAL'));

  return {
    id: readString(conversation.id),
    subject: readString(conversation.subject, order ? `Comandă ${order.orderNumber}` : topicMeta(topic).label),
    status: readString(conversation.status, 'OPEN'),
    topic,
    orderId: readNullableString(conversation.orderId) ?? order?.id ?? null,
    order,
    user: readUser(conversation.user),
    closedAt: readNullableString(conversation.closedAt),
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map((message) => ({
          id: readString(message.id),
          senderType: readString(message.senderType),
          body: readString(message.body),
          createdAt: readString(message.createdAt),
          isRead: Boolean(message.isRead),
        }))
      : [],
  };
}

export function buildConversationItems(
  rawConversations: RawConversation[],
  mode: Mode,
  orders: OrderItem[]
): ConversationListItem[] {
  if (mode === 'admin') {
    return rawConversations
      .map((conversation: RawConversation) => mapConversation(conversation, null))
      .filter((item: ConversationListItem) => item.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  const mapped: ConversationListItem[] = [];
  const matchedConversationIds = new Set<string>();

  for (const order of orders) {
    const matching = rawConversations.filter((conversation: RawConversation) => conversationMatchesOrder(conversation, order));
    for (const conversation of matching) {
      const item = mapConversation(conversation, order);
      if (!item.id) continue;
      matchedConversationIds.add(item.id);
      mapped.push(item);
    }
  }

  for (const conversation of rawConversations) {
    const id = readString(conversation.id);
    if (!id || matchedConversationIds.has(id)) continue;
    mapped.push(mapConversation(conversation, null));
  }

  mapped.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return mapped;
}

export function senderLabel(senderType: string | null | undefined, mode: Mode) {
  const normalized = normalizeStatus(senderType);
  if (normalized === 'SYSTEM') return 'Sistem';
  if (mode === 'admin') return normalized === 'ADMIN' ? 'Admin' : 'Client';
  return normalized === 'ADMIN' ? 'Admin' : 'Tu';
}

export function messageBubbleClass(senderType: string | null | undefined, mode: Mode) {
  const normalized = normalizeStatus(senderType);
  if (normalized === 'SYSTEM') return 'msg-system';
  const isOwnMessage = mode === 'admin' ? normalized === 'ADMIN' : normalized === 'USER';
  return isOwnMessage ? 'msg-own' : 'msg-other';
}

export function formatMessageDate(value: string | null | undefined, mode: Mode) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: mode === 'user' ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}
