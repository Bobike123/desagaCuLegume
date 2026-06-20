import type { RequestEvent } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { createAdminClient } from '$lib/server/supabase';
import { checkRateLimit, getClientIp } from '$lib/server/rate-limit';
import { sanitizeLogValue, safeRequestMethod } from '$lib/server/security-helpers';

export type SecurityEventType = 'DECOY_HIT' | 'RATE_LIMIT' | 'LOGIN_FAILED';

export type SecurityEvent = {
  id: string;
  eventType: SecurityEventType;
  requestId: string;
  route: string;
  method: string;
  observedIp: string;
  userAgent: string;
  frequencyCount: number;
  rateLimited: boolean;
  countryRegion: string | null;
  createdAt: string;
  seenAt: string | null;
};

export type SecurityDashboardData = {
  unreadCount: number;
  decoyHits24h: number;
  rateLimitEvents24h: number;
  failedLogins24h: number;
  failedLoginTrends: Array<{ date: string; count: number }>;
  events: SecurityEvent[];
  page: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const RETENTION_DAYS = Number(process.env.SECURITY_LOG_RETENTION_DAYS ?? 30);
const TABLE_NAME = 'security_events';
const DAY_MS = 24 * 60 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
let lastPruneAt = 0;
let warnedAboutSecurityEvents = false;

function warnOnce(error: unknown) {
  if (warnedAboutSecurityEvents) return;
  warnedAboutSecurityEvents = true;
  console.warn(
    'Security event persistence is unavailable. Create the security_events table before production use.',
    error
  );
}

function safeRetentionDays() {
  if (!Number.isFinite(RETENTION_DAYS)) return 30;
  return Math.min(Math.max(Math.floor(RETENTION_DAYS), 1), 365);
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
      continue;
    }

    if (value == null) {
      clean[cleanKey] = null;
      continue;
    }

    clean[cleanKey] = sanitizeLogValue(value, 120);
  }

  return clean;
}

async function pruneOldEvents(admin: ReturnType<typeof createAdminClient>) {
  const now = Date.now();
  if (now - lastPruneAt < 60 * 60 * 1000) return;
  lastPruneAt = now;

  const cutoff = new Date(now - safeRetentionDays() * DAY_MS).toISOString();
  const { error } = await admin.from(TABLE_NAME).delete().lt('created_at', cutoff);
  if (error) throw error;
}

export function mapSecurityEventRow(row: any): SecurityEvent {
  return {
    id: String(row.event_id),
    eventType: row.event_type,
    requestId: String(row.request_id),
    route: sanitizeLogValue(row.route, 160),
    method: safeRequestMethod(row.method),
    observedIp: sanitizeLogValue(row.observed_ip, 64) || 'Indisponibil',
    userAgent: sanitizeLogValue(row.user_agent, 240) || 'Indisponibil',
    frequencyCount: Number(row.frequency_count ?? 1),
    rateLimited: Boolean(row.rate_limited),
    countryRegion: null,
    createdAt: row.created_at,
    seenAt: row.seen_at ?? null,
  };
}

async function countEvents(
  admin: ReturnType<typeof createAdminClient>,
  filter: (query: any) => any
) {
  const query = filter(admin.from(TABLE_NAME).select('event_id', { count: 'exact', head: true }));
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function getFrequencyCount(
  admin: ReturnType<typeof createAdminClient>,
  eventType: SecurityEventType,
  route: string,
  observedIp: string
) {
  const since = new Date(Date.now() - DAY_MS).toISOString();
  let query = admin
    .from(TABLE_NAME)
    .select('event_id', { count: 'exact', head: true })
    .eq('event_type', eventType)
    .eq('route', route)
    .gte('created_at', since);

  if (observedIp) query = query.eq('observed_ip_hash', sha256(observedIp));

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) + 1;
}

