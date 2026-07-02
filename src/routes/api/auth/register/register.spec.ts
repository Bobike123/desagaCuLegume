import { describe, expect, it, beforeEach, vi } from 'vitest';

const adminMocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
const authMocks = vi.hoisted(() => ({
  hashPassword: vi.fn(async () => 'scrypt:v1:salt:hash'),
  createSession: vi.fn(async () => ({ token: 'tok', sessionId: 'sid' })),
}));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: adminMocks.createAdminClient,
  SESSION_COOKIE_NAME: 'desaga_session',
  USER_SESSION_TIMEOUT_MINUTES: 30,
  ADMIN_SESSION_TIMEOUT_MINUTES: 480,
}));

vi.mock('$lib/server/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/server/auth')>();
  return {
    ...actual,
    hashPassword: authMocks.hashPassword,
    createSession: authMocks.createSession,
    setSessionCookie: vi.fn(),
  };
});

const { POST } = await import('./+server');

// users lookups happen twice (email, username), then insert; roles select; user_roles insert.
function makeAdmin(opts: { emailTaken?: boolean; usernameTaken?: boolean } = {}) {
  const usersLookups = [
    { data: opts.emailTaken ? { user_id: 1 } : null, error: null },
    { data: opts.usernameTaken ? { user_id: 2 } : null, error: null },
  ];
  let lookupIndex = 0;

  const usersBuilder: any = {
    select: () => usersBuilder,
    eq: () => usersBuilder,
    insert: () => usersBuilder,
    maybeSingle: async () => usersLookups[Math.min(lookupIndex++, 1)],
    single: async () => ({ data: { user_id: 42 }, error: null }),
  };
  const rolesBuilder: any = {
    select: () => rolesBuilder,
    eq: () => rolesBuilder,
    single: async () => ({ data: { role_id: 1 }, error: null }),
  };
  const userRolesBuilder: any = {
    insert: async () => ({ error: null }),
  };

  return {
    from: (table: string) => {
      if (table === 'users') return usersBuilder;
      if (table === 'roles') return rolesBuilder;
      return userRolesBuilder;
    },
  };
}

function event(body: Record<string, unknown>) {
  return {
    request: new Request('https://desagaculegume.ro/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    cookies: { set: vi.fn(), delete: vi.fn(), get: vi.fn() },
    getClientAddress: () => '203.0.113.1',
    locals: {},
  } as any;
}

describe('/api/auth/register POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminMocks.createAdminClient.mockReturnValue(makeAdmin());
  });

  it('rejects weak passwords before touching the database', async () => {
    const res = await POST(event({ email: 'ion@example.com', password: 'weakpass' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('literă mare'),
    });
  });

  it('returns 409 when the email is already registered', async () => {
    adminMocks.createAdminClient.mockReturnValue(makeAdmin({ emailTaken: true }));
    const res = await POST(event({ email: 'ion@example.com', password: 'Parola123' }));
    expect(res.status).toBe(409);
  });

  it('returns 409 when the username is taken', async () => {
    adminMocks.createAdminClient.mockReturnValue(makeAdmin({ usernameTaken: true }));
    const res = await POST(event({ email: 'ion@example.com', username: 'ion', password: 'Parola123' }));
    expect(res.status).toBe(409);
  });

  it('creates the account, assigns USER role and starts a session', async () => {
    const res = await POST(event({ email: 'ion@example.com', password: 'Parola123' }));
    expect(res.status).toBe(201);
    expect(authMocks.hashPassword).toHaveBeenCalledWith('Parola123');
    expect(authMocks.createSession).toHaveBeenCalledWith(42, expect.anything(), expect.any(Number));
  });
});
