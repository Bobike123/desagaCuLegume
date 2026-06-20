import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import { noStoreHeaders } from '$lib/server/pagination';
import { getSecurityStatsForDashboard } from '$lib/server/security-events';

async function getExactCount(promise: PromiseLike<{ count: number | null; error: any }>) {
  const { count, error } = await promise;
  if (error) throw error;
  return count ?? 0;
}

export async function GET({ locals, setHeaders }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const [
      products,
      orders,
      conversations,
      unreadMessages,
      horecaRequests,
      newHorecaRequests,
      securityStats,
    ] =
      await Promise.all([
        getExactCount(
          admin.from('products').select('product_id', { count: 'exact', head: true }).is('deleted_at', null)
        ),
        getExactCount(admin.from('orders').select('order_id', { count: 'exact', head: true })),
        getExactCount(admin.from('support_conversations').select('conversation_id', { count: 'exact', head: true })),
        getExactCount(
          admin
            .from('support_messages')
            .select('message_id', { count: 'exact', head: true })
            .eq('sender_type', 'USER')
            .eq('is_read', false)
        ),
        getExactCount(admin.from('horeca_requests').select('request_id', { count: 'exact', head: true })),
        getExactCount(
          admin
            .from('horeca_requests')
            .select('request_id', { count: 'exact', head: true })
            .eq('status', 'NEW')
        ),
        getSecurityStatsForDashboard(),
      ]);

    setHeaders(noStoreHeaders);
    return json({
      products,
      orders,
      messages: conversations,
      unreadMessages,
      horecaRequests,
      newHorecaRequests,
      securityUnread: securityStats.unreadCount,
      securityDecoyHits24h: securityStats.decoyHits24h,
      securityRateLimits24h: securityStats.rateLimitEvents24h,
      failedLogins24h: securityStats.failedLogins24h,
    });
  } catch (error) {
    console.error('Admin stats failed', error);
    return json({ error: 'Nu am putut încărca statisticile.' }, { status: 400 });
  }
}
