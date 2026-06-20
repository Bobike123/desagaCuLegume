import { describe, expect, it, vi } from 'vitest';
import { CONVERSATION_STATUSES, mapConversation, mapConversationUpdate, mapMessage, mapOrder, mapUser } from './support';

// ─── mapOrder ─────────────────────────────────────────────────────────────────

describe('mapOrder', () => {
  it('maps a complete order row', () => {
    const row = {
      order_id: 42,
      order_number: 'ORD-0042',
      user_id: 7,
      customer_full_name: 'Ion Popescu',
      customer_email: 'ion@example.com',
      total_amount: 123.45,
      currency_code: 'RON',
      status: 'PLACED',
      payment_status: 'PENDING',
      fulfillment_status: 'UNFULFILLED',
      created_at: '2024-03-01T08:00:00Z',
      placed_at: '2024-03-01T08:05:00Z',
    };

    const result = mapOrder(row);

    expect(result).toEqual({
      id: '42',
      orderNumber: 'ORD-0042',
      userId: '7',
      customerFullName: 'Ion Popescu',
      customerEmail: 'ion@example.com',
      customerPhone: null,
      total: 123.45,
      currency: 'RON',
      status: 'PLACED',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'UNFULFILLED',
      createdAt: '2024-03-01T08:00:00Z',
      placedAt: '2024-03-01T08:05:00Z',
    });
  });

  it('returns null for a null row', () => {
    expect(mapOrder(null)).toBeNull();
  });

  it('uses order_status alias when status is absent (JOIN rows)', () => {
    const row = {
      order_id: 1,
      order_number: 'X',
      total_amount: 0,
      order_status: 'COMPLETED',
      order_created_at: '2024-01-01T00:00:00Z',
    };
    const result = mapOrder(row);
    expect(result!.status).toBe('COMPLETED');
    expect(result!.createdAt).toBe('2024-01-01T00:00:00Z');
  });

  it('sets userId to null when user_id is absent', () => {
    const row = { order_id: 2, order_number: 'Y', total_amount: 0 };
    expect(mapOrder(row)!.userId).toBeNull();
  });

  it('coerces total_amount to number and defaults to 0', () => {
    const row = { order_id: 3, order_number: 'Z' };
    expect(mapOrder(row)!.total).toBe(0);
  });

  it('defaults currency to RON', () => {
    const row = { order_id: 4, order_number: 'W' };
    expect(mapOrder(row)!.currency).toBe('RON');
  });

  it('converts numeric order_id to string id', () => {
    const row = { order_id: 999, order_number: 'V' };
    expect(mapOrder(row)!.id).toBe('999');
  });

  it('maps missing optional fields to null', () => {
    const row = { order_id: 5, order_number: 'U' };
    const result = mapOrder(row)!;
    expect(result.customerFullName).toBeNull();
    expect(result.customerEmail).toBeNull();
    expect(result.customerPhone).toBeNull();
    expect(result.paymentStatus).toBeUndefined();
    expect(result.fulfillmentStatus).toBeUndefined();
    expect(result.placedAt).toBeUndefined();
  });
});

// ─── mapMessage ───────────────────────────────────────────────────────────────

describe('mapMessage', () => {
  it('maps a complete message row', () => {
    const row = {
      message_id: 10,
      sender_user_id: 7,
      sender_type: 'customer',
      message_body: 'Bună ziua!',
      is_read: false,
      created_at: '2024-03-01T09:00:00Z',
    };

    expect(mapMessage(row)).toEqual({
      id: '10',
      senderUserId: '7',
      senderType: 'customer',
      body: 'Bună ziua!',
      isRead: false,
      createdAt: '2024-03-01T09:00:00Z',
    });
  });

  it('sets senderUserId to null when sender_user_id is absent', () => {
    const row = {
      message_id: 11,
      sender_user_id: null,
      sender_type: 'admin',
      message_body: 'Admin reply',
      is_read: true,
      created_at: '2024-03-01T10:00:00Z',
    };

    expect(mapMessage(row).senderUserId).toBeNull();
    expect(mapMessage(row).senderType).toBe('admin');
  });

  it('converts message_id to string', () => {
    const row = { message_id: 99, sender_user_id: null, sender_type: 'admin', message_body: '', is_read: false, created_at: '' };
    expect(mapMessage(row).id).toBe('99');
  });

  it('coerces is_read to boolean', () => {
    const truthy = { message_id: 1, sender_user_id: null, sender_type: 'admin', message_body: '', is_read: 1, created_at: '' };
    const falsy = { ...truthy, is_read: 0 };
    expect(mapMessage(truthy).isRead).toBe(true);
    expect(mapMessage(falsy).isRead).toBe(false);
  });
});

