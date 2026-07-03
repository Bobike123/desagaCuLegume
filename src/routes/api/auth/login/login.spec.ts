import { describe, expect, it, beforeEach, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  findUserByIdentity: vi.fn(),
  verifyPassword: vi.fn(),
  getRolesForUser: vi.fn(),
  createSession: vi.fn(),
  insertAuthLog: vi.fn(),
}));

const rateMocks = vi.hoisted(() => ({
  identityRateLimit: vi.fn(),
  peekRateLimitKey: vi.fn(),
  checkRateLimitKey: vi.fn(),
  resetRateLimitKey: vi.fn(),
}));

const securityMocks = vi.hoisted(() => ({ recordSecurityEvent: vi.fn() }));

vi.mock('$lib/server/auth', () => ({
  DUMMY_PASSWORD_HASH: 'scrypt:v1:dummysalt:dummyhash',
  findUserByIdentity: authMocks.findUserByIdentity,
  verifyPassword: authMocks.verifyPassword,
  getRolesForUser: authMocks.getRolesForUser,
  createSession: authMocks.createSession,
  insertAuthLog: authMocks.insertAuthLog,
  getRequestMeta: () => ({ ipAddress: '203.0.113.1', userAgent: 'test' }),
  getSessionTimeoutMinutes: () => 30,
  setSessionCookie: vi.fn(),
  safeClientAddress: (getAddress: () => string) => {
    try {
      return getAddress();
    } catch {
      return null;
    }
  },
}));

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: vi.fn(),
  SESSION_COOKIE_NAME: 'desaga_session',
  USER_SESSION_TIMEOUT_MINUTES: 30,
  ADMIN_SESSION_TIMEOUT_MINUTES: 480,
}));

vi.mock('$lib/server/rate-limit', () => ({
  identityRateLimit: rateMocks.identityRateLimit,
  identityRateLimitKey: (scope: string, identity: string) => `${scope}:${identity.trim().toLowerCase()}`,
  peekRateLimitKey: rateMocks.peekRateLimitKey,
  checkRateLimitKey: rateMocks.checkRateLimitKey,
  resetRateLimitKey: rateMocks.resetRateLimitKey,
  getClientIp: () => '203.0.113.1',
}));

vi.mock('$lib/server/security-events', () => ({
  recordSecurityEvent: securityMocks.recordSecurityEvent,
}));

const { POST } = await import('./+server');

const USER = {
  user_id: 42,
  email: 'ion@example.com',
  username: 'ion',
  full_name: 'Ion',
  phone: null,
  status: 'ACTIVE',
  password_hash: 'scrypt:v1:salt:hash',
};

function event(body: Record<string, unknown>) {
  return {
    request: new Request('https://desagaculegume.ro/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    cookies: { set: vi.fn(), delete: vi.fn(), get: vi.fn() },
    getClientAddress: () => '203.0.113.1',
    locals: {},
    url: new URL('https://desagaculegume.ro/api/auth/login'),
  } as any;
}

describe('/api/auth/login POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateMocks.identityRateLimit.mockResolvedValue(null);
    rateMocks.peekRateLimitKey.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    rateMocks.checkRateLimitKey.mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 0 });
    rateMocks.resetRateLimitKey.mockResolvedValue(undefined);
    securityMocks.recordSecurityEvent.mockResolvedValue(undefined);
    authMocks.getRolesForUser.mockResolvedValue(['USER']);
    authMocks.createSession.mockResolvedValue({ token: 'tok', sessionId: 'sid' });
    authMocks.insertAuthLog.mockResolvedValue(undefined);
  });

  it('burns the dummy scrypt verification for unknown users (no timing oracle)', async () => {
    authMocks.findUserByIdentity.mockResolvedValue(null);
    authMocks.verifyPassword.mockResolvedValue(false);

    const res = await POST(event({ identity: 'nobody@example.com', password: 'Parola123' }));

    expect(res.status).toBe(401);
    expect(authMocks.verifyPassword).toHaveBeenCalledWith('Parola123', 'scrypt:v1:dummysalt:dummyhash');
    // both failure counters consumed: identity + ip
    expect(rateMocks.checkRateLimitKey).toHaveBeenCalledTimes(2);
  });

  it('returns the same 401 body for unknown user and wrong password', async () => {
    authMocks.findUserByIdentity.mockResolvedValue(null);
    authMocks.verifyPassword.mockResolvedValue(false);
    const unknown = await (await POST(event({ identity: 'x@example.com', password: 'Parola123' }))).json();

    authMocks.findUserByIdentity.mockResolvedValue(USER);
    const wrongPass = await (await POST(event({ identity: 'ion@example.com', password: 'Gresita123' }))).json();

    expect(unknown).toEqual(wrongPass);
  });

  it('locks out after too many failures without running any credential check', async () => {
    rateMocks.peekRateLimitKey.mockResolvedValue({ allowed: false, retryAfterSeconds: 120 });

    const res = await POST(event({ identity: 'ion@example.com', password: 'Parola123' }));

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
    expect(authMocks.findUserByIdentity).not.toHaveBeenCalled();
    expect(securityMocks.recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ details: { reason: 'locked_out' }, rateLimited: true })
    );
  });

  it('resets the identity failure counter on successful login', async () => {
    authMocks.findUserByIdentity.mockResolvedValue(USER);
    authMocks.verifyPassword.mockResolvedValue(true);

    const res = await POST(event({ identity: 'Ion@Example.com', password: 'Parola123' }));

    expect(res.status).toBe(200);
    expect(rateMocks.resetRateLimitKey).toHaveBeenCalledWith('login-fail-identity:ion@example.com');
    expect(rateMocks.checkRateLimitKey).not.toHaveBeenCalled();
    expect(authMocks.createSession).toHaveBeenCalledWith(42, expect.anything(), 30);
  });

  it('treats a valid non-admin login with requireAdmin as a failure', async () => {
    authMocks.findUserByIdentity.mockResolvedValue(USER);
    authMocks.verifyPassword.mockResolvedValue(true);
    authMocks.getRolesForUser.mockResolvedValue(['USER']);

    const res = await POST(event({ identity: 'ion@example.com', password: 'Parola123', requireAdmin: true }));

    expect(res.status).toBe(401);
    expect(rateMocks.checkRateLimitKey).toHaveBeenCalledTimes(2);
    expect(authMocks.createSession).not.toHaveBeenCalled();
  });
});
