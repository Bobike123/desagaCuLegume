import type { RequestEvent } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { createAdminClient } from '$lib/server/supabase';
import { checkRateLimit, getClientIp } from '$lib/server/rate-limit';
import { insertAuthLog } from '$lib/server/auth';
import { sanitizeLogValue, safeRequestMethod } from '$lib/server/security-helpers';

export type SecurityEventType =
  | 'DECOY_HIT'
  | 'RATE_LIMIT'
  | 'LOGIN_FAILED'
  | 'LOGIN_SUCCESS'
  | 'LOGOUT'
  | 'SESSION_REVOKED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'MULTIPLE_ACCOUNTS_SAME_IP'
  | 'MANY_FAILED_LOGINS'
  | 'LOGIN_AFTER_FAILURES'
  | 'NEW_DEVICE_LOGIN'
  | 'NEW_IP_LOGIN'
  | 'SUSPICIOUS_CHECKOUT_PATTERN'
  | 'ADMIN_SECURITY_ACTION'
  | 'USER_STATUS_CHANGED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityReviewStatus = 'UNREVIEWED' | 'REVIEWED' | 'FALSE_POSITIVE' | 'NEEDS_ACTION';

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
  severity: SecuritySeverity;
  reviewStatus: SecurityReviewStatus;
  adminNote: string | null;
  targetUser: { id: string; label: string; email: string } | null;
  createdAt: string;
  seenAt: string | null;
  reviewedAt: string | null;
};

export type ActiveSession = {
  sessionId: string;
  userId: string;
  userLabel: string;
  email: string;
  roles: string[];
  status: string;
  startedAt: string;
  lastActivityAt: string;
  expiresAt: string;
  idleMinutes: number;
  sessionAgeMinutes: number;
  stateLabel: 'ACTIVE_NOW' | 'ACTIVE_RECENTLY' | 'IDLE' | 'EXPIRING_SOON';
  ipAddress: string;
  browser: string;
  os: string;
  device: string;
};

export type SharedIpGroup = {
  ipAddress: string;
  accountCount: number;
  activeSessions: number;
  failedLogins30d: number;
  orders: number;
  firstSeenAt: string;
  lastSeenAt: string;
  riskScore: number;
  riskLevel: SecuritySeverity;
  reasons: string[];
  users: Array<{
    id: string;
    label: string;
    email: string;
    status: string;
    lastSeenAt: string;
    userAgents: string[];
  }>;
};

export type RiskyUser = {
  userId: string;
  label: string;
  email: string;
  status: string;
  riskScore: number;
  riskLevel: SecuritySeverity;
  reasons: string[];
  activeSessions: number;
  failedLogins30d: number;
  sharedIpAccounts: number;
  recentActivityCount: number;
  lastActivityAt: string | null;
};

export type AdminAuditEntry = {
  id: string;
  action: string;
  adminLabel: string;
  targetLabel: string;
  note: string | null;
  createdAt: string;
};