// ─── mapUser ──────────────────────────────────────────────────────────────────

describe('mapUser', () => {
  it('maps a complete user row', () => {
    const row = {
      user_id: 3,
      email: 'user@example.com',
      username: 'ionp',
      full_name: 'Ion Popescu',
      phone: '0740000000',
    };

    expect(mapUser(row)).toEqual({
      id: '3',
      email: 'user@example.com',
      username: 'ionp',
      fullName: 'Ion Popescu',
      phone: '0740000000',
    });
  });

  it('returns null for null row', () => {
    expect(mapUser(null)).toBeNull();
  });

  it('uses user_email alias when email is absent (JOIN rows)', () => {
    const row = { user_id: 4, user_email: 'alt@example.com', username: 'x', full_name: null, phone: null };
    expect(mapUser(row)!.email).toBe('alt@example.com');
  });

  it('converts numeric user_id to string id', () => {
    const row = { user_id: 77, email: null, username: null, full_name: null, phone: null };
    expect(mapUser(row)!.id).toBe('77');
  });
});

// ─── mapConversationUpdate ────────────────────────────────────────────────────

describe('mapConversationUpdate', () => {
  it('maps a complete conversation row', () => {
    const row = {
      conversation_id: 5,
      user_id: 2,
      subject: 'Problemă comandă',
      status: 'OPEN',
      created_at: '2024-03-01T08:00:00Z',
      updated_at: '2024-03-02T09:00:00Z',
      order_id: 42,
      topic: 'ORDER',
    };

    const result = mapConversationUpdate(row);
    expect(result).toMatchObject({
      id: '5',
      subject: 'Problemă comandă',
      status: 'OPEN',
      topic: 'ORDER',
      orderId: '42',
      createdAt: '2024-03-01T08:00:00Z',
      updatedAt: '2024-03-02T09:00:00Z',
    });
  });

  it('returns null for null row', () => {
    expect(mapConversationUpdate(null)).toBeNull();
  });

  it('sets orderId to null when order_id is absent', () => {
    const row = {
      conversation_id: 6,
      user_id: 1,
      subject: null,
      status: 'OPEN',
      created_at: '',
      updated_at: '',
      order_id: null,
      topic: null,
    };
    expect(mapConversationUpdate(row)!.orderId).toBeNull();
  });

  it('normalizes unknown topic to GENERAL', () => {
    const row = {
      conversation_id: 7,
      user_id: 1,
      subject: null,
      status: 'OPEN',
      created_at: '',
      updated_at: '',
      order_id: null,
      topic: 'NONSENSE',
    };
    expect(mapConversationUpdate(row)!.topic).toBe('GENERAL');
  });
});

// ─── CONVERSATION_STATUSES ────────────────────────────────────────────────────

describe('CONVERSATION_STATUSES', () => {
  it('contains OPEN, CLOSED, ARCHIVED', () => {
    expect(CONVERSATION_STATUSES).toContain('OPEN');
    expect(CONVERSATION_STATUSES).toContain('CLOSED');
    expect(CONVERSATION_STATUSES).toContain('ARCHIVED');
    expect(CONVERSATION_STATUSES).toHaveLength(3);
  });
});

// ─── mapConversation ──────────────────────────────────────────────────────────

describe('mapConversation', () => {
  const row = {
    conversation_id: 10,
    user_id: 3,
    subject: 'Problemă livrare',
    status: 'OPEN',
    created_at: '2024-03-01T08:00:00Z',
    updated_at: '2024-03-02T09:00:00Z',
    order_id: 42,
    topic: 'ORDER',
  };

  const user = {
    user_id: 3,
    email: 'user@example.com',
    username: 'ionp',
    full_name: 'Ion Popescu',
    phone: '0740000000',
  };

  const messages = [
    { message_id: 1, sender_user_id: 3, sender_type: 'USER', message_body: 'Salut', is_read: false, created_at: '2024-03-01T08:00:00Z' },
    { message_id: 2, sender_user_id: null, sender_type: 'ADMIN', message_body: 'Bună ziua!', is_read: true, created_at: '2024-03-01T09:00:00Z' },
  ];

  const order = {
    order_id: 42,
    order_number: 'ORD-0042',
    user_id: 3,
    customer_full_name: 'Ion Popescu',
    customer_email: 'ion@example.com',
    total_amount: 50,
    currency_code: 'RON',
    status: 'PLACED',
    payment_status: 'PENDING',
    fulfillment_status: 'UNFULFILLED',
    created_at: '2024-03-01T00:00:00Z',
    placed_at: null,
  };

  it('maps a full conversation with user, messages, and order', () => {
    const result = mapConversation(row, user, messages, order);
    expect(result.id).toBe('10');
    expect(result.subject).toBe('Problemă livrare');
    expect(result.status).toBe('OPEN');
    expect(result.topic).toBe('ORDER');
    expect(result.orderId).toBe('42');
    expect(result.user?.id).toBe('3');
    expect(result.user?.email).toBe('user@example.com');
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].id).toBe('1');
    expect(result.messages[1].senderUserId).toBeNull();
    expect(result.order?.id).toBe('42');
  });

  it('sets orderId to null when order_id is null', () => {
    const result = mapConversation({ ...row, order_id: null }, user, [], null);
    expect(result.orderId).toBeNull();
    expect(result.order).toBeNull();
  });

  it('sets user to null when user row is null', () => {
    const result = mapConversation(row, null, [], order);
    expect(result.user).toBeNull();
  });

  it('preserves raw topic without normalization', () => {
    const result = mapConversation({ ...row, topic: 'UNKNOWN_TOPIC' }, null, [], null);
    expect(result.topic).toBe('UNKNOWN_TOPIC');
  });

  it('maps empty messages array', () => {
    const result = mapConversation(row, user, [], order);
    expect(result.messages).toEqual([]);
  });
});

