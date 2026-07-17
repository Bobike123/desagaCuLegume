import { describe, expect, it, beforeEach, vi } from 'vitest';

const adminMocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: adminMocks.createAdminClient,
  SESSION_COOKIE_NAME: 'desaga_session',
}));

const { GET, POST } = await import('./+server');

type Call = { table: string; method: string; args: unknown[] };

// Recording builder: every chained call is logged so tests can assert both
// the filters applied and their order relative to .range().
function makeAdmin(rows: Record<string, unknown[]>) {
  const calls: Call[] = [];

  function builderFor(table: string) {
    const result = { data: rows[table] ?? [], error: null, count: (rows[table] ?? []).length };
    const builder: any = {
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
      maybeSingle: async () => ({ data: (rows[table] ?? [])[0] ?? null, error: null }),
      single: async () => ({ data: (rows[table] ?? [])[0] ?? null, error: null }),
    };
    for (const method of ['select', 'eq', 'in', 'is', 'order', 'range', 'insert', 'update']) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return builder;
      };
    }
    return builder;
  }

  return {
    admin: { from: (table: string) => builderFor(table) },
    calls,
  };
}

function event(opts: { isAdmin?: boolean; search?: string } = {}) {
  const url = new URL(`https://desagaculegume.ro/api/products${opts.search ?? ''}`);
  return {
    locals: { isAuthenticated: false, isAdmin: opts.isAdmin ?? false, user: opts.isAdmin ? { id: 1 } : null },
    url,
    setHeaders: vi.fn(),
    request: new Request(url),
  } as any;
}

describe('/api/products GET', () => {
  beforeEach(() => {
    adminMocks.createAdminClient.mockReset();
  });

  it('constrains the query to allowed categories BEFORE applying the range', async () => {
    const { admin, calls } = makeAdmin({
      product_categories: [{ category_id: 1, name: 'Legume', slug: 'legume' }],
      products: [],
      product_images: [],
    });
    adminMocks.createAdminClient.mockReturnValue(admin);

    const res = await GET(event());
    expect(res.status).toBe(200);

    const productCalls = calls.filter((call) => call.table === 'products');
    const inIndex = productCalls.findIndex(
      (call) => call.method === 'in' && call.args[0] === 'category_id'
    );
    const rangeIndex = productCalls.findIndex((call) => call.method === 'range');

    expect(inIndex).toBeGreaterThanOrEqual(0);
    expect(rangeIndex).toBeGreaterThan(inIndex);
    // NULL-category rows can no longer leak: filter is part of the SQL query.
    expect(productCalls[inIndex].args[1]).toEqual([1]);
  });

  it('hides non-public statuses from anonymous visitors', async () => {
    const { admin, calls } = makeAdmin({
      product_categories: [{ category_id: 1, name: 'Legume', slug: 'legume' }],
      products: [],
      product_images: [],
    });
    adminMocks.createAdminClient.mockReturnValue(admin);

    await GET(event());

    const statusFilter = calls.find(
      (call) => call.table === 'products' && call.method === 'in' && call.args[0] === 'status'
    );
    expect(statusFilter?.args[1]).toEqual(['ACTIVE', 'OUT_OF_STOCK']);
  });

  it('does not apply the status filter for admins', async () => {
    const { admin, calls } = makeAdmin({
      product_categories: [{ category_id: 1, name: 'Legume', slug: 'legume' }],
      products: [],
      product_images: [],
    });
    adminMocks.createAdminClient.mockReturnValue(admin);

    await GET(event({ isAdmin: true }));

    const statusFilter = calls.find(
      (call) => call.table === 'products' && call.method === 'in' && call.args[0] === 'status'
    );
    expect(statusFilter).toBeUndefined();
  });
});

describe('/api/products POST', () => {
  it('requires admin', async () => {
    const res = await POST({
      locals: { isAuthenticated: true, isAdmin: false, user: { id: 42 } },
      request: new Request('https://desagaculegume.ro/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Roșii' }),
      }),
    } as any);
    expect(res.status).toBe(401);
  });
});