export type SecurityDashboardData = {
  unreadCount: number;
  unreviewedCount: number;
  decoyHits24h: number;
  rateLimitEvents24h: number;
  failedLogins24h: number;
  activeSessionsNow: number;
  suspiciousIpGroups: number;
  highRiskUsers: number;
  adminActions7d: number;
  failedLoginTrends: Array<{ date: string; count: number }>;
  activeSessions: ActiveSession[];
  sharedIpGroups: SharedIpGroup[];
  riskyUsers: RiskyUser[];
  adminAudit: AdminAuditEntry[];
  events: SecurityEvent[];
  page: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const TABLE_NAME = 'security_events';
const DAY_MS = 24 * 60 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ACTIVE_NOW_MS = 5 * 60 * 1000;
const ACTIVE_RECENT_MS = 30 * 60 * 1000;
let warnedAboutSecurityEvents = false;

function warnOnce(error: unknown) {
  if (warnedAboutSecurityEvents) return;
  warnedAboutSecurityEvents = true;
  console.warn(
    'Security event persistence is unavailable. Apply the security SQL schema update before production use.',
    error
  );
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeDetails(details: Record<string, unknown> | undefined) {
  if (!details) return {};

  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(details).slice(0, 12)) {
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

    clean[cleanKey] = sanitizeLogValue(value, 140);
  }

  return clean;
}

function relationRow(value: any) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function displayUser(row: any) {
  if (!row) return { id: '', label: 'Utilizator necunoscut', email: '—', status: 'UNKNOWN' };
  return {
    id: String(row.user_id ?? ''),
    label: sanitizeLogValue(row.full_name || row.username || row.email || 'Utilizator', 120),
    email: sanitizeLogValue(row.email, 160) || '—',
    status: sanitizeLogValue(row.status, 40) || 'UNKNOWN',
  };
}

function roleName(row: any) {
  const value = row?.roles;
  if (Array.isArray(value)) return value[0]?.role_name ?? null;
  return value?.role_name ?? null;
}

function hasAdminRole(roles: string[] | undefined | null) {
  return (roles ?? []).some((role) => String(role).toUpperCase() === 'ADMIN');
}

async function rolesByUser(admin: ReturnType<typeof createAdminClient>, userIds: number[]) {
  const roles = new Map<number, string[]>();
  if (userIds.length === 0) return roles;

  const { data, error } = await admin
    .from('user_roles')
    .select('user_id, roles(role_name)')
    .in('user_id', [...new Set(userIds)]);

  if (error) throw error;

  for (const row of data ?? []) {
    const userId = Number(row.user_id);
    const name = roleName(row);
    if (!name) continue;
    roles.set(userId, [...(roles.get(userId) ?? []), String(name)]);
  }

  return roles;
}

function browserFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (!ua || ua === 'indisponibil') return 'Necunoscut';
  if (ua.includes('edg/')) return 'Microsoft Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('samsungbrowser')) return 'Samsung Internet';
  if (ua.includes('chrome/') && !ua.includes('chromium')) return 'Chrome';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('safari/') && ua.includes('version/')) return 'Safari';
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return 'Bot/Crawler';
  return 'Alt browser';
}

function osFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS/iPadOS';
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  return 'Necunoscut';
}

function deviceFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return 'Bot';
  if (ua.includes('ipad') || ua.includes('tablet')) return 'Tabletă';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobil';
  return 'Desktop';
}

