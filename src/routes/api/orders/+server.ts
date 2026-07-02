import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { createAdminClient } from '$lib/server/supabase';
import { getPagination, getPaginationMeta, noStoreHeaders } from '$lib/server/pagination';
import { mapOrder } from '$lib/server/support';
import { optionalEnumField, stringField, validationErrorResponse } from '$lib/server/validation';

const ORDER_STATUSES = ['PENDING', 'PLACED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'] as const;
const PAYMENT_STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED'] as const;
const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED'] as const;

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`).replace(/,/g, '\\,');
}

export async function GET({ locals, url, setHeaders }) {
  if (!locals.isAuthenticated || !locals.user) {
    return json({ error: 'Autentificarea este necesară.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const pagination = getPagination(url, { defaultLimit: 50, maxLimit: 100 });
    const search = stringField({ q: url.searchParams.get('q') }, 'q', {
      max: 120,
      fieldLabel: 'Căutarea',
    });
    const status = optionalEnumField({ status: url.searchParams.get('status') }, 'status', ORDER_STATUSES);
    const paymentStatus = optionalEnumField({ paymentStatus: url.searchParams.get('paymentStatus') }, 'paymentStatus', PAYMENT_STATUSES);
    const fulfillmentStatus = optionalEnumField({ fulfillmentStatus: url.searchParams.get('fulfillmentStatus') }, 'fulfillmentStatus', FULFILLMENT_STATUSES);

    let query = admin
      .from('orders')
      .select('order_id, order_number, user_id, customer_full_name, customer_email, customer_phone, total_amount, currency_code, status, payment_status, fulfillment_status, created_at, placed_at', {
        count: 'exact',
      });

    if (!locals.isAdmin) {
      query = query.eq('user_id', locals.user.id);
    }
    if (status) query = query.eq('status', status);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);
    if (fulfillmentStatus) query = query.eq('fulfillment_status', fulfillmentStatus);
    if (search) {
      const escaped = escapeIlike(search);
      query = query.or(
        `order_number.ilike.%${escaped}%,customer_email.ilike.%${escaped}%,customer_full_name.ilike.%${escaped}%,customer_phone.ilike.%${escaped}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.to);
    if (error) throw error;

    setHeaders(noStoreHeaders);
    return json({ items: (data ?? []).map(mapOrder), page: getPaginationMeta(pagination, count ?? 0) }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Orders load failed', error);
    return json({ error: 'Nu am putut încărca comenzile.', requestId }, { status: 400 });
  }
}
