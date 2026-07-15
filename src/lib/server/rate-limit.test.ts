import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/supabase', () => ({
  createAdminClient: () => ({
    rpc: () => {
      throw new Error('persistent rate limit unavailable in test');
    },
  }),
}));

const { checkRateLimit, getClientIp, identityRateLimit, rateLimit } = await import('./rate-limit');

function eventForIp(ip: string) {
  return {
    request: new Request('https://desagaculegume.ro/admin-backup', {
      headers: {
        'x-forwarded-for': ip,
      },
    }),
    getClientAddress: () => ip,
  } as any;
}

describe('rate limiting', () => {
  it('falls back to process-local limits and blocks repeated requests', async () => {
    const scope = `test-decoy-${crypto.randomUUID()}`;
    const event = eventForIp('203.0.113.10');

    const first = await checkRateLimit(event, { scope, limit: 1, windowMs: 60_000 });
    const second = await checkRateLimit(event, { scope, limit: 1, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('isolates different scopes - blocking one does not block another', async () => {
    const event = eventForIp('203.0.113.11');
    const scopeA = `test-scope-a-${crypto.randomUUID()}`;
    const scopeB = `test-scope-b-${crypto.randomUUID()}`;

    const a1 = await checkRateLimit(event, { scope: scopeA, limit: 1, windowMs: 60_000 });
    const a2 = await checkRateLimit(event, { scope: scopeA, limit: 1, windowMs: 60_000 });
    const b1 = await checkRateLimit(event, { scope: scopeB, limit: 1, windowMs: 60_000 });

    expect(a1.allowed).toBe(true);
    expect(a2.allowed).toBe(false);
    expect(b1.allowed).toBe(true);
  });

  it('allows multiple requests within the limit', async () => {
    const scope = `test-multi-${crypto.randomUUID()}`;
    const event = eventForIp('203.0.113.12');

    const r1 = await checkRateLimit(event, { scope, limit: 3, windowMs: 60_000 });
    const r2 = await checkRateLimit(event, { scope, limit: 3, windowMs: 60_000 });
    const r3 = await checkRateLimit(event, { scope, limit: 3, windowMs: 60_000 });
    const r4 = await checkRateLimit(event, { scope, limit: 3, windowMs: 60_000 });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('limits repeated login attempts for the same normalized identity', async () => {
    const scope = `test-identity-${crypto.randomUUID()}`;

    const first = await identityRateLimit(' User@Example.com ', { scope, limit: 1, windowMs: 60_000 });
    const second = await identityRateLimit('user@example.com', { scope, limit: 1, windowMs: 60_000 });

    expect(first).toBeNull();
    expect(second).not.toBeNull();
    expect(second!.status).toBe(429);
  });

  it('does not trust proxy headers unless TRUSTED_PROXY is configured', () => {
    const previous = process.env.TRUSTED_PROXY;
    delete process.env.TRUSTED_PROXY;

    const event = {
      request: new Request('https://desagaculegume.ro/.env', {
        headers: {
          'x-forwarded-for': '198.51.100.99',
          'x-real-ip': '198.51.100.98',
          'cf-connecting-ip': '198.51.100.97',
        },
      }),
      getClientAddress: () => '203.0.113.20',
    } as any;

    expect(getClientIp(event)).toBe('203.0.113.20');
    if (previous == null) delete process.env.TRUSTED_PROXY;
    else process.env.TRUSTED_PROXY = previous;
  });

  it('trusts only x-real-ip when TRUSTED_PROXY=vercel (cf-connecting-ip is client-spoofable)', () => {
    const previous = process.env.TRUSTED_PROXY;
    process.env.TRUSTED_PROXY = 'vercel';

    const event = {
      request: new Request('https://desagaculegume.ro/api/test', {
        headers: {
          'x-real-ip': '198.51.100.50',
          'cf-connecting-ip': '203.0.113.99',
        },
      }),
      getClientAddress: () => '10.0.0.2',
    } as any;

    expect(getClientIp(event)).toBe('198.51.100.50');
    if (previous == null) delete process.env.TRUSTED_PROXY;
    else process.env.TRUSTED_PROXY = previous;
  });

  it('trusts cf-connecting-ip when TRUSTED_PROXY=cloudflare', () => {
    const previous = process.env.TRUSTED_PROXY;
    process.env.TRUSTED_PROXY = 'cloudflare';

    const event = {
      request: new Request('https://desagaculegume.ro/api/test', {
        headers: { 'cf-connecting-ip': '203.0.113.99' },
      }),
      getClientAddress: () => '10.0.0.1',
    } as any;

    expect(getClientIp(event)).toBe('203.0.113.99');
    if (previous == null) delete process.env.TRUSTED_PROXY;
    else process.env.TRUSTED_PROXY = previous;
  });

  it('falls back to direct IP when the trusted header contains an invalid IP', () => {
    const previous = process.env.TRUSTED_PROXY;
    process.env.TRUSTED_PROXY = 'vercel';

    const event = {
      request: new Request('https://desagaculegume.ro/api/test', {
        headers: { 'x-real-ip': 'not-an-ip' },
      }),
      getClientAddress: () => '203.0.113.77',
    } as any;

    expect(getClientIp(event)).toBe('203.0.113.77');
    if (previous == null) delete process.env.TRUSTED_PROXY;
    else process.env.TRUSTED_PROXY = previous;
  });
});

describe('rateLimit helper', () => {
  it('returns null when request is allowed', async () => {
    const scope = `test-ratelimit-allow-${crypto.randomUUID()}`;
    const event = eventForIp('203.0.113.30');
    const result = await rateLimit(event, { scope, limit: 5, windowMs: 60_000 });
    expect(result).toBeNull();
  });

  it('returns 429 Response when rate limit exceeded', async () => {
    const scope = `test-ratelimit-block-${crypto.randomUUID()}`;
    const event = eventForIp('203.0.113.31');

    await rateLimit(event, { scope, limit: 1, windowMs: 60_000 });
    const response = await rateLimit(event, { scope, limit: 1, windowMs: 60_000 });

    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    const body = await response!.json();
    expect(body.error).toContain('Prea multe cereri');
    expect(response!.headers.get('Retry-After')).toBeTruthy();
  });
});