function severityFromScore(score: number): SecuritySeverity {
  if (score >= 85) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

function stateForSession(lastActivityAt: string, expiresAt: string): ActiveSession['stateLabel'] {
  const idle = Date.now() - new Date(lastActivityAt).getTime();
  const expiresIn = new Date(expiresAt).getTime() - Date.now();
  if (Number.isFinite(expiresIn) && expiresIn > 0 && expiresIn < 10 * 60 * 1000) return 'EXPIRING_SOON';
  if (Number.isFinite(idle) && idle <= ACTIVE_NOW_MS) return 'ACTIVE_NOW';
  if (Number.isFinite(idle) && idle <= ACTIVE_RECENT_MS) return 'ACTIVE_RECENTLY';
  return 'IDLE';
}

export function mapSecurityEventRow(row: any): SecurityEvent {
  const target = relationRow(row.users);

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
    severity: (row.severity ?? 'LOW') as SecuritySeverity,
    reviewStatus: (row.review_status ?? (row.seen_at ? 'REVIEWED' : 'UNREVIEWED')) as SecurityReviewStatus,
    adminNote: sanitizeLogValue(row.admin_note, 240) || null,
    targetUser: target
      ? {
          id: String(target.user_id),
          label: sanitizeLogValue(target.full_name || target.username || target.email, 120),
          email: sanitizeLogValue(target.email, 160),
        }
      : null,
    createdAt: row.created_at,
    seenAt: row.seen_at ?? null,
    reviewedAt: row.reviewed_at ?? null,
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
  severity?: SecuritySeverity;
  targetUserId?: number | null;
}) {
  try {
    const route = sanitizeLogValue(payload.route ?? payload.event.url.pathname, 160);
    const perIpLimit = await checkRateLimit(payload.event, {
      scope: 'security-event-write',
      limit: 80,
      windowMs: FIFTEEN_MINUTES,
    });
    if (!perIpLimit.allowed) return;

    const perRouteLimit = await checkRateLimit(payload.event, {
      scope: `security-event-write-route:${sha256(`${payload.eventType}:${route}`).slice(0, 32)}`,
      limit: 30,
      windowMs: FIFTEEN_MINUTES,
    });
    if (!perRouteLimit.allowed) return;

    const admin = createAdminClient();

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
      severity: payload.severity ?? 'LOW',
      review_status: 'UNREVIEWED',
      target_user_id: payload.targetUserId ?? null,
      related_ip_hash: observedIpHash,
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
    const now = new Date().toISOString();
    const recent = new Date(Date.now() - ACTIVE_RECENT_MS).toISOString();
    const sevenDays = new Date(Date.now() - 7 * DAY_MS).toISOString();

    const [unreadCount, unreviewedCount, decoyHits24h, rateLimitEvents24h, failedLogins24h, activeSessionsNow, adminActions7d] = await Promise.all([
      countEvents(admin, (query) => query.is('seen_at', null)),
      countEvents(admin, (query) => query.eq('review_status', 'UNREVIEWED')),
      countEvents(admin, (query) => query.eq('event_type', 'DECOY_HIT').gte('created_at', since)),
      countEvents(admin, (query) => query.eq('event_type', 'RATE_LIMIT').gte('created_at', since)),
      countEvents(admin, (query) => query.eq('event_type', 'LOGIN_FAILED').gte('created_at', since)),
      admin
        .from('sessions')
        .select('session_id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .gt('expires_at', now)
        .gte('last_activity_at', recent)
        .then(({ count, error }) => {
          if (error) throw error;
          return count ?? 0;
        }),
      countEvents(admin, (query) => query.eq('event_type', 'ADMIN_SECURITY_ACTION').gte('created_at', sevenDays)),
    ]);

    return {
      unreadCount,
      unreviewedCount,
      decoyHits24h,
      rateLimitEvents24h,
      failedLogins24h,
      activeSessionsNow,
      adminActions7d,
    };
  } catch (error) {
    warnOnce(error);
    return {
      unreadCount: 0,
      unreviewedCount: 0,
      decoyHits24h: 0,
      rateLimitEvents24h: 0,
      failedLogins24h: 0,
      activeSessionsNow: 0,
      adminActions7d: 0,
    };
  }
}

async function loadActiveSessions(admin: ReturnType<typeof createAdminClient>) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('sessions')
    .select('session_id, user_id, status, created_at, last_activity_at, expires_at, ip_address, user_agent, users(user_id, username, email, full_name, status)')
    .eq('status', 'ACTIVE')
    .gt('expires_at', now)
    .order('last_activity_at', { ascending: false })
    .limit(120);

  if (error) throw error;

  const rows = data ?? [];
  const userIds = rows.map((row: any) => Number(row.user_id)).filter(Number.isFinite);
  const roles = await rolesByUser(admin, userIds);

  return rows.map((row: any): ActiveSession => {
    const user = displayUser(relationRow(row.users) ?? { user_id: row.user_id });
    const userAgent = sanitizeLogValue(row.user_agent, 240) || 'Indisponibil';
    const started = new Date(row.created_at).getTime();
    const last = new Date(row.last_activity_at).getTime();
    const nowMs = Date.now();

    return {
      sessionId: String(row.session_id),
      userId: String(row.user_id),
      userLabel: user.label,
      email: user.email,
      roles: roles.get(Number(row.user_id)) ?? [],
      status: sanitizeLogValue(row.status, 40) || 'ACTIVE',
      startedAt: row.created_at,
      lastActivityAt: row.last_activity_at,
      expiresAt: row.expires_at,
      idleMinutes: Number.isFinite(last) ? Math.max(0, Math.floor((nowMs - last) / 60000)) : 0,
      sessionAgeMinutes: Number.isFinite(started) ? Math.max(0, Math.floor((nowMs - started) / 60000)) : 0,
      stateLabel: stateForSession(row.last_activity_at, row.expires_at),
      ipAddress: sanitizeLogValue(row.ip_address, 64) || 'Indisponibil',
      browser: browserFromUserAgent(userAgent),
      os: osFromUserAgent(userAgent),
      device: deviceFromUserAgent(userAgent),
    };
  });
}

