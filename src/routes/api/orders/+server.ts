import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

function mapOrder(row: any) {
  return {
    id: String(row.order_id),
    orderNumber: row.order_number,
    userId: row.user_id != null ? String(row.user_id) : null,
    customerFullName: row.customer_full_name,
    customerEmail: row.customer_email,
    total: Number(row.total_amount ?? 0),
    currency: row.currency_code ?? 'RON',
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    createdAt: row.created_at,
    placedAt: row.placed_at,
  };
}

export async function GET({ locals }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    let query = admin
      .from('orders')
      .select('order_id, order_number, user_id, customer_full_name, customer_email, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at')
      .order('created_at', { ascending: false });

    if (!locals.isAdmin) {
      query = query.eq('user_id', locals.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return json({ items: (data ?? []).map(mapOrder) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load orders';
    return json({ error: message }, { status: 400 });
  }
}

