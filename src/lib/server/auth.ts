import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Cookies } from '@sveltejs/kit';
import {
  ADMIN_SESSION_TIMEOUT_MINUTES,
  SESSION_COOKIE_NAME,
  USER_SESSION_TIMEOUT_MINUTES,
  createAdminClient,
} from '$lib/server/supabase';
import { trustedIpFromHeaders } from '$lib/server/rate-limit';
import type { ResolveSessionArgs } from '$lib/server/rpc-contracts';

export type SessionUser = {
  id: number;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  status: string;
};

export type ResolvedSession = {
  sessionId: string;
  userId: number;
  lastActivityAt: string;
  user: SessionUser;
  roles: string[];
  isAdmin: boolean;
};

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};

let warnedAboutSessionRpc = false;
const PASSWORD_KEY_BYTES = 64;
const PASSWORD_HASH_VERSION = 'scrypt:v1';
const SESSION_TOUCH_THROTTLE_MS = 5 * 60 * 1000;
const SESSION_ABSOLUTE_LIFETIME_MS = 24 * 60 * 60 * 1000;
const scryptAsync = promisify(scrypt);

// Real scrypt hash of a random throwaway secret. Login verifies unknown users
// against this so the response time is the same whether or not the account
// exists (otherwise the missing scrypt run is a user-enumeration oracle).
export const DUMMY_PASSWORD_HASH =
  'scrypt:v1:6e0d3b459a85aa9cd3e1cf9b2f3ee186:018204c79a61ae7d8ec85eac60a0b11892806ae0ba02f00c434920ef56c61af054498ed1fef2a60020d2a8ad356b254dc13ed9d8457f9afbd29aace9c91c9641';

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scryptAsync(password, salt, PASSWORD_KEY_BYTES)) as Buffer;
  return `${PASSWORD_HASH_VERSION}:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(':');
  let salt: string | undefined;
  let hash: string | undefined;

  if (parts.length === 2) {
    [salt, hash] = parts;
  } else if (parts.length === 4) {
    const [algorithm, version, versionedSalt, versionedHash] = parts;
    if (`${algorithm}:${version}` !== PASSWORD_HASH_VERSION) return false;
    salt = versionedSalt;
    hash = versionedHash;
  } else {
    return false;
  }

  if (!salt || !hash) return false;
  if (!/^[a-f0-9]+$/i.test(hash)) return false;

  const existing = Buffer.from(hash, 'hex');
  if (existing.length !== PASSWORD_KEY_BYTES) return false;

  const candidate = (await scryptAsync(password, salt, PASSWORD_KEY_BYTES)) as Buffer;

  return timingSafeEqual(candidate, existing);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  };
}

export function getSessionTimeoutMinutes(rolesOrIsAdmin: string[] | boolean = false) {
  const isAdmin = Array.isArray(rolesOrIsAdmin) ? rolesOrIsAdmin.includes('ADMIN') : rolesOrIsAdmin;
  return isAdmin ? ADMIN_SESSION_TIMEOUT_MINUTES : USER_SESSION_TIMEOUT_MINUTES;
}

export function setSessionCookie(cookies: Cookies, token: string, timeoutMinutes = USER_SESSION_TIMEOUT_MINUTES) {
  cookies.set(SESSION_COOKIE_NAME, token, cookieOptions(timeoutMinutes * 60));
}

export function clearSessionCookie(cookies: Cookies) {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

function rolesFromValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((role): role is string => typeof role === 'string' && role.length > 0);
}

function mapResolvedSessionRow(row: any): ResolvedSession | null {
  if (!row || row.user_status === 'DELETED') return null;

  const roles = rolesFromValue(row.roles);

  return {
    sessionId: row.session_id,
    userId: Number(row.user_id),
    lastActivityAt: row.last_activity_at,
    user: {
      id: Number(row.user_id),
      email: row.user_email,
      username: row.username,
      fullName: row.full_name ?? null,
      phone: row.phone ?? null,
      status: row.user_status,
    },
    roles,
    isAdmin: roles.includes('ADMIN'),
  };
}

function isExpiredSessionRow(row: { expires_at?: string | null }) {
  const expiresAt = new Date(row.expires_at ?? '').getTime();
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

// Absolute lifetime cap: sliding idle timeouts alone let an active session
// renew forever. Rows without created_at (pre-migration RPC) pass — the SQL
// filter in resolve_session enforces the cap once 20260702_04 is applied.
function isBeyondAbsoluteLifetime(row: { created_at?: string | null }) {
  if (row.created_at == null) return false;
  const createdAt = new Date(row.created_at).getTime();
  return !Number.isFinite(createdAt) || Date.now() - createdAt >= SESSION_ABSOLUTE_LIFETIME_MS;
}

export async function getRolesForUser(userId: number) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_roles')
    .select('roles(role_name)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? [])
    .map((row: any) => row.roles?.role_name)
    .filter((value: unknown): value is string => typeof value === 'string');
}

export async function findUserByIdentity(identity: string) {
  const admin = createAdminClient();
  const email = normalizeEmail(identity);
  const username = normalizeUsername(identity);

  let result = await admin
    .from('users')
    .select('user_id, email, username, full_name, phone, status, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (result.error) throw result.error;
  if (result.data) return result.data;

  result = await admin
    .from('users')
    .select('user_id, email, username, full_name, phone, status, password_hash')
    .eq('username', username)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data;
}

export async function insertAuthLog(payload: {
  userId?: number | null;
  sessionId?: string | null;
  eventType: string;
  meta?: RequestMeta;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('auth_logs').insert({
    user_id: payload.userId ?? null,
    session_id: payload.sessionId ?? null,
    event_type: payload.eventType,
    ip_address: payload.meta?.ipAddress ?? null,
    user_agent: payload.meta?.userAgent ?? null,
    details: payload.details ?? {},
  });

  if (error) throw error;
}

export async function createSession(
  userId: number,
  meta?: RequestMeta,
  timeoutMinutes = USER_SESSION_TIMEOUT_MINUTES
) {
  const admin = createAdminClient();
  const token = createSessionToken();
  const sessionTokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('sessions')
    .insert({
      user_id: userId,
      session_token_hash: sessionTokenHash,
      status: 'ACTIVE',
      expires_at: expiresAt,
      ip_address: meta?.ipAddress ?? null,
      user_agent: meta?.userAgent ?? null,
    })
    .select('session_id')
    .single();

  if (error) throw error;

  await insertAuthLog({
    userId,
    sessionId: data.session_id,
    eventType: 'LOGIN_SUCCESS',
    meta,
  });

  return { token, sessionId: data.session_id };
}

async function resolveSessionFromTokenFallback(
  admin: ReturnType<typeof createAdminClient>,
  tokenHash: string
): Promise<ResolvedSession | null> {
  const { data: sessionRow, error } = await admin
    .from('sessions')
    .select('session_id, user_id, status, expires_at, last_activity_at, created_at')
    .eq('session_token_hash', tokenHash)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString())
    .gt('created_at', new Date(Date.now() - SESSION_ABSOLUTE_LIFETIME_MS).toISOString())
    .maybeSingle();

  if (error) throw error;
  if (!sessionRow) return null;
  if (isExpiredSessionRow(sessionRow)) return null;
  if (isBeyondAbsoluteLifetime(sessionRow)) return null;

  const { data: userRow, error: userError } = await admin
    .from('users')
    .select('user_id, email, username, full_name, phone, status')
    .eq('user_id', sessionRow.user_id)
    .maybeSingle();

  if (userError) throw userError;
  if (!userRow || userRow.status === 'DELETED') return null;

  const roles = await getRolesForUser(sessionRow.user_id);

  return {
    sessionId: sessionRow.session_id,
    userId: sessionRow.user_id,
    lastActivityAt: sessionRow.last_activity_at,
    user: {
      id: userRow.user_id,
      email: userRow.email,
      username: userRow.username,
      fullName: userRow.full_name ?? null,
      phone: userRow.phone ?? null,
      status: userRow.status,
    },
    roles,
    isAdmin: roles.includes('ADMIN'),
  };
}

export async function resolveSessionFromToken(token: string): Promise<ResolvedSession | null> {
  const admin = createAdminClient();
  const tokenHash = hashSessionToken(token);

  const { data: sessionRow, error } = await admin
    .rpc('resolve_session', { p_token_hash: tokenHash } satisfies ResolveSessionArgs)
    .maybeSingle();

  if (error) {
    if (!warnedAboutSessionRpc) {
      warnedAboutSessionRpc = true;
      console.warn('Session RPC unavailable; falling back to multi-query session lookup.', error);
    }
    return resolveSessionFromTokenFallback(admin, tokenHash);
  }

  if (!sessionRow) return null;
  if (isExpiredSessionRow(sessionRow as any)) return null;
  if (isBeyondAbsoluteLifetime(sessionRow as any)) return null;

  return mapResolvedSessionRow(sessionRow);
}

export function shouldTouchSession(lastActivityAt: string | null | undefined, now = Date.now()) {
  if (!lastActivityAt) return true;
  const lastActivityTime = new Date(lastActivityAt).getTime();
  return !Number.isFinite(lastActivityTime) || now - lastActivityTime > SESSION_TOUCH_THROTTLE_MS;
}

export async function touchSession(sessionId: string, timeoutMinutes = USER_SESSION_TIMEOUT_MINUTES) {
  const admin = createAdminClient();
  const now = Date.now();
  const touchedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + timeoutMinutes * 60 * 1000).toISOString();
  const touchThreshold = new Date(now - SESSION_TOUCH_THROTTLE_MS).toISOString();

  const { error } = await admin
    .from('sessions')
    .update({
      last_activity_at: touchedAt,
      expires_at: expiresAt,
    })
    .eq('session_id', sessionId)
    .eq('status', 'ACTIVE')
    .lt('last_activity_at', touchThreshold);

  if (error) throw error;
}

export async function logoutSession(token: string, meta?: RequestMeta) {
  const admin = createAdminClient();
  const tokenHash = hashSessionToken(token);

  const { data: existing, error: selectError } = await admin
    .from('sessions')
    .select('session_id, user_id, status')
    .eq('session_token_hash', tokenHash)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!existing) return;

  const { error } = await admin
    .from('sessions')
    .update({
      status: existing.status === 'ACTIVE' ? 'LOGGED_OUT' : existing.status,
      ended_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq('session_id', existing.session_id);

  if (error) throw error;

  await insertAuthLog({
    userId: existing.user_id,
    sessionId: existing.session_id,
    eventType: 'LOGOUT',
    meta,
  });
}

function safeHeader(value: string | null, maxLength = 240) {
  return value?.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength) || null;
}

export function getRequestMeta(request: Request, clientIp?: string | null) {
  return {
    ipAddress: trustedIpFromHeaders(request.headers) ?? safeHeader(clientIp ?? null, 64),
    userAgent: safeHeader(request.headers.get('user-agent'), 240),
  } satisfies RequestMeta;
}

export function assertStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export function safeUsernameFromEmail(email: string) {
  return normalizeEmail(email).split('@')[0].replace(/[^a-z0-9_-]/g, '-').slice(0, 40) || 'user';
}