async function failedLoginCountsByIp(admin: ReturnType<typeof createAdminClient>) {
  const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const { data, error } = await admin
    .from(TABLE_NAME)
    .select('observed_ip')
    .eq('event_type', 'LOGIN_FAILED')
    .gte('created_at', since)
    .not('observed_ip', 'is', null)
    .limit(2000);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const ip = sanitizeLogValue(row.observed_ip, 64);
    if (!ip) continue;
    counts.set(ip, (counts.get(ip) ?? 0) + 1);
  }
  return counts;
}

async function orderCountsByUser(admin: ReturnType<typeof createAdminClient>, userIds: number[]) {
  const counts = new Map<number, number>();
  if (userIds.length === 0) return counts;

  const { data, error } = await admin.from('orders').select('user_id, order_id').in('user_id', [...new Set(userIds)]).limit(2000);
  if (error) throw error;

  for (const row of data ?? []) {
    const userId = Number(row.user_id);
    if (!Number.isFinite(userId)) continue;
    counts.set(userId, (counts.get(userId) ?? 0) + 1);
  }

  return counts;
}

async function recentActivityCounts(admin: ReturnType<typeof createAdminClient>, userIds: number[]) {
  const counts = new Map<number, { count: number; lastAt: string | null }>();
  if (userIds.length === 0) return counts;

  const since = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const { data, error } = await admin
    .from('user_activity_events')
    .select('user_id, created_at')
    .in('user_id', [...new Set(userIds)])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(3000);

  if (error) throw error;

  for (const row of data ?? []) {
    const userId = Number(row.user_id);
    if (!Number.isFinite(userId)) continue;
    const current = counts.get(userId) ?? { count: 0, lastAt: null };
    counts.set(userId, {
      count: current.count + 1,
      lastAt: current.lastAt ?? row.created_at,
    });
  }

  return counts;
}

