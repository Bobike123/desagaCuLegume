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

export async function GET({ locals, params }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    let query = admin
      .from('orders')
      .select('order_id, order_number, user_id, customer_full_name, customer_email, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at')
      .eq('order_id', params.id)
      .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return json({ error: 'Comanda nu a fost găsită.' }, { status: 404 });

    if (!locals.isAdmin && data.user_id !== locals.user.id) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    return json({ item: mapOrder(data) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load order';
    return json({ error: message }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const payload: Record<string, unknown> = {};
  const now = new Date().toISOString();

  if (body.status) {
    payload.status = String(body.status);
    if (body.status === 'SHIPPED') payload.shipped_at = now;
    if (body.status === 'DELIVERED') payload.delivered_at = now;
    if (body.status === 'CANCELLED') payload.cancelled_at = now;
    if (body.status === 'PAID') payload.paid_at = now;
  }

  if (body.paymentStatus) payload.payment_status = String(body.paymentStatus);
  if (body.fulfillmentStatus) payload.fulfillment_status = String(body.fulfillmentStatus);

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('orders').update(payload).eq('order_id', params.id);
    if (error) throw error;

    const { data, error: fetchError } = await admin
      .from('orders')
      .select('order_id, order_number, user_id, customer_full_name, customer_email, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at')
      .eq('order_id', params.id)
      .single();

    if (fetchError) throw fetchError;
    return json({ item: mapOrder(data) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    return json({ error: message }, { status: 400 });
  }
}

