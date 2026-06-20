import type { RequestEvent } from '@sveltejs/kit';

export const SUSPICIOUS_DECOY_PATHS = [
  '/admin-backup',
  '/old-admin',
  '/phpmyadmin',
  '/wp-admin',
  '/.env',
  '/backup.zip',
  '/database-dump',
  '/internal-panel',
] as const;

const SUSPICIOUS_DECOY_PATH_SET = new Set<string>(SUSPICIOUS_DECOY_PATHS);
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export type DecoyPageData = {
  path: string;
  method: string;
  timestamp: string;
  requestId: string;
  rateLimited?: boolean;
};

export function isSuspiciousDecoyPath(pathname: string) {
  return SUSPICIOUS_DECOY_PATH_SET.has(pathname);
}

export function sanitizeLogValue(value: unknown, maxLength = 240) {
  if (value == null) return '';
  return String(value).replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

export function safeRequestMethod(method: string) {
  const value = sanitizeLogValue(method, 12).toUpperCase();
  return /^[A-Z]{1,12}$/.test(value) ? value : 'UNKNOWN';
}

export function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isStateChangingMethod(method: string) {
  return STATE_CHANGING_METHODS.has(method.toUpperCase());
}

export function isAllowedSameOriginRequest(request: Request, requestUrl: URL) {
  if (!isStateChangingMethod(request.method)) return true;

  const origin = request.headers.get('origin');
  if (origin) return origin === requestUrl.origin;

  const referer = request.headers.get('referer');
  if (!referer) return true;

  try {
    return new URL(referer).origin === requestUrl.origin;
  } catch {
    return false;
  }
}

function buildContentSecurityPolicy(supabaseUrl?: string | null) {
  const connectSources = ["'self'"];
  if (supabaseUrl) connectSources.push(supabaseUrl);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    "frame-src 'self'",
  ].join('; ');
}

export function setSecurityHeaders(headers: Headers, event: RequestEvent, supabaseUrl?: string | null) {
  headers.set('Content-Security-Policy', buildContentSecurityPolicy(supabaseUrl));
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  const hstsEnabled =
    process.env.SECURITY_ENFORCE_HTTPS === 'true' ||
    (process.env.NODE_ENV === 'production' && event.url.protocol === 'https:');

  if (hstsEnabled) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

export function buildDecoyPage(data: DecoyPageData) {
  const title = 'Cerere suspectă detectată';
  const statusLine = data.rateLimited
    ? '<p class="status">Accesările repetate sunt limitate temporar.</p>'
    : '';

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <title>${title}</title>
    <style>
      :root { color-scheme: light; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f7f1e6; color: #172015; }
      main { width: min(720px, calc(100vw - 32px)); border: 1px solid rgba(23, 32, 21, 0.14); background: #fffdf7; padding: 28px; box-shadow: 0 24px 70px rgba(28, 45, 24, 0.12); }
      h1 { margin: 0 0 12px; font-size: clamp(2rem, 7vw, 3.8rem); line-height: 0.95; }
      p { margin: 0 0 18px; color: #4f5f49; font-weight: 700; }
      dl { margin: 0; display: grid; gap: 10px; }
      div { display: grid; gap: 3px; padding: 10px 0; border-top: 1px solid rgba(23, 32, 21, 0.1); }
      dt { color: #687562; font-size: 0.78rem; text-transform: uppercase; font-weight: 900; }
      dd { margin: 0; overflow-wrap: anywhere; font-weight: 800; }
      .status { color: #842029; }
      .playful { margin-top: 20px; color: #274f2a; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>Acest endpoint este monitorizat. Nu există date reale aici.</p>
      ${statusLine}
      <dl>
        <div><dt>Cale cerere</dt><dd>${escapeHtml(data.path)}</dd></div>
        <div><dt>Metodă cerere</dt><dd>${escapeHtml(data.method)}</dd></div>
        <div><dt>Moment</dt><dd>${escapeHtml(data.timestamp)}</dd></div>
        <div><dt>ID cerere</dt><dd>${escapeHtml(data.requestId)}</dd></div>
      </dl>
      <p class="playful">Monitorizăm traficul suspect pentru protecția aplicației.</p>
    </main>
  </body>
</html>`;
}
