import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';
import {
  LIMITS,
  optionalEnumField,
  readJsonBody,
  requireNumericId,
  validationErrorResponse,
} from '$lib/server/validation';

const ORDER_STATUSES = [
  'PENDING',
  'PLACED',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const;
const PAYMENT_STATUSES = [
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CANCELLED',
] as const;
const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED'] as const;

function mapOrderItem(row: any) {
  return {
    productId: String(row.product_id),
    sku: row.sku,
    productName: row.product_name,
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    lineTotal: Number(row.line_total ?? 0),
    currency: row.currency_code ?? 'RON',
  };
}

function mapOrder(row: any) {
  const payments = Array.isArray(row.payments) ? row.payments : [];
  const payment = payments[0] ?? null;
  let deliveryMethod: 'pickup' | 'delivery' = 'pickup';

  if (payment?.provider_payload) {
    const payload = typeof payment.provider_payload === 'string' ? JSON.parse(payment.provider_payload) : payment.provider_payload;
    deliveryMethod = String(payload?.deliveryMethod ?? payload?.delivery_method ?? 'pickup') === 'delivery' ? 'delivery' : 'pickup';
  }

  return {
    id: String(row.order_id),
    orderNumber: row.order_number,
    userId: row.user_id != null ? String(row.user_id) : null,
    customerFullName: row.customer_full_name,
    customerEmail: row.customer_email,
    total: Number(row.total_amount ?? 0),
    subtotalAmount: Number(row.subtotal_amount ?? 0),
    shippingAmount: Number(row.shipping_amount ?? 0),
    currency: row.currency_code ?? 'RON',
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    deliveryMethod,
    items: Array.isArray(row.order_items) ? row.order_items.map(mapOrderItem) : [],
    createdAt: row.created_at,
    placedAt: row.placed_at,
  };
}

export async function GET({ locals, params }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const orderId = requireNumericId(params.id, 'ID comandă');
    const admin = createAdminClient();
    let query = admin
      .from('orders')
      .select(
        `order_id, order_number, user_id, customer_full_name, customer_email, total_amount, subtotal_amount, shipping_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at, order_items(product_id, sku, product_name, quantity, unit_price, line_total, currency_code), payments(provider_payload)`
      )
      .eq('order_id', orderId)
      .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return json({ error: 'Comanda nu a fost găsită.' }, { status: 404 });

    if (!locals.isAdmin && data.user_id !== locals.user.id) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    let orderItems = Array.isArray(data.order_items) ? data.order_items : [];
    let payments = Array.isArray(data.payments) ? data.payments : [];

    if (!Array.isArray(data.order_items)) {
      const { data: itemsData, error: itemsError } = await admin
        .from('order_items')
        .select('product_id, sku, product_name, quantity, unit_price, line_total, currency_code')
        .eq('order_id', orderId);
      if (itemsError) throw itemsError;
      orderItems = Array.isArray(itemsData) ? itemsData : [];
    }

    if (!Array.isArray(data.payments)) {
      const { data: paymentData, error: paymentError } = await admin
        .from('payments')
        .select('provider_payload')
        .eq('order_id', orderId);
      if (paymentError) throw paymentError;
      payments = Array.isArray(paymentData) ? paymentData : [];
    }

    return json({ item: mapOrder({ ...data, order_items: orderItems, payments }) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to load order';
    return json({ error: message }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orderId = requireNumericId(params.id, 'ID comandă');
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const payload: Record<string, unknown> = {};
    const now = new Date().toISOString();
    const orderStatus = optionalEnumField(body, 'status', ORDER_STATUSES);
    const paymentStatus = optionalEnumField(body, 'paymentStatus', PAYMENT_STATUSES);
    const fulfillmentStatus = optionalEnumField(body, 'fulfillmentStatus', FULFILLMENT_STATUSES);

    if (orderStatus) {
      payload.status = orderStatus;
      if (orderStatus === 'SHIPPED') payload.shipped_at = now;
      if (orderStatus === 'DELIVERED') payload.delivered_at = now;
      if (orderStatus === 'CANCELLED') payload.cancelled_at = now;
      if (orderStatus === 'PAID') payload.paid_at = now;
    }

    if (paymentStatus) payload.payment_status = paymentStatus;
    if (fulfillmentStatus) payload.fulfillment_status = fulfillmentStatus;

    const admin = createAdminClient();
    const { error } = await admin.from('orders').update(payload).eq('order_id', orderId);
    if (error) throw error;

    const { data, error: fetchError } = await admin
      .from('orders')
      .select('order_id, order_number, user_id, customer_full_name, customer_email, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at')
      .eq('order_id', orderId)
      .single();

    if (fetchError) throw fetchError;
    return json({ item: mapOrder(data) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const message = error instanceof Error ? error.message : 'Failed to update order';
    return json({ error: message }, { status: 400 });
  }
}
