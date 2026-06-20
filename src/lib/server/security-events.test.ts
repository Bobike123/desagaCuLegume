import { describe, expect, it } from 'vitest';
import { mapSecurityEventRow } from './security-events';

describe('security event mapping', () => {
  it('length-limits and normalizes stored telemetry before admin display', () => {
    const event = mapSecurityEventRow({
      event_id: '00000000-0000-4000-8000-000000000001',
      event_type: 'DECOY_HIT',
      request_id: '00000000-0000-4000-8000-000000000002',
      route: `/.env${'x'.repeat(300)}`,
      method: 'GET<script>',
      observed_ip: '203.0.113.10',
      user_agent: `<script>alert(1)</script>${'a'.repeat(400)}`,
      frequency_count: 3,
      rate_limited: false,
      created_at: '2026-06-05T12:00:00.000Z',
      seen_at: null,
      details: { ignored: '<script>alert(1)</script>' },
    });

    expect(event.route).toHaveLength(160);
    expect(event.method).toBe('UNKNOWN');
    expect(event.userAgent).toHaveLength(240);
    expect(event.userAgent).toContain('<script>alert(1)</script>');
    expect(event).not.toHaveProperty('details');
  });
});