// ─── loadConversationSummaries ────────────────────────────────────────────────

describe('loadConversationSummaries', () => {
  it('throws a descriptive error when RPC fails', async () => {
    const { loadConversationSummaries } = await import('./support');
    const admin = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'function not found' } }),
    } as any;

    const locals = { user: { id: 1 }, isAdmin: false } as any;
    const pagination = { limit: 20, offset: 0, page: 1, to: 19 };

    await expect(loadConversationSummaries(admin, locals, pagination)).rejects.toThrow(
      'Support conversation summary RPC is not installed or failed'
    );
  });

  it('returns empty items and total 0 for empty result', async () => {
    const { loadConversationSummaries } = await import('./support');
    const admin = {
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any;

    const locals = { user: { id: 1 }, isAdmin: true } as any;
    const pagination = { limit: 20, offset: 0, page: 1, to: 19 };

    const result = await loadConversationSummaries(admin, locals, pagination);
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('maps rows and reads total_count from first row', async () => {
    const { loadConversationSummaries } = await import('./support');
    const row = {
      conversation_id: 1,
      user_id: 10,
      subject: 'Test',
      status: 'OPEN',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      order_id: null,
      topic: 'ORDER',
      total_count: 42,
      last_message_id: null,
      unread_count: 0,
    };
    const admin = {
      rpc: vi.fn().mockResolvedValue({ data: [row], error: null }),
    } as any;

    const locals = { user: { id: 10 }, isAdmin: false } as any;
    const pagination = { limit: 20, offset: 0, page: 1, to: 19 };

    const result = await loadConversationSummaries(admin, locals, pagination);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(42);
    expect(result.items[0].id).toBe('1');
    expect(result.items[0].topic).toBe('ORDER');
  });

  it('passes filters to RPC call', async () => {
    const { loadConversationSummaries } = await import('./support');
    const rpcMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const admin = { rpc: rpcMock } as any;
    const locals = { user: null, isAdmin: true } as any;
    const pagination = { limit: 10, offset: 20, page: 3, to: 29 };

    await loadConversationSummaries(admin, locals, pagination, { status: 'OPEN', topic: 'ORDER', search: 'Ion' });

    expect(rpcMock).toHaveBeenCalledWith('support_conversation_summaries', {
      p_viewer_user_id: null,
      p_is_admin: true,
      p_status: 'OPEN',
      p_topic: 'ORDER',
      p_search: 'Ion',
      p_limit: 10,
      p_offset: 20,
    });
  });

  it('includes last message when last_message_id is present', async () => {
    const { loadConversationSummaries } = await import('./support');
    const row = {
      conversation_id: 2,
      user_id: 5,
      subject: null,
      status: 'OPEN',
      created_at: '',
      updated_at: '',
      order_id: null,
      topic: null,
      total_count: 1,
      last_message_id: 77,
      last_message_body: 'Hello',
      last_message_sender_type: 'customer',
      last_message_created_at: '2024-03-01T10:00:00Z',
      unread_count: 3,
    };
    const admin = { rpc: vi.fn().mockResolvedValue({ data: [row], error: null }) } as any;
    const locals = { user: { id: 5 }, isAdmin: false } as any;
    const pagination = { limit: 20, offset: 0, page: 1, to: 19 };

    const { items } = await loadConversationSummaries(admin, locals, pagination);
    expect(items[0].lastMessage).toMatchObject({ id: '77', body: 'Hello', senderType: 'customer' });
    expect(items[0].unreadCount).toBe(3);
  });
});
