import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

type ServerEnv = {
  publicSupabaseUrl: string;
  publicSupabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};

let cachedEnv: ServerEnv | null = null;

function assertPresent(name: string, value: string | undefined) {
  const clean = String(value ?? '').trim();
  if (!clean) {
    throw new Error(`Variabila de mediu ${name} lipsește.`);
  }

  if (/^(your-|change-me|replace-me|placeholder)/i.test(clean)) {
    throw new Error(`Variabila de mediu ${name} conține o valoare placeholder.`);
  }

  return clean;
}

function assertUrl(name: string, value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Protocol invalid');
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Variabila de mediu ${name} trebuie să fie un URL valid.`);
  }
}

export function getServerEnv() {
  if (cachedEnv) return cachedEnv;

  const publicSupabaseUrl = assertUrl(
    'PUBLIC_SUPABASE_URL',
    assertPresent('PUBLIC_SUPABASE_URL', PUBLIC_SUPABASE_URL)
  );
  const publicSupabaseAnonKey = assertPresent('PUBLIC_SUPABASE_ANON_KEY', PUBLIC_SUPABASE_ANON_KEY);
  const supabaseServiceRoleKey = assertPresent('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

  if (supabaseServiceRoleKey === publicSupabaseAnonKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nu poate fi identică cu PUBLIC_SUPABASE_ANON_KEY.');
  }

  cachedEnv = {
    publicSupabaseUrl,
    publicSupabaseAnonKey,
    supabaseServiceRoleKey,
  };

  return cachedEnv;
}
