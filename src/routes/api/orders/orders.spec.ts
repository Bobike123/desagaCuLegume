import { describe, expect, it, beforeEach, vi } from 'vitest';

const adminMocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: adminMocks.createAdminClient,
  SESSION_COOKIE_NAME: 'desaga_session',
}));

const { GET: GET_LIST } = await import('./+server');
const { GET: GET_ONE, PATCH } = await import('./[id]/+server');

const ORDER_ROW = {
  order_id: 12,
  order_number: '1001',
  user_id: 42,
  customer_full_name: 'Ion Pop',
  customer_email: 'ion@example.com',
  total_amount: '35.00',
  subtotal_amount: '35.00',
  shipping_amount: '0.00',
  currency_code: 'RON',
  status: 'PLACED',
  payment_status: 'PENDING',
  fulfillment_status: 'UNFULFILLED',
  delivery_method: 'delivery',
  created_at: '2026-07-01T10:00:00.000Z',
  placed_at: '2026-07-01T10:00:00.000Z',
  order_items: [],
};

function makeAdmin(opts: { order?: typeof ORDER_ROW | null; rpcError?: { code: string; message: string } | null } = {}) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    range: () => builder,
    maybeSingle: async () => ({ data: opts.order ?? null, error: null }),
    then: (resolve: (value: { data: unknown[]; error: null; count: number }) => unknown) =>
      resolve({ data: [], error: null, count: 0 }),
  };
  const rpc = vi.fn(() => ({
    single: async () =>
      opts.rpcError ? { data: null, error: opts.rpcError } : { data: ORDER_ROW, error: null },
  }));
  return { admin: { from: () => builder, rpc }, rpc };
}

function patchEvent(opts: { isAdmin?: boolean; body?: Record<string, unknown> } = {}) {
  return {
    locals: { isAuthenticated: true, isAdmin: opts.isAdmin ?? true, user: { id: 1 } },
    params: { id: '12' },
    request: new Request('https://desagaculegume.ro/api/orders/12', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts.body ?? { status: 'PROCESSING' }),
    }),
  } as any;
}

describe('/api/orders', () => {
  beforeEach(() => {
    adminMocks.createAdminClient.mockReset();
  });

  it('list requires authentication', async () => {
    const res = await GET_LIST({
      locals: { isAuthenticated: false, isAdmin: false, user: null },
      url: new URL('https://desagaculegume.ro/api/orders'),
      setHeaders: vi.fn(),
    } as any);
    expect(res.status).toBe(401);
  });

  it('detail hides other users’ orders (403)', async () => {
    const { admin } = makeAdmin({ order: ORDER_ROW });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await GET_ONE({
      locals: { isAuthenticated: true, isAdmin: false, user: { id: 99 } },
      params: { id: '12' },
    } as any);
    expect(res.status).toBe(403);
  });

  it('detail reads delivery_method from the orders column', async () => {
    const { admin } = makeAdmin({ order: ORDER_ROW });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await GET_ONE({
      locals: { isAuthenticated: true, isAdmin: false, user: { id: 42 } },
      params: { id: '12' },
    } as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      item: { deliveryMethod: 'delivery', orderNumber: '1001' },
    });
  });

  it('PATCH requires admin', async () => {
    const res = await PATCH(patchEvent({ isAdmin: false }));
    expect(res.status).toBe(401);
  });

  it('PATCH maps the P0003 transition guard to a 409', async () => {
    const { admin } = makeAdmin({ rpcError: { code: 'P0003', message: 'Tranziție de status invalidă: DELIVERED → PENDING.' } });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await PATCH(patchEvent({ body: { status: 'PENDING' } }));
    expect(res.status).toBe(409);
  });

  it('PATCH maps P0002 to a 404', async () => {
    const { admin } = makeAdmin({ rpcError: { code: 'P0002', message: 'Comanda nu a fost găsită.' } });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await PATCH(patchEvent());
    expect(res.status).toBe(404);
  });

  it('PATCH forwards validated statuses to update_order_admin', async () => {
    const { admin, rpc } = makeAdmin({});
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await PATCH(patchEvent({ body: { status: 'PROCESSING', paymentStatus: 'PAID' } }));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      'update_order_admin',
      expect.objectContaining({ p_order_id: 12, p_status: 'PROCESSING', p_payment_status: 'PAID' })
    );
  });
});
