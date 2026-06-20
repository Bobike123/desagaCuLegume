import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '$lib/server/env';

export const SESSION_COOKIE_NAME = 'desaga_session';
export const USER_SESSION_TIMEOUT_MINUTES = 30;
export const ADMIN_SESSION_TIMEOUT_MINUTES = 60 * 8;

export function createAdminClient() {
  const env = getServerEnv();

  return createClient(env.publicSupabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
