import type { RequestEvent } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { createAdminClient } from '$lib/server/supabase';
import { getClientIp } from '$lib/server/rate-limit';
import { safeRequestMethod, sanitizeLogValue } from '$lib/server/security-helpers';

export type UserActivityType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'CART_VIEW'
  | 'CART_UPDATED'
  | 'CHECKOUT_STARTED'
  | 'ORDER_PLACED'
  | 'SUPPORT_MESSAGE'
  | 'ADMIN_PAGE_VIEW'
  | 'ADMIN_API_ACTION'
  | 'ACCOUNT_VIEW';

let warnedAboutUserActivity = false;

function warnOnce(error: unknown) {
  if (warnedAboutUserActivity) return;
  warnedAboutUserActivity = true;
  console.warn('User activity persistence is unavailable. Create user_activity_events before production use.', error);
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeDetails(details: Record<string, unknown> | undefined) {
  if (!details) return {};

  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(details).slice(0, 8)) {
    const cleanKey = sanitizeLogValue(key, 40);
    if (!cleanKey) continue;

    if (typeof value === 'boolean' || typeof value === 'number') {
      clean[cleanKey] = value;
    } else if (value == null) {
      clean[cleanKey] = null;
    } else {
      clean[cleanKey] = sanitizeLogValue(value, 140);
    }
  }

  return clean;
}

function looksLikeAsset(pathname: string) {
  return /\.(css|js|map|png|jpe?g|webp|svg|ico|woff2?|ttf|xml|txt)$/i.test(pathname);
}

function activityTypeFor(event: RequestEvent): UserActivityType | null {
  const { pathname } = event.url;
  const method = safeRequestMethod(event.request.method);

  if (looksLikeAsset(pathname)) return null;
  if (pathname === '/api/auth/session' || pathname === '/api/ping') return null;

  if (pathname.startsWith('/admin/api') || pathname.startsWith('/api/admin')) return method === 'GET' ? null : 'ADMIN_API_ACTION';
  if (pathname.startsWith('/admin')) return 'ADMIN_PAGE_VIEW';
  if (pathname.startsWith('/produse/')) return 'PRODUCT_VIEW';
  if (pathname === '/cos') return 'CART_VIEW';
  if (pathname === '/cont' || pathname === '/utilizator') return 'ACCOUNT_VIEW';
  if (pathname.startsWith('/api/cart') && method !== 'GET') return 'CART_UPDATED';
  if (pathname.startsWith('/api/checkout') && method !== 'GET') return 'CHECKOUT_STARTED';
  if (pathname.startsWith('/api/orders') && method !== 'GET') return 'ORDER_PLACED';
  if (pathname.startsWith('/api/messages') && method !== 'GET') return 'SUPPORT_MESSAGE';
  if (method === 'GET' && !pathname.startsWith('/api')) return 'PAGE_VIEW';

  return null;
}

export async function recordUserActivity(
  event: RequestEvent,
  activityType?: UserActivityType | null,
  details?: Record<string, unknown>
) {
  if (!event.locals.isAuthenticated || !event.locals.user) return;

  const type = activityType ?? activityTypeFor(event);
  if (!type) return;

  try {
    const ipAddress = sanitizeLogValue(getClientIp(event), 64) || null;
    const userAgent = sanitizeLogValue(event.request.headers.get('user-agent'), 240) || null;
    const route = sanitizeLogValue(event.url.pathname, 180);
    const method = safeRequestMethod(event.request.method);

    const admin = createAdminClient();
    const { error } = await admin.from('user_activity_events').insert({
      user_id: event.locals.user.id,
      session_id: event.locals.session?.sessionId ?? null,
      activity_type: type,
      route,
      method,
      ip_address: ipAddress,
      ip_address_hash: ipAddress ? sha256(ipAddress) : null,
      user_agent: userAgent,
      details: safeDetails(details),
    });

    if (error) throw error;
  } catch (error) {
    warnOnce(error);
  }
}
