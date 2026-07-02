import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

// Public liveness probe for uptime monitors (exposes nothing; covered by the
// api-read rate limiter). `?deep=1` additionally pings the database and stays
// admin-only.
export async function GET({ locals, url, setHeaders }) {
  setHeaders({ 'Cache-Control': 'no-store' });

  if (url.searchParams.get('deep') === '1') {
    if (!locals.isAdmin) {
      return json({ error: 'Acces neautorizat.' }, { status: 401 });
    }

    const { error } = await createAdminClient()
      .from('roles')
      .select('role_id', { count: 'exact', head: true });

    if (error) {
      return json({ ok: false, db: false }, { status: 503 });
    }

    return json({ ok: true, db: true });
  }

  return json({ ok: true });
}
