import { describe, expect, it, beforeEach, vi } from 'vitest';

const adminMocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: adminMocks.createAdminClient,
  SESSION_COOKIE_NAME: 'desaga_session',
}));

const { POST } = await import('./+server');

const RPC_ORDER_ROW = {
  order_id: 12,
  order_number: '1001',
  status: 'PLACED',
  payment_status: 'PENDING',
  fulfillment_status: 'UNFULFILLED',
  total_amount: '35.00',
  currency_code: 'RON',
  created_at: '2026-07-01T10:00:00.000Z',
};

function makeAdmin(rpcResult: { data: unknown; error: unknown }) {
  const rpc = vi.fn(() => ({ single: async () => rpcResult }));
  return { admin: { rpc }, rpc };
}

function event(body: Record<string, unknown>, opts: { isAdmin?: boolean; headers?: Record<string, string> } = {}) {
  return {
    locals: { isAuthenticated: false, isAdmin: opts.isAdmin ?? false, user: null },
    request: new Request('https://desagaculegume.ro/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
      body: JSON.stringify(body),
    }),
  } as any;
}

const VALID_KEY = '3e0b26e1-64f8-4e6e-9c39-6ba19cbebd11';

function validBody(extra: Record<string, unknown> = {}) {
  return {
    items: [{ productId: '3', quantity: 2 }],
    fullName: 'Ion Pop',
    phone: '0729000000',
    email: 'ion@example.com',
    deliveryMethod: 'PICKUP',
    idempotencyKey: VALID_KEY,
    ...extra,
  };
}

describe('/api/checkout POST', () => {
  beforeEach(() => {
    adminMocks.createAdminClient.mockReset();
  });

  it('blocks admins', async () => {
    const res = await POST(event(validBody(), { isAdmin: true }));
    expect(res.status).toBe(403);
  });

  it('rejects a missing idempotency key with 400', async () => {
    const { admin, rpc } = makeAdmin({ data: RPC_ORDER_ROW, error: null });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST(event(validBody({ idempotencyKey: undefined })));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('obligatorie'),
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a malformed idempotency key with 400', async () => {
    const { admin } = makeAdmin({ data: RPC_ORDER_ROW, error: null });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST(event(validBody({ idempotencyKey: 'not-a-uuid' })));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('invalidă'),
    });
  });

  it('accepts the Idempotency-Key header as a fallback', async () => {
    const { admin, rpc } = makeAdmin({ data: RPC_ORDER_ROW, error: null });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST(
      event(validBody({ idempotencyKey: undefined }), { headers: { 'Idempotency-Key': VALID_KEY } })
    );
    expect(res.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith('place_order', expect.objectContaining({ p_idempotency_key: VALID_KEY }));
  });

  it('sends only product ids and quantities to place_order (no client prices)', async () => {
    const { admin, rpc } = makeAdmin({ data: RPC_ORDER_ROW, error: null });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST(event(validBody({ items: [{ productId: '3', quantity: 2, price: 0.01 }] })));
    expect(res.status).toBe(201);

    const args = (rpc.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(args.p_items).toEqual([{ productId: 3, quantity: 2 }]);
    expect(args.p_idempotency_key).toBe(VALID_KEY);
  });

  it('maps RPC stock errors to a 409', async () => {
    const { admin } = makeAdmin({ data: null, error: { message: 'Insufficient stock for one or more products.' } });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST(event(validBody()));
    expect(res.status).toBe(409);
  });

  it('returns the mapped order payload on success', async () => {
    const { admin } = makeAdmin({ data: RPC_ORDER_ROW, error: null });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST(event(validBody()));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      order: { orderNumber: '1001', total: 35, status: 'PLACED' },
    });
  });
});
