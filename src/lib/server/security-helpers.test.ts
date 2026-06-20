import { describe, expect, it } from 'vitest';
import {
  SUSPICIOUS_DECOY_PATHS,
  buildDecoyPage,
  escapeHtml,
  isAllowedSameOriginRequest,
  isSuspiciousDecoyPath,
  safeRequestMethod,
  sanitizeLogValue,
  setSecurityHeaders,
} from './security-helpers';

describe('security decoy helpers', () => {
  it('matches only exact suspicious decoy routes', () => {
    for (const path of SUSPICIOUS_DECOY_PATHS) {
      expect(isSuspiciousDecoyPath(path)).toBe(true);
      expect(isSuspiciousDecoyPath(`${path}/`)).toBe(false);
    }

    expect(isSuspiciousDecoyPath('/admin')).toBe(false);
    expect(isSuspiciousDecoyPath('/admin-backup-extra')).toBe(false);
    expect(isSuspiciousDecoyPath('/wp-admin-login')).toBe(false);
    expect(isSuspiciousDecoyPath('/backup.zip.old')).toBe(false);
  });

  it('renders a harmless visitor-facing warning without raw HTML injection', () => {
    const html = buildDecoyPage({
      path: '/.env?<script>alert(1)</script>',
      method: 'GET',
      timestamp: '2026-06-05T12:00:00.000Z',
      requestId: '00000000-0000-4000-8000-000000000001',
    });

    expect(html).toContain('Cerere suspectă detectată');
    expect(html).toContain('Acest endpoint este monitorizat. Nu există date reale aici.');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('Observed IP address');
    expect(html).not.toContain('VPN');
    expect(html).not.toContain('geolocation');
  });

  it('sanitizes oversized and XSS-looking log strings before storage/display helpers use them', () => {
    const long = `${'a'.repeat(300)}\u0000<script>alert(1)</script>`;
    const sanitized = sanitizeLogValue(long, 80);

    expect(sanitized).toHaveLength(80);
    expect(sanitized).not.toContain('\u0000');
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('renders SQL injection-looking request values as inert escaped text', () => {
    const injection = "/.env' OR '1'='1; DROP TABLE users; --";
    const html = buildDecoyPage({
      path: injection,
      method: 'GET',
      timestamp: '2026-06-05T12:00:00.000Z',
      requestId: '00000000-0000-4000-8000-000000000003',
    });

    expect(html).toContain('DROP TABLE users');
    expect(html).toContain('&#39; OR &#39;1&#39;=&#39;1');
    expect(html).not.toContain("path: '/.env'");
  });

  it('shows rate-limited warning in decoy page when rateLimited is true', () => {
    const html = buildDecoyPage({
      path: '/wp-admin',
      method: 'GET',
      timestamp: '2026-06-05T12:00:00.000Z',
      requestId: '00000000-0000-4000-8000-000000000001',
      rateLimited: true,
    });
    expect(html).toContain('Accesările repetate sunt limitate temporar.');
  });

  it('allows same-origin state changes and rejects cross-origin state changes', () => {
    const url = new URL('https://desagaculegume.ro/api/checkout');
    const sameOrigin = new Request(url, {
      method: 'POST',
      headers: { origin: 'https://desagaculegume.ro' },
    });
    const crossOrigin = new Request(url, {
      method: 'POST',
      headers: { origin: 'https://example.invalid' },
    });

    expect(isAllowedSameOriginRequest(sameOrigin, url)).toBe(true);
    expect(isAllowedSameOriginRequest(crossOrigin, url)).toBe(false);
    expect(isAllowedSameOriginRequest(new Request(url, { method: 'GET' }), url)).toBe(true);
  });

  it('allows POST with matching referer when no origin header is present', () => {
    const url = new URL('https://desagaculegume.ro/api/test');
    const req = new Request(url, {
      method: 'POST',
      headers: { referer: 'https://desagaculegume.ro/cos' },
    });
    expect(isAllowedSameOriginRequest(req, url)).toBe(true);
  });

  it('rejects POST with cross-origin referer when no origin header', () => {
    const url = new URL('https://desagaculegume.ro/api/test');
    const req = new Request(url, {
      method: 'POST',
      headers: { referer: 'https://evil.example.com/page' },
    });
    expect(isAllowedSameOriginRequest(req, url)).toBe(false);
  });

  it('allows POST with no origin and no referer headers', () => {
    const url = new URL('https://desagaculegume.ro/api/test');
    const req = new Request(url, { method: 'POST' });
    expect(isAllowedSameOriginRequest(req, url)).toBe(true);
  });

  it('rejects POST with malformed referer URL', () => {
    const url = new URL('https://desagaculegume.ro/api/test');
    const req = new Request(url, {
      method: 'POST',
      headers: { referer: 'not a url' },
    });
    expect(isAllowedSameOriginRequest(req, url)).toBe(false);
  });
});

describe('safeRequestMethod', () => {
  it.each([
    ['GET', 'GET'],
    ['post', 'POST'],
    ['DELETE', 'DELETE'],
    ['PATCH', 'PATCH'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(safeRequestMethod(input)).toBe(expected);
  });

  it('returns UNKNOWN for invalid method strings', () => {
    expect(safeRequestMethod('GET /etc/passwd')).toBe('UNKNOWN');
    expect(safeRequestMethod('')).toBe('UNKNOWN');
    expect(safeRequestMethod('GET<script>')).toBe('UNKNOWN');
  });
});

describe('setSecurityHeaders', () => {
  function makeEvent(protocol = 'https:') {
    return {
      url: { protocol },
      request: new Request(`${protocol}//desagaculegume.ro/api/test`),
    } as any;
  }

  it('sets mandatory security headers', () => {
    const headers = new Headers();
    setSecurityHeaders(headers, makeEvent());
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
    expect(headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });

  it('does not set HSTS by default in non-production', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const headers = new Headers();
    setSecurityHeaders(headers, makeEvent());
    expect(headers.get('Strict-Transport-Security')).toBeNull();
    process.env.NODE_ENV = previous;
  });

  it('sets HSTS when SECURITY_ENFORCE_HTTPS=true', () => {
    const previous = process.env.SECURITY_ENFORCE_HTTPS;
    process.env.SECURITY_ENFORCE_HTTPS = 'true';
    const headers = new Headers();
    setSecurityHeaders(headers, makeEvent());
    expect(headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    process.env.SECURITY_ENFORCE_HTTPS = previous ?? '';
  });

  it('includes Supabase URL in CSP connect-src when provided', () => {
    const headers = new Headers();
    setSecurityHeaders(headers, makeEvent(), 'https://supabase.example.co');
    expect(headers.get('Content-Security-Policy')).toContain('https://supabase.example.co');
  });
});
