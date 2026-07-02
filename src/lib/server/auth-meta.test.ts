import { describe, expect, it } from 'vitest';
import { ADMIN_SESSION_TIMEOUT_MINUTES, USER_SESSION_TIMEOUT_MINUTES } from './supabase';
import { getRequestMeta, getSessionTimeoutMinutes, hashPassword, shouldTouchSession, verifyPassword } from './auth';

describe('auth request metadata', () => {
  it('uses direct client IP by default instead of spoofable proxy headers', () => {
    const previous = process.env.TRUSTED_PROXY;
    delete process.env.TRUSTED_PROXY;

    const request = new Request('https://desagaculegume.ro/api/auth/login', {
      headers: {
        'x-forwarded-for': '198.51.100.99',
        'cf-connecting-ip': '198.51.100.98',
        'user-agent': 'a'.repeat(300),
      },
    });

    const meta = getRequestMeta(request, '203.0.113.20');

    expect(meta.ipAddress).toBe('203.0.113.20');
    expect(meta.userAgent).toHaveLength(240);

    if (previous == null) delete process.env.TRUSTED_PROXY;
    else process.env.TRUSTED_PROXY = previous;
  });

  it('trusts the single header matching TRUSTED_PROXY=vercel', () => {
    const previous = process.env.TRUSTED_PROXY;
    process.env.TRUSTED_PROXY = 'vercel';

    const request = new Request('https://desagaculegume.ro/api/auth/login', {
      headers: {
        'x-real-ip': '198.51.100.50',
        'cf-connecting-ip': '203.0.113.99',
      },
    });

    const meta = getRequestMeta(request, '10.0.0.1');

    expect(meta.ipAddress).toBe('198.51.100.50');

    if (previous == null) delete process.env.TRUSTED_PROXY;
    else process.env.TRUSTED_PROXY = previous;
  });

  it('uses shorter idle timeouts for normal user sessions than admin sessions', () => {
    expect(getSessionTimeoutMinutes(['USER'])).toBe(USER_SESSION_TIMEOUT_MINUTES);
    expect(getSessionTimeoutMinutes(false)).toBe(USER_SESSION_TIMEOUT_MINUTES);
    expect(getSessionTimeoutMinutes(['USER', 'ADMIN'])).toBe(ADMIN_SESSION_TIMEOUT_MINUTES);
    expect(getSessionTimeoutMinutes(true)).toBe(ADMIN_SESSION_TIMEOUT_MINUTES);
  });

  it('creates versioned scrypt hashes and verifies legacy hashes', async () => {
    const hash = await hashPassword('ParolaTest1');
    const legacyHash = hash.replace(/^scrypt:v1:/, '');

    expect(hash).toMatch(/^scrypt:v1:[a-f0-9]{32}:[a-f0-9]{128}$/);
    expect(await verifyPassword('ParolaTest1', hash)).toBe(true);
    expect(await verifyPassword('ParolaTest1', legacyHash)).toBe(true);
    expect(await verifyPassword('gresit', hash)).toBe(false);
  });

  it('touches sessions only after the five minute threshold', () => {
    const now = Date.parse('2026-06-19T12:00:00.000Z');

    expect(shouldTouchSession('2026-06-19T11:56:00.000Z', now)).toBe(false);
    expect(shouldTouchSession('2026-06-19T11:54:59.000Z', now)).toBe(true);
    expect(shouldTouchSession(null, now)).toBe(true);
  });
});
