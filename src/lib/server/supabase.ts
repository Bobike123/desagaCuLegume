import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '$lib/server/env';

export const SESSION_COOKIE_NAME = 'desaga_session';
export const USER_SESSION_TIMEOUT_MINUTES = 30;
export const ADMIN_SESSION_TIMEOUT_MINUTES = 60 * 8;

const DEFAULT_FETCH_TIMEOUT_MS = 8000;

function fetchTimeoutMs() {
  const raw = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? DEFAULT_FETCH_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_FETCH_TIMEOUT_MS;
  return Math.min(raw, 60_000);
}

// Every Supabase call gets a hard timeout; without it a hung PostgREST call
// blocks the serverless invocation until the platform kills it.
const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(fetchTimeoutMs());
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
  return fetch(input, { ...init, signal });
};

let cachedClient: SupabaseClient | null = null;

// Module-scope singleton: routes call this 60+ times (often several times per
// request); the client is stateless here (no session persistence), so one
// instance per process is enough.
export function createAdminClient() {
  if (cachedClient) return cachedClient;

  const env = getServerEnv();

  cachedClient = createClient(env.publicSupabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  });

  return cachedClient;
}
