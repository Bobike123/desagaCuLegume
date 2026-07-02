import { describe, expect, it, beforeEach, vi } from 'vitest';

const adminMocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: adminMocks.createAdminClient,
  SESSION_COOKIE_NAME: 'desaga_session',
}));

const { GET, POST, PUT } = await import('./+server');

const CART_PAYLOAD = {
  cart_id: 5,
  items: [
    {
      cart_item_id: 9,
      product_id: 3,
      name: 'Roșii',
      image_url: 'https://cdn.example/rosii.webp',
      measure_unit: 'PER_KG',
      promotion_label: 'NONE',
      images: [],
      quantity: 2,
      unit_price: '7.50',
      currency_code: 'RON',
      category_slug: 'de-sezon',
      status: 'ACTIVE',
      stock_quantity: 4,
    },
  ],
};

function makeAdmin(rpcResult: { data: unknown; error: unknown }) {
  const rpc = vi.fn(async () => rpcResult);
  return { admin: { rpc }, rpc };
}

function locals(opts: { authed?: boolean; isAdmin?: boolean } = {}) {
  const authed = opts.authed ?? true;
  return {
    isAuthenticated: authed,
    isAdmin: opts.isAdmin ?? false,
    user: authed ? { id: 42 } : null,
  };
}

function jsonRequest(method: string, body: Record<string, unknown>) {
  return new Request('https://desagaculegume.ro/api/cart', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/cart', () => {
  beforeEach(() => {
    adminMocks.createAdminClient.mockReset();
  });

  it('GET returns authenticated:false for guests without touching the DB', async () => {
    const res = await GET({ locals: locals({ authed: false }) } as any);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ authenticated: false, items: [] });
  });

  it('POST requires authentication', async () => {
    const res = await POST({
      locals: locals({ authed: false }),
      request: jsonRequest('POST', { productId: '3' }),
    } as any);
    expect(res.status).toBe(401);
  });

  it('POST blocks admins', async () => {
    const res = await POST({
      locals: locals({ isAdmin: true }),
      request: jsonRequest('POST', { productId: '3' }),
    } as any);
    expect(res.status).toBe(403);
  });

  it('POST performs one atomic add_cart_item call with the delta (no read-merge-write)', async () => {
    const { admin, rpc } = makeAdmin({ data: { ...CART_PAYLOAD, clamped: false }, error: null });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST({
      locals: locals(),
      request: jsonRequest('POST', { productId: '3', quantity: 2 }),
    } as any);

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('add_cart_item', {
      p_user_id: 42,
      p_product_id: 3,
      p_delta: 2,
    });

    const body = await res.json();
    expect(body.clamped).toBe(false);
    expect(body.items[0]).toMatchObject({
      productId: '3',
      quantity: 2,
      price: 7.5,
      category: 'de-sezon',
      in_stock: true,
    });
  });

  it('POST surfaces the clamped flag', async () => {
    const { admin } = makeAdmin({ data: { ...CART_PAYLOAD, clamped: true }, error: null });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST({
      locals: locals(),
      request: jsonRequest('POST', { productId: '3', quantity: 99 }),
    } as any);

    await expect(res.json()).resolves.toMatchObject({ clamped: true });
  });

  it('POST maps RPC stock errors to a 409', async () => {
    const { admin } = makeAdmin({
      data: null,
      error: { message: 'Insufficient stock for one or more products.' },
    });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await POST({
      locals: locals(),
      request: jsonRequest('POST', { productId: '3' }),
    } as any);
    expect(res.status).toBe(409);
  });

  it('PUT passes the dropped/clamped adjustment report through', async () => {
    const { admin, rpc } = makeAdmin({
      data: { ...CART_PAYLOAD, dropped: [999], clamped: [3] },
      error: null,
    });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await PUT({
      locals: locals(),
      request: jsonRequest('PUT', {
        items: [
          { productId: '3', quantity: 50 },
          { productId: '999', quantity: 1 },
        ],
      }),
    } as any);

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('replace_cart_items', {
      p_user_id: 42,
      p_items: [
        { product_id: 3, quantity: 50 },
        { product_id: 999, quantity: 1 },
      ],
    });
    await expect(res.json()).resolves.toMatchObject({
      adjusted: { dropped: ['999'], clamped: ['3'] },
    });
  });
});
