import { describe, expect, it } from 'vitest';
import {
  buildConversationItems,
  conversationContext,
  conversationMatchesOrder,
  conversationTitle,
  customerName,
  mapConversation,
  mapConversationDetail,
  normalizeStatus,
  normalizeText,
  readNullableString,
  readOrder,
  readString,
  readUser,
  topicMeta,
  type OrderItem,
} from './message-thread';

function order(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: '10',
    orderNumber: 'ORD-10',
    total: 99.5,
    currency: 'RON',
    status: 'PLACED',
    paymentStatus: 'PENDING',
    fulfillmentStatus: 'UNFULFILLED',
    createdAt: '2026-06-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('readString / readNullableString', () => {
  it('passes strings through and stringifies non-null values', () => {
    expect(readString('hi')).toBe('hi');
    expect(readString(42)).toBe('42');
  });
  it('uses the fallback for null/undefined', () => {
    expect(readString(null, 'x')).toBe('x');
    expect(readString(undefined)).toBe('');
  });
  it('trims and nulls empty values', () => {
    expect(readNullableString('  hello  ')).toBe('hello');
    expect(readNullableString('   ')).toBeNull();
    expect(readNullableString(null)).toBeNull();
  });
});

describe('readOrder', () => {
  it('returns null when neither id nor orderNumber present', () => {
    expect(readOrder(null)).toBeNull();
    expect(readOrder({ total: 5 } as never)).toBeNull();
  });
  it('maps fields with sensible defaults', () => {
    const result = readOrder({ id: '7' } as never);
    expect(result).toMatchObject({
      id: '7',
      total: 0,
      currency: 'RON',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'UNFULFILLED',
    });
  });
});

describe('readUser', () => {
  it('returns null for nullish input', () => {
    expect(readUser(null)).toBeNull();
  });
  it('normalizes fields', () => {
    expect(readUser({ fullName: '  Ana  ', email: 'a@b.ro', phone: '' })).toEqual({
      fullName: 'Ana',
      email: 'a@b.ro',
      phone: null,
    });
  });
});

describe('normalizeText', () => {
  it('lowercases and strips Romanian diacritics', () => {
    expect(normalizeText('ȘĂÎÂȚ')).toBe('saiat');
    expect(normalizeText('Țăran Mâncare')).toBe('taran mancare');
  });
});

describe('normalizeStatus', () => {
  it('uppercases and trims, defaulting to OPEN', () => {
    expect(normalizeStatus('  closed ')).toBe('CLOSED');
    expect(normalizeStatus(null)).toBe('OPEN');
  });
});

describe('customerName', () => {
  it('prefers fullName, then email, then a default', () => {
    expect(customerName({ user: { fullName: 'Ana', email: 'a@b.ro', phone: null } } as never)).toBe('Ana');
    expect(customerName({ user: { fullName: null, email: 'a@b.ro', phone: null } } as never)).toBe('a@b.ro');
    expect(customerName({ user: null } as never)).toBe('Utilizator');
    expect(customerName(null)).toBe('Utilizator');
  });
});

describe('topicMeta / conversationTitle / conversationContext', () => {
  it('resolves topic metadata, defaulting unknown topics to GENERAL', () => {
    expect(topicMeta('ORDER').label).toBe('Comandă');
    expect(topicMeta('nope').label).toBe(topicMeta('GENERAL').label);
  });
  it('titles order conversations with the order number', () => {
    const item = mapConversation({ id: '1', order: { id: '10', orderNumber: 'ORD-10' } }, null);
    expect(conversationTitle(item)).toBe('Comandă #ORD-10');
  });
  it('titles general conversations with subject then topic label', () => {
    expect(conversationTitle(mapConversation({ id: '1', subject: 'Salut' }, null))).toBe('Salut');
    const noSubject = mapConversation({ id: '2', topic: 'DELIVERY' }, null);
    expect(conversationTitle(noSubject)).toBe(topicMeta('DELIVERY').label);
  });
  it('builds context with money + status for orders', () => {
    const item = mapConversation({ id: '1' }, order());
    const ctx = conversationContext(item);
    expect(ctx).toContain(topicMeta('ORDER').label);
    expect(ctx).toContain('RON');
  });
});

describe('conversationMatchesOrder', () => {
  it('matches by explicit orderId', () => {
    expect(conversationMatchesOrder({ orderId: '10' }, order())).toBe(true);
  });
  it('matches when subject contains the order number', () => {
    expect(conversationMatchesOrder({ subject: 'Despre comanda ORD-10 va rog' }, order())).toBe(true);
  });
  it('returns false when nothing matches', () => {
    expect(conversationMatchesOrder({ subject: 'altceva' }, order())).toBe(false);
  });
});

describe('mapConversation', () => {
  it('maps an order conversation', () => {
    const item = mapConversation({ id: '1', unreadCount: 3 }, order({ orderNumber: 'ORD-77' }));
    expect(item).toMatchObject({ id: '1', kind: 'order', orderId: '10', unreadCount: 3 });
    expect(item.topic).toBe('ORDER');
    expect(item.subject).toBe('Comandă ORD-77');
  });
  it('maps a general conversation', () => {
    const item = mapConversation({ id: '2', subject: 'Buna' }, null);
    expect(item).toMatchObject({ id: '2', kind: 'general', order: null, topic: 'GENERAL' });
  });
  it('maps the last message', () => {
    const item = mapConversation(
      { id: '3', lastMessage: { body: 'Hi', senderType: 'ADMIN', createdAt: 'x' } },
      null
    );
    expect(item.lastMessage).toEqual({ body: 'Hi', senderType: 'ADMIN', createdAt: 'x' });
  });
});

describe('mapConversationDetail', () => {
  it('maps messages and coerces fields', () => {
    const detail = mapConversationDetail({
      id: '1',
      subject: 'S',
      messages: [{ id: '5', senderType: 'USER', body: 'hello', createdAt: 't', isRead: 1 }],
    });
    expect(detail.messages).toEqual([
      { id: '5', senderType: 'USER', body: 'hello', createdAt: 't', isRead: true },
    ]);
  });
  it('returns an empty messages array when missing', () => {
    expect(mapConversationDetail({ id: '1' }).messages).toEqual([]);
    expect(mapConversationDetail(null).messages).toEqual([]);
  });
});

describe('buildConversationItems', () => {
  it('admin mode: drops empty ids and sorts by updatedAt desc', () => {
    const result = buildConversationItems(
      [
        { id: '1', updatedAt: '2026-06-01T00:00:00.000Z' },
        { id: '', updatedAt: '2026-06-09T00:00:00.000Z' },
        { id: '2', updatedAt: '2026-06-05T00:00:00.000Z' },
      ],
      'admin',
      []
    );
    expect(result.map((i) => i.id)).toEqual(['2', '1']);
  });

  it('user mode: matches orders, keeps unmatched, and dedups', () => {
    const result = buildConversationItems(
      [
        { id: '1', orderId: '10', updatedAt: '2026-06-02T00:00:00.000Z' },
        { id: '2', subject: 'intrebare generala', updatedAt: '2026-06-08T00:00:00.000Z' },
      ],
      'user',
      [order()]
    );
    expect(result.map((i) => i.id)).toEqual(['2', '1']);
    const matched = result.find((i) => i.id === '1');
    expect(matched?.kind).toBe('order');
    expect(matched?.order?.id).toBe('10');
  });
});