async function loadSharedIpGroups(admin: ReturnType<typeof createAdminClient>, activeSessions: ActiveSession[]) {
  const since = new Date(Date.now() - 90 * DAY_MS).toISOString();
  const { data, error } = await admin
    .from('sessions')
    .select('user_id, status, created_at, last_activity_at, ip_address, user_agent, users(user_id, username, email, full_name, status)')
    .not('ip_address', 'is', null)
    .gte('created_at', since)
    .order('last_activity_at', { ascending: false })
    .limit(2500);

  if (error) throw error;

  const failedByIp = await failedLoginCountsByIp(admin);
  const allUserIds: number[] = [...new Set<number>((data ?? []).map((row: any) => Number(row.user_id)).filter((value: number) => Number.isFinite(value)))];
  const [ordersByUser, rolesById] = await Promise.all([
    orderCountsByUser(admin, allUserIds),
    rolesByUser(admin, allUserIds),
  ]);
  const activeByIp = new Map<string, number>();
  for (const session of activeSessions) {
    if (hasAdminRole(session.roles)) continue;
    if (session.ipAddress === 'Indisponibil') continue;
    activeByIp.set(session.ipAddress, (activeByIp.get(session.ipAddress) ?? 0) + 1);
  }

  const byIp = new Map<string, any[]>();
  for (const row of data ?? []) {
    const userId = Number(row.user_id);
    if (hasAdminRole(rolesById.get(userId))) continue;

    const ip = sanitizeLogValue(row.ip_address, 64);
    if (!ip) continue;
    byIp.set(ip, [...(byIp.get(ip) ?? []), row]);
  }

  const groups: SharedIpGroup[] = [];
  for (const [ip, rows] of byIp.entries()) {
    const users = new Map<number, { id: string; label: string; email: string; status: string; lastSeenAt: string; userAgents: Set<string> }>();
    let firstSeenAt = rows[0]?.created_at ?? new Date().toISOString();
    let lastSeenAt = rows[0]?.last_activity_at ?? rows[0]?.created_at ?? new Date().toISOString();
    let orders = 0;

    for (const row of rows) {
      const userId = Number(row.user_id);
      const user = displayUser(relationRow(row.users) ?? { user_id: row.user_id });
      const rowFirst = new Date(row.created_at).getTime();
      const rowLast = new Date(row.last_activity_at ?? row.created_at).getTime();
      if (rowFirst < new Date(firstSeenAt).getTime()) firstSeenAt = row.created_at;
      if (rowLast > new Date(lastSeenAt).getTime()) lastSeenAt = row.last_activity_at ?? row.created_at;

      const entry = users.get(userId) ?? {
        id: String(userId),
        label: user.label,
        email: user.email,
        status: user.status,
        lastSeenAt: row.last_activity_at ?? row.created_at,
        userAgents: new Set<string>(),
      };
      entry.lastSeenAt = new Date(row.last_activity_at ?? row.created_at).getTime() > new Date(entry.lastSeenAt).getTime()
        ? row.last_activity_at ?? row.created_at
        : entry.lastSeenAt;
      const browser = browserFromUserAgent(sanitizeLogValue(row.user_agent, 240));
      const os = osFromUserAgent(sanitizeLogValue(row.user_agent, 240));
      entry.userAgents.add(`${browser} · ${os}`);
      users.set(userId, entry);
    }

    if (users.size < 2) continue;

    for (const userId of users.keys()) orders += ordersByUser.get(userId) ?? 0;

    const failedLogins30d = failedByIp.get(ip) ?? 0;
    const activeSessionsForIp = activeByIp.get(ip) ?? 0;
    const reasons: string[] = [];
    let score = 15;

    if (users.size >= 2) reasons.push(`${users.size} conturi non-admin folosesc același IP`);
    score += Math.min(35, users.size * 8);
    if (activeSessionsForIp >= 2) {
      reasons.push(`${activeSessionsForIp} sesiuni active pe același IP`);
      score += Math.min(20, activeSessionsForIp * 5);
    }
    if (failedLogins30d >= 5) {
      reasons.push(`${failedLogins30d} autentificări eșuate în 30 zile`);
      score += Math.min(30, failedLogins30d * 3);
    }
    if (orders > 0) reasons.push(`${orders} comenzi asociate conturilor din grup`);

    groups.push({
      ipAddress: ip,
      accountCount: users.size,
      activeSessions: activeSessionsForIp,
      failedLogins30d,
      orders,
      firstSeenAt,
      lastSeenAt,
      riskScore: Math.min(100, score),
      riskLevel: severityFromScore(score),
      reasons,
      users: [...users.values()].map((user) => ({
        id: user.id,
        label: user.label,
        email: user.email,
        status: user.status,
        lastSeenAt: user.lastSeenAt,
        userAgents: [...user.userAgents].slice(0, 4),
      })),
    });
  }

  return groups.sort((a, b) => b.riskScore - a.riskScore || b.accountCount - a.accountCount).slice(0, 25);
}

