import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { normalizeCartItems } from '$lib/server/cart-validation';
import { mapRpcError } from '$lib/server/checkout-errors';
import { createCardPaymentSession, isStripeConfigured } from '$lib/server/stripe';
import { createAdminClient } from '$lib/server/supabase';
import {
  arrayField,
  cleanString,
  enumField,
  LIMITS,
  nullableStringField,
  readJsonBody,
  RequestValidationError,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

type CheckoutRpcOrder = {
  order_id: number | string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_amount: number | string;
  currency_code: string;
  created_at: string;
};

const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Required: without a key, place_order skips all replay protection and a
// retried POST creates a duplicate order. The client always sends one.
function requireIdempotencyKey(value: unknown) {
  const key = cleanString(value);
  if (!key) {
    throw new RequestValidationError('Cheia de idempotency este obligatorie.');
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new RequestValidationError('Cheia de idempotency este invalidă.');
  }
  return key.toLowerCase();
}

function checkoutErrorResponse(error: unknown) {
  const match = mapRpcError(error);
  if (match) return json({ error: match.error }, { status: match.status });

  const requestId = logRouteError('Checkout RPC failed', error);
  return json({ error: 'Nu am putut finaliza comanda. Încearcă din nou.', requestId }, { status: 500 });
}

export async function POST({ locals, request, url }) {
  if (locals.isAdmin) {
    return json({ error: 'Adminii nu pot face comenzi.' }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.largeJson });
    const items = normalizeCartItems(arrayField(body, 'items', 100));

    if (items.length === 0) {
      return json({ error: 'Coșul este gol.' }, { status: 400 });
    }

    const fullName =
      stringField(body, 'fullName', { max: 120, fieldLabel: 'Numele complet' }) ||
      (locals.user?.fullName ?? '');
    const phone =
      stringField(body, 'phone', { max: 30, fieldLabel: 'Telefonul' }) ||
      (locals.user?.phone ?? '');
    const email =
      stringField(body, 'email', {
        max: 255,
        fieldLabel: 'Emailul',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      }) ||
      (locals.user?.email ?? '');
    const deliveryMethod = enumField(body, 'deliveryMethod', ['PICKUP', 'DELIVERY'], 'PICKUP').toLowerCase() as
      | 'pickup'
      | 'delivery';
    const customerMessage = stringField(body, 'customerMessage', {
      max: LIMITS.message,
      fieldLabel: 'Mesajul',
    });
    const paymentMethod = enumField(body, 'paymentMethod', ['CASH_ON_DELIVERY', 'CARD'], 'CASH_ON_DELIVERY');

    if (paymentMethod === 'CARD' && !isStripeConfigured()) {
      return json({ error: 'Plata cu cardul nu este disponibilă momentan.' }, { status: 503 });
    }

    if (!fullName) {
      return json({ error: 'Numele complet este obligatoriu.' }, { status: 400 });
    }

    if (!phone) {
      return json({ error: 'Telefonul este obligatoriu.' }, { status: 400 });
    }

    const addressLine1 = stringField(body, 'addressLine1', { max: 180, fieldLabel: 'Adresa' });
    const addressLine2 = nullableStringField(body, 'addressLine2', { max: 180, fieldLabel: 'Detalii adresă' });
    const city = stringField(body, 'city', { max: 90, fieldLabel: 'Orașul' });
    const stateRegion = stringField(body, 'stateRegion', { max: 90, fieldLabel: 'Județul' });
    const postalCode = stringField(body, 'postalCode', { max: 20, fieldLabel: 'Codul poștal' });
    const countryCode = stringField(body, 'countryCode', {
      max: 2,
      defaultValue: 'RO',
      fieldLabel: 'Țara',
      pattern: /^[A-Z]{2}$/i,
    }).toUpperCase();

    if (deliveryMethod === 'delivery' && (!addressLine1 || !city || !postalCode)) {
      return json({ error: 'Adresa de livrare este incompletă.' }, { status: 400 });
    }

    const idempotencyKey = requireIdempotencyKey(body.idempotencyKey ?? request.headers.get('idempotency-key'));
    const admin = createAdminClient();
    const orderResult = await admin
      .rpc('place_order', {
        p_user_id: locals.user?.id ?? null,
        p_items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
        })),
        p_full_name: fullName,
        p_phone: phone,
        p_email: email || null,
        p_delivery_method: deliveryMethod,
        p_payment_method: paymentMethod,
        p_address_line1: addressLine1 || null,
        p_address_line2: addressLine2,
        p_city: city || null,
        p_state_region: stateRegion || null,
        p_postal_code: postalCode || null,
        p_country_code: countryCode,
        p_customer_message: customerMessage || null,
        p_idempotency_key: idempotencyKey,
      })
      .single();

    if (orderResult.error) {
      return checkoutErrorResponse(orderResult.error);
    }

    if (!orderResult.data) {
      return checkoutErrorResponse(new Error('Checkout returned no order.'));
    }

    const order = orderResult.data as CheckoutRpcOrder;

    let paymentUrl: string | null = null;
    if (paymentMethod === 'CARD') {
      try {
        const session = await createCardPaymentSession(
          {
            orderId: String(order.order_id),
            orderNumber: order.order_number,
            totalAmount: Number(order.total_amount),
            currencyCode: order.currency_code,
            email: email || null,
          },
          url.origin
        );
        paymentUrl = session.url;
      } catch (error) {
        // The order already exists (unpaid); surface that instead of a generic
        // failure so the customer does not retry and duplicate it.
        const requestId = logRouteError('Stripe session creation failed', error);
        return json(
          {
            error: `Comanda ${order.order_number} a fost înregistrată, dar plata cu cardul nu a putut fi inițiată. Te vom contacta pentru confirmare.`,
            requestId,
          },
          { status: 502 }
        );
      }
    }

    return json(
      {
        success: true,
        order: {
          id: String(order.order_id),
          orderNumber: order.order_number,
          status: order.status,
          paymentStatus: order.payment_status,
          fulfillmentStatus: order.fulfillment_status,
          total: Number(order.total_amount),
          currency: order.currency_code,
          createdAt: order.created_at,
        },
        payment: paymentUrl ? { provider: 'stripe', url: paymentUrl } : null,
      },
      { status: 201 }
    );
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    return checkoutErrorResponse(error);
  }
}
