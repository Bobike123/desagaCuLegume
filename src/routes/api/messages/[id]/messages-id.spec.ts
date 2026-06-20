import { describe, expect, it, beforeEach, vi } from 'vitest';

const conversation = {
  conversation_id: 7,
  user_id: 42,
  subject: 'Comanda ORD-1',
  status: 'OPEN',
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
  order_id: null,
  topic: null,
};

const adminMocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: adminMocks.createAdminClient,
  SESSION_COOKIE_NAME: 'desaga_session',
}));

const { PATCH } = await import('./+server');

// Minimal chainable + thenable supabase query builder.
function makeAdmin(conv: typeof conversation | null) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    update: () => builder,
    insert: () => builder,
    order: () => builder,
    range: () => builder,
    maybeSingle: async () => ({ data: conv, error: null }),
    single: async () => ({ data: conv, error: null }),
    then: (resolve: (value: { data: unknown[]; error: null }) => unknown) =>
      resolve({ data: [], error: null }),
  };
  return { from: () => builder };
}

function event(opts: { isAdmin: boolean; userId?: number; body: Record<string, unknown> }) {
  return {
    locals: {
      isAuthenticated: true,
      isAdmin: opts.isAdmin,
      user: { id: opts.userId ?? 42 },
    },
    params: { id: '7' },
    request: new Request('https://desagaculegume.ro/api/messages/7', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts.body),
    }),
  } as any;
}

describe('/api/messages/[id] PATCH authorization', () => {
  beforeEach(() => {
    adminMocks.createAdminClient.mockReset();
    adminMocks.createAdminClient.mockReturnValue(makeAdmin(conversation));
  });

  it('requires authentication', async () => {
    const res = await PATCH({
      locals: { isAuthenticated: false, isAdmin: false, user: null },
      params: { id: '7' },
      request: new Request('https://desagaculegume.ro/api/messages/7', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    } as any);
    expect(res.status).toBe(401);
  });

  it('forbids a non-owner non-admin from touching the conversation', async () => {
    const res = await PATCH(event({ isAdmin: false, userId: 99, body: { markRead: true } }));
    expect(res.status).toBe(403);
  });

  it('forbids the conversation owner from changing status (admin-only)', async () => {
    const res = await PATCH(event({ isAdmin: false, userId: 42, body: { status: 'CLOSED' } }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('administrator'),
    });
  });

  it('allows an admin to change status', async () => {
    const res = await PATCH(event({ isAdmin: true, userId: 1, body: { status: 'CLOSED' } }));
    expect(res.status).toBe(200);
  });

  it('allows the conversation owner to mark messages read', async () => {
    const res = await PATCH(event({ isAdmin: false, userId: 42, body: { markRead: true } }));
    expect(res.status).toBe(200);
  });
});