async function loadRiskyUsers(
  admin: ReturnType<typeof createAdminClient>,
  activeSessions: ActiveSession[],
  sharedIpGroups: SharedIpGroup[]
) {
  const users = new Map<number, RiskyUser>();

  for (const session of activeSessions) {
    if (hasAdminRole(session.roles)) continue;

    const userId = Number(session.userId);
    const current = users.get(userId) ?? {
      userId: session.userId,
      label: session.userLabel,
      email: session.email,
      status: 'ACTIVE',
      riskScore: 0,
      riskLevel: 'LOW' as SecuritySeverity,
      reasons: [],
      activeSessions: 0,
      failedLogins30d: 0,
      sharedIpAccounts: 0,
      recentActivityCount: 0,
      lastActivityAt: session.lastActivityAt,
    };
    current.activeSessions += 1;
    current.lastActivityAt = !current.lastActivityAt || new Date(session.lastActivityAt) > new Date(current.lastActivityAt)
      ? session.lastActivityAt
      : current.lastActivityAt;
    users.set(userId, current);
  }

  for (const group of sharedIpGroups) {
    for (const member of group.users) {
      const userId = Number(member.id);
      const current = users.get(userId) ?? {
        userId: member.id,
        label: member.label,
        email: member.email,
        status: member.status,
        riskScore: 0,
        riskLevel: 'LOW' as SecuritySeverity,
        reasons: [],
        activeSessions: 0,
        failedLogins30d: 0,
        sharedIpAccounts: 0,
        recentActivityCount: 0,
        lastActivityAt: member.lastSeenAt,
      };
      current.sharedIpAccounts = Math.max(current.sharedIpAccounts, group.accountCount);
      current.failedLogins30d += group.failedLogins30d;
      current.lastActivityAt = !current.lastActivityAt || new Date(member.lastSeenAt) > new Date(current.lastActivityAt)
        ? member.lastSeenAt
        : current.lastActivityAt;
      current.reasons.push(...group.reasons.slice(0, 3));
      users.set(userId, current);
    }
  }

  const userIds = [...users.keys()].filter(Number.isFinite);
  const activity = await recentActivityCounts(admin, userIds).catch(() => new Map<number, { count: number; lastAt: string | null }>());

  for (const [userId, user] of users.entries()) {
    const activityInfo = activity.get(userId);
    user.recentActivityCount = activityInfo?.count ?? 0;
    if (activityInfo?.lastAt) user.lastActivityAt = activityInfo.lastAt;

    let score = 0;
    if (user.activeSessions > 1) {
      user.reasons.push(`${user.activeSessions} sesiuni active`);
      score += Math.min(25, user.activeSessions * 8);
    }
    if (user.sharedIpAccounts > 1) {
      user.reasons.push(`${user.sharedIpAccounts} conturi pe IP comun`);
      score += Math.min(35, user.sharedIpAccounts * 8);
    }
    if (user.failedLogins30d >= 5) {
      user.reasons.push(`${user.failedLogins30d} loginuri eșuate pe IP-uri asociate`);
      score += Math.min(30, user.failedLogins30d * 2);
    }
    if (user.recentActivityCount > 80) {
      user.reasons.push(`${user.recentActivityCount} acțiuni în ultimele 7 zile`);
      score += 10;
    }

    user.reasons = [...new Set(user.reasons)].slice(0, 5);
    user.riskScore = Math.min(100, score);
    user.riskLevel = severityFromScore(user.riskScore);
  }

  return [...users.values()]
    .filter((user) => user.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 30);
}

async function loadAdminAudit(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from(TABLE_NAME)
    .select('event_id, event_type, created_at, admin_note, details, users!security_events_target_user_id_fkey(user_id, username, email, full_name)')
    .eq('event_type', 'ADMIN_SECURITY_ACTION')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) throw error;

  return (data ?? []).map((row: any): AdminAuditEntry => {
    const details = row.details && typeof row.details === 'object' ? row.details : {};
    const target = displayUser(relationRow(row.users));
    return {
      id: String(row.event_id),
      action: sanitizeLogValue(details.action ?? row.event_type, 80) || 'ADMIN_SECURITY_ACTION',
      adminLabel: sanitizeLogValue(details.admin ?? details.adminEmail, 120) || 'Admin',
      targetLabel: target.email !== '—' ? `${target.label} · ${target.email}` : sanitizeLogValue(details.target ?? '—', 120),
      note: sanitizeLogValue(row.admin_note ?? details.note, 240) || null,
      createdAt: row.created_at,
    };
  });
}

