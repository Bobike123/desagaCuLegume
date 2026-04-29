import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, SESSION_TIMEOUT_MINUTES, createAdminClient } from '$lib/server/supabase';

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
  user: SessionUser;
  roles: string[];
  isAdmin: boolean;
};

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const existing = Buffer.from(hash, 'hex');

  if (candidate.length !== existing.length) return false;
  return timingSafeEqual(candidate, existing);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  };
}

export function setSessionCookie(cookies: Cookies, token: string, timeoutMinutes = SESSION_TIMEOUT_MINUTES) {
  cookies.set(SESSION_COOKIE_NAME, token, cookieOptions(timeoutMinutes * 60));
}

export function clearSessionCookie(cookies: Cookies) {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
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
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (result.error) throw result.error;
  if (result.data) return result.data;

  result = await admin
    .from('users')
    .select('*')
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

export async function createSession(userId: number, meta?: RequestMeta) {
  const admin = createAdminClient();
  const token = createSessionToken();
  const sessionTokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString();

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
    eventType: 'LOGIN',
    meta,
  });

  return { token, sessionId: data.session_id };
}

export async function resolveSessionFromToken(token: string): Promise<ResolvedSession | null> {
  const admin = createAdminClient();
  const tokenHash = hashSessionToken(token);

  const { data: sessionRow, error } = await admin
    .from('sessions')
    .select('session_id, user_id, status, expires_at')
    .eq('session_token_hash', tokenHash)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error) throw error;
  if (!sessionRow) return null;

  const isExpired = new Date(sessionRow.expires_at).getTime() <= Date.now();
  if (isExpired) {
    await admin
      .from('sessions')
      .update({
        status: 'TIMED_OUT',
        ended_at: new Date().toISOString(),
      })
      .eq('session_id', sessionRow.session_id);

    await insertAuthLog({
      userId: sessionRow.user_id,
      sessionId: sessionRow.session_id,
      eventType: 'SESSION_TIMEOUT',
      details: { reason: 'idle timeout' },
    });

    return null;
  }

  const { data: userRow, error: userError } = await admin
    .from('users')
    .select('*')
    .eq('user_id', sessionRow.user_id)
    .maybeSingle();

  if (userError) throw userError;
  if (!userRow || userRow.status === 'DELETED') return null;

  const roles = await getRolesForUser(sessionRow.user_id);

  return {
    sessionId: sessionRow.session_id,
    userId: sessionRow.user_id,
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

export async function touchSession(sessionId: string) {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString();

  const { error } = await admin
    .from('sessions')
    .update({
      last_activity_at: new Date().toISOString(),
      expires_at: expiresAt,
    })
    .eq('session_id', sessionId)
    .eq('status', 'ACTIVE');

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

export function getRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: request.headers.get('user-agent'),
  } satisfies RequestMeta;
}

export function assertStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export function safeUsernameFromEmail(email: string) {
  return normalizeEmail(email).split('@')[0].replace(/[^a-z0-9_-]/g, '-').slice(0, 40) || 'user';
}

