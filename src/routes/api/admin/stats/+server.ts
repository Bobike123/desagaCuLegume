import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { noStoreHeaders } from '$lib/server/pagination';
import type { AdminDashboardStatsRow } from '$lib/server/rpc-contracts';

export async function GET({ locals, setHeaders }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    // Single RPC (admin_dashboard_stats, 20260711_08) instead of 6+ separate
    // count:'exact' queries per dashboard load.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('admin_dashboard_stats').single();
    if (error) throw error;

    const stats = data as AdminDashboardStatsRow;

    setHeaders(noStoreHeaders);
    return json({
      products: Number(stats.products ?? 0),
      orders: Number(stats.orders ?? 0),
      messages: Number(stats.conversations ?? 0),
      unreadMessages: Number(stats.unread_messages ?? 0),
      horecaRequests: Number(stats.horeca_requests ?? 0),
      newHorecaRequests: Number(stats.new_horeca_requests ?? 0),
      securityUnread: Number(stats.security_unread ?? 0),
      securityDecoyHits24h: Number(stats.security_decoy_hits_24h ?? 0),
      securityRateLimits24h: Number(stats.security_rate_limits_24h ?? 0),
      failedLogins24h: Number(stats.failed_logins_24h ?? 0),
    });
  } catch (error) {
    const requestId = logRouteError('Admin stats failed', error);
    return json({ error: 'Nu am putut încărca statisticile.', requestId }, { status: 400 });
  }
}
