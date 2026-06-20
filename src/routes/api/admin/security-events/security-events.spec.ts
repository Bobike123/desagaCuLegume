import { describe, expect, it, vi } from 'vitest';

const securityEventMocks = vi.hoisted(() => ({
  getSecurityDashboardData: vi.fn(async () => ({
    unreadCount: 1,
    decoyHits24h: 2,
    rateLimitEvents24h: 1,
    failedLogins24h: 3,
    failedLoginTrends: [{ date: '2026-06-05', count: 3 }],
    events: [
      {
        id: '1',
        eventType: 'DECOY_HIT',
        requestId: '00000000-0000-4000-8000-000000000001',
        route: '/.env',
        method: 'GET',
        observedIp: '203.0.113.10',
        userAgent: 'Vitest',
        frequencyCount: 1,
        rateLimited: false,
        countryRegion: null,
        createdAt: '2026-06-05T12:00:00.000Z',
        seenAt: null,
      },
    ],
    page: { limit: 80, offset: 0, hasMore: false },
  })),
  markSecurityEventsRead: vi.fn(async () => 1),
}));

vi.mock('$lib/server/security-events', () => ({
  getSecurityDashboardData: securityEventMocks.getSecurityDashboardData,
  markSecurityEventsRead: securityEventMocks.markSecurityEventsRead,
}));

const { GET, PATCH } = await import('./+server');

function event(isAdmin: boolean, url = 'https://desagaculegume.ro/api/admin/security-events') {
  return {
    locals: { isAdmin },
    url: new URL(url),
    setHeaders: vi.fn(),
  } as any;
}

describe('/api/admin/security-events', () => {
  it('rejects non-admin callers', async () => {
    const response = await GET(event(false));
    expect(response.status).toBe(401);
  });

  it('returns sanitized security summaries to admins', async () => {
    const response = await GET(event(true));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.unreadCount).toBe(1);
    expect(body.events[0].route).toBe('/.env');
    expect(body.events[0]).not.toHaveProperty('details');
  });

  it('clamps page size for admin callers', async () => {
    await GET(event(true, 'https://desagaculegume.ro/api/admin/security-events?page=2&limit=10000'));

    expect(securityEventMocks.getSecurityDashboardData).toHaveBeenLastCalledWith(100, 100);
  });

  it('requires admin authorization to mark notifications read', async () => {
    const denied = await PATCH(event(false));
    const allowed = await PATCH(event(true));

    expect(denied.status).toBe(401);
    expect(allowed.status).toBe(200);
    await expect(allowed.json()).resolves.toMatchObject({ success: true, marked: 1 });
  });
});