export async function recordSecurityEvent(payload: {
  event: RequestEvent;
  eventType: SecurityEventType;
  route?: string;
  requestId?: string;
  rateLimited?: boolean;
  details?: Record<string, unknown>;
}) {
  try {
    const route = sanitizeLogValue(payload.route ?? payload.event.url.pathname, 160);
    const perIpLimit = await checkRateLimit(payload.event, {
      scope: 'security-event-write',
      limit: 60,
      windowMs: FIFTEEN_MINUTES,
    });
    if (!perIpLimit.allowed) return;

    const perRouteLimit = await checkRateLimit(payload.event, {
      scope: `security-event-write-route:${sha256(`${payload.eventType}:${route}`).slice(0, 32)}`,
      limit: 20,
      windowMs: FIFTEEN_MINUTES,
    });
    if (!perRouteLimit.allowed) return;

    const admin = createAdminClient();
    await pruneOldEvents(admin);

    const method = safeRequestMethod(payload.event.request.method);
    const observedIp = sanitizeLogValue(getClientIp(payload.event), 64);
    const userAgent = sanitizeLogValue(payload.event.request.headers.get('user-agent'), 240);
    const requestId = payload.requestId ?? crypto.randomUUID();
    const observedIpHash = observedIp ? sha256(observedIp) : null;
    const requestFingerprint = sha256(
      [payload.eventType, route, method, observedIpHash ?? 'no-ip', sha256(userAgent)].join('|')
    );
    const frequencyCount = await getFrequencyCount(admin, payload.eventType, route, observedIp);

    const { error } = await admin.from(TABLE_NAME).insert({
      event_type: payload.eventType,
      request_id: requestId,
      request_fingerprint: requestFingerprint,
      route,
      method,
      observed_ip: observedIp || null,
      observed_ip_hash: observedIpHash,
      user_agent: userAgent || null,
      frequency_count: frequencyCount,
      rate_limited: Boolean(payload.rateLimited),
      details: safeDetails(payload.details),
    });

    if (error) throw error;
  } catch (error) {
    warnOnce(error);
  }
}

export async function getSecurityStatsForDashboard() {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const [unreadCount, decoyHits24h, rateLimitEvents24h, failedLogins24h] = await Promise.all([
      countEvents(admin, (query) => query.is('seen_at', null)),
      countEvents(admin, (query) => query.eq('event_type', 'DECOY_HIT').gte('created_at', since)),
      countEvents(admin, (query) => query.eq('event_type', 'RATE_LIMIT').gte('created_at', since)),
      countEvents(admin, (query) => query.eq('event_type', 'LOGIN_FAILED').gte('created_at', since)),
    ]);

    return { unreadCount, decoyHits24h, rateLimitEvents24h, failedLogins24h };
  } catch (error) {
    warnOnce(error);
    return { unreadCount: 0, decoyHits24h: 0, rateLimitEvents24h: 0, failedLogins24h: 0 };
  }
}

export async function getSecurityDashboardData(limit = 80, offset = 0): Promise<SecurityDashboardData> {
  try {
    const admin = createAdminClient();
    const since7d = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
    const safeOffset = Math.max(Math.floor(offset), 0);

    const [stats, recentResult, failedTrendResult] = await Promise.all([
      getSecurityStatsForDashboard(),
      admin
        .from(TABLE_NAME)
        .select(
          'event_id, event_type, request_id, route, method, observed_ip, user_agent, frequency_count, rate_limited, created_at, seen_at'
        )
        .order('created_at', { ascending: false })
        .range(safeOffset, safeOffset + safeLimit),
      admin
        .from(TABLE_NAME)
        .select('created_at')
        .eq('event_type', 'LOGIN_FAILED')
        .gte('created_at', since7d)
        .limit(500),
    ]);

    if (recentResult.error) throw recentResult.error;
    if (failedTrendResult.error) throw failedTrendResult.error;

    const trendMap = new Map<string, number>();
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(Date.now() - index * DAY_MS).toISOString().slice(0, 10);
      trendMap.set(date, 0);
    }

    for (const row of failedTrendResult.data ?? []) {
      const date = String(row.created_at).slice(0, 10);
      if (trendMap.has(date)) trendMap.set(date, (trendMap.get(date) ?? 0) + 1);
    }

    const recentRows = recentResult.data ?? [];

    return {
      unreadCount: stats.unreadCount,
      decoyHits24h: stats.decoyHits24h,
      rateLimitEvents24h: stats.rateLimitEvents24h,
      failedLogins24h: stats.failedLogins24h,
      failedLoginTrends: [...trendMap.entries()].map(([date, count]) => ({ date, count })),
      events: recentRows.slice(0, safeLimit).map(mapSecurityEventRow),
      page: {
        limit: safeLimit,
        offset: safeOffset,
        hasMore: recentRows.length > safeLimit,
      },
    };
  } catch (error) {
    warnOnce(error);
    return {
      unreadCount: 0,
      decoyHits24h: 0,
      rateLimitEvents24h: 0,
      failedLogins24h: 0,
      failedLoginTrends: [],
      events: [],
      page: {
        limit: Math.min(Math.max(Math.floor(limit), 1), 100),
        offset: Math.max(Math.floor(offset), 0),
        hasMore: false,
      },
    };
  }
}

export async function markSecurityEventsRead() {
  try {
    const admin = createAdminClient();
    const seenAt = new Date().toISOString();
    const { data, error } = await admin
      .from(TABLE_NAME)
      .update({ seen_at: seenAt })
      .is('seen_at', null)
      .select('event_id');

    if (error) throw error;
    return data?.length ?? 0;
  } catch (error) {
    warnOnce(error);
    return 0;
  }
}
