import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import type { UpdateOrderAdminArgs } from '$lib/server/rpc-contracts';
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
  const deliveryMethod: 'pickup' | 'delivery' =
    String(row.delivery_method ?? 'pickup') === 'delivery' ? 'delivery' : 'pickup';

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
    const { data, error } = await admin
      .from('orders')
      .select(
        `order_id, order_number, user_id, customer_full_name, customer_email, total_amount, subtotal_amount, shipping_amount, currency_code, status, payment_status, fulfillment_status, delivery_method, created_at, placed_at, order_items(product_id, sku, product_name, quantity, unit_price, line_total, currency_code)`
      )
      .eq('order_id', orderId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Comanda nu a fost găsită.' }, { status: 404 });

    if (!locals.isAdmin && data.user_id !== locals.user.id) {
      return json({ error: 'Acces neautorizat.' }, { status: 403 });
    }

    let orderItems = Array.isArray(data.order_items) ? data.order_items : [];

    if (!Array.isArray(data.order_items)) {
      const { data: itemsData, error: itemsError } = await admin
        .from('order_items')
        .select('product_id, sku, product_name, quantity, unit_price, line_total, currency_code')
        .eq('order_id', orderId);
      if (itemsError) throw itemsError;
      orderItems = Array.isArray(itemsData) ? itemsData : [];
    }

    return json({ item: mapOrder({ ...data, order_items: orderItems }) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Order load failed', error);
    return json({ error: 'Nu am putut încărca comanda.', requestId }, { status: 400 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const orderId = requireNumericId(params.id, 'ID comandă');
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const orderStatus = optionalEnumField(body, 'status', ORDER_STATUSES);
    const paymentStatus = optionalEnumField(body, 'paymentStatus', PAYMENT_STATUSES);
    const fulfillmentStatus = optionalEnumField(body, 'fulfillmentStatus', FULFILLMENT_STATUSES);

    const admin = createAdminClient();
    const { data, error } = await admin
      .rpc('update_order_admin', {
        p_order_id: Number(orderId),
        p_admin_user_id: locals.user?.id ?? null,
        p_status: orderStatus ?? null,
        p_payment_status: paymentStatus ?? null,
        p_fulfillment_status: fulfillmentStatus ?? null,
        p_note: 'Actualizare din panoul de comenzi admin',
      } satisfies UpdateOrderAdminArgs)
      .single();

    if (error) {
      if (error.code === 'P0002') return json({ error: 'Comanda nu a fost găsită.' }, { status: 404 });
      if (error.code === 'P0003') {
        return json({ error: 'Tranziție de status invalidă pentru comandă.' }, { status: 409 });
      }
      throw new Error(
        `Order update transaction failed: ${error.message}. Run the provided update_order_admin SQL function before production use.`
      );
    }

    return json({ item: mapOrder(data) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Order update failed', error);
    return json({ error: 'Nu am putut actualiza comanda.', requestId }, { status: 400 });
  }
}