export async function getSecurityDashboardData(limit = 80, offset = 0): Promise<SecurityDashboardData> {
  try {
    const admin = createAdminClient();
    const since7d = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
    const safeOffset = Math.max(Math.floor(offset), 0);

    const [stats, activeSessions, recentResult, failedTrendResult] = await Promise.all([
      getSecurityStatsForDashboard(),
      loadActiveSessions(admin),
      admin
        .from(TABLE_NAME)
        .select(
          'event_id, event_type, request_id, route, method, observed_ip, user_agent, frequency_count, rate_limited, created_at, seen_at, severity, review_status, reviewed_at, admin_note, users!security_events_target_user_id_fkey(user_id, username, email, full_name)'
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

    const [sharedIpGroups, adminAudit] = await Promise.all([
      loadSharedIpGroups(admin, activeSessions),
      loadAdminAudit(admin),
    ]);
    const riskyUsers = await loadRiskyUsers(admin, activeSessions, sharedIpGroups);

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
      unreviewedCount: stats.unreviewedCount,
      decoyHits24h: stats.decoyHits24h,
      rateLimitEvents24h: stats.rateLimitEvents24h,
      failedLogins24h: stats.failedLogins24h,
      activeSessionsNow: stats.activeSessionsNow,
      suspiciousIpGroups: sharedIpGroups.length,
      highRiskUsers: riskyUsers.filter((user) => user.riskLevel === 'HIGH' || user.riskLevel === 'CRITICAL').length,
      adminActions7d: stats.adminActions7d,
      failedLoginTrends: [...trendMap.entries()].map(([date, count]) => ({ date, count })),
      activeSessions,
      sharedIpGroups,
      riskyUsers,
      adminAudit,
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
      unreviewedCount: 0,
      decoyHits24h: 0,
      rateLimitEvents24h: 0,
      failedLogins24h: 0,
      activeSessionsNow: 0,
      suspiciousIpGroups: 0,
      highRiskUsers: 0,
      adminActions7d: 0,
      failedLoginTrends: [],
      activeSessions: [],
      sharedIpGroups: [],
      riskyUsers: [],
      adminAudit: [],
      events: [],
      page: {
        limit: Math.min(Math.max(Math.floor(limit), 1), 100),
        offset: Math.max(Math.floor(offset), 0),
        hasMore: false,
      },
    };
  }
}

export async function markSecurityEventsRead(adminUserId?: number | null, event?: RequestEvent | null) {
  try {
    const admin = createAdminClient();
    const seenAt = new Date().toISOString();
    const { data, error } = await admin
      .from(TABLE_NAME)
      .update({ seen_at: seenAt })
      .is('seen_at', null)
      .select('event_id');

    if (error) throw error;

    if (event && adminUserId && (data?.length ?? 0) > 0) {
      await recordSecurityEvent({
        event,
        eventType: 'ADMIN_SECURITY_ACTION',
        route: '/api/admin/security-events',
        severity: 'LOW',
        details: { action: 'MARK_EVENTS_READ', marked: data?.length ?? 0, admin: event.locals.user?.email ?? 'admin' },
      });
    }

    return data?.length ?? 0;
  } catch (error) {
    warnOnce(error);
    return 0;
  }
}

export async function reviewSecurityEvent(payload: {
  event: RequestEvent;
  eventId: string;
  reviewStatus: SecurityReviewStatus;
  adminNote?: string | null;
}) {
  const admin = createAdminClient();
  const reviewedAt = new Date().toISOString();
  const adminId = payload.event.locals.user?.id ?? null;

  const { error } = await admin
    .from(TABLE_NAME)
    .update({
      review_status: payload.reviewStatus,
      reviewed_at: reviewedAt,
      reviewed_by_admin_id: adminId,
      seen_at: reviewedAt,
      admin_note: sanitizeLogValue(payload.adminNote, 240) || null,
    })
    .eq('event_id', payload.eventId);

  if (error) throw error;

  await recordSecurityEvent({
    event: payload.event,
    eventType: 'ADMIN_SECURITY_ACTION',
    route: '/api/admin/security-events',
    severity: 'LOW',
    details: {
      action: 'REVIEW_SECURITY_EVENT',
      reviewStatus: payload.reviewStatus,
      admin: payload.event.locals.user?.email ?? 'admin',
    },
  });
}

async function loadSessionForAdminAction(admin: ReturnType<typeof createAdminClient>, sessionId: string) {
  const { data, error } = await admin
    .from('sessions')
    .select('session_id, user_id, status, users(user_id, username, email, full_name)')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function revokeSecuritySession(payload: { event: RequestEvent; sessionId: string }) {
  const admin = createAdminClient();
  const existing = await loadSessionForAdminAction(admin, payload.sessionId);
  if (!existing) return { revoked: 0, targetUserId: null };

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('sessions')
    .update({ status: 'REVOKED', ended_at: now, last_activity_at: now })
    .eq('session_id', payload.sessionId)
    .eq('status', 'ACTIVE')
    .select('session_id');

  if (error) throw error;
  const revoked = data?.length ?? 0;

  if (revoked > 0) {
    await insertAuthLog({
      userId: Number(existing.user_id),
      sessionId: String(existing.session_id),
      eventType: 'SESSION_REVOKED',
      details: { byAdmin: payload.event.locals.user?.email ?? 'admin' },
    }).catch(warnOnce);

    const target = displayUser(relationRow(existing.users));
    await recordSecurityEvent({
      event: payload.event,
      eventType: 'ADMIN_SECURITY_ACTION',
      route: '/api/admin/security-events',
      severity: 'MEDIUM',
      targetUserId: Number(existing.user_id),
      details: {
        action: 'REVOKE_SESSION',
        admin: payload.event.locals.user?.email ?? 'admin',
        target: `${target.label} · ${target.email}`,
      },
    });
  }

  return { revoked, targetUserId: Number(existing.user_id) };
}

export async function revokeUserSecuritySessions(payload: { event: RequestEvent; userId: number }) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: selectError } = await admin
    .from('sessions')
    .select('session_id, user_id, users(user_id, username, email, full_name)')
    .eq('user_id', payload.userId)
    .eq('status', 'ACTIVE');

  if (selectError) throw selectError;

  const { data, error } = await admin
    .from('sessions')
    .update({ status: 'REVOKED', ended_at: now, last_activity_at: now })
    .eq('user_id', payload.userId)
    .eq('status', 'ACTIVE')
    .select('session_id');

  if (error) throw error;

  const revoked = data?.length ?? 0;
  if (revoked > 0) {
    await Promise.all(
      (existing ?? []).map((row: any) =>
        insertAuthLog({
          userId: payload.userId,
          sessionId: String(row.session_id),
          eventType: 'SESSION_REVOKED',
          details: { byAdmin: payload.event.locals.user?.email ?? 'admin' },
        }).catch(warnOnce)
      )
    );

    const target = displayUser(relationRow(existing?.[0]?.users) ?? { user_id: payload.userId });
    await recordSecurityEvent({
      event: payload.event,
      eventType: 'ADMIN_SECURITY_ACTION',
      route: '/api/admin/security-events',
      severity: 'MEDIUM',
      targetUserId: payload.userId,
      details: {
        action: 'REVOKE_ALL_USER_SESSIONS',
        revoked,
        admin: payload.event.locals.user?.email ?? 'admin',
        target: `${target.label} · ${target.email}`,
      },
    });
  }

  return { revoked };
}
