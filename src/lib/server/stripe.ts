import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { createAdminClient } from '$lib/server/supabase';

// Dynamic env (not $env/static/private): the app must keep building and serving
// cash-on-delivery checkouts even when Stripe keys are absent.
export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY?.trim());
}

let cachedClient: Stripe | null = null;

export function getStripeClient() {
  if (cachedClient) return cachedClient;

  const key = String(env.STRIPE_SECRET_KEY ?? '').trim();
  if (!key) {
    throw new Error('Variabila de mediu STRIPE_SECRET_KEY lipsește.');
  }

  cachedClient = new Stripe(key, { timeout: 15_000 });
  return cachedClient;
}

export function getStripeWebhookSecret() {
  const secret = String(env.STRIPE_WEBHOOK_SECRET ?? '').trim();
  return secret || null;
}

type CardOrder = {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currencyCode: string;
  email: string | null;
};

// Stripe expects the amount in the currency's smallest unit (bani for RON).
function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

export async function createCardPaymentSession(order: CardOrder, origin: string) {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currencyCode.toLowerCase(),
          unit_amount: toMinorUnits(order.totalAmount),
          product_data: {
            name: `Comanda ${order.orderNumber} — Desaga cu Legume`,
          },
        },
      },
    ],
    customer_email: order.email || undefined,
    metadata: {
      order_id: order.orderId,
      order_number: order.orderNumber,
    },
    success_url: `${origin}/cos?payment=success&order=${encodeURIComponent(order.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cos?payment=cancelled&order=${encodeURIComponent(order.orderNumber)}`,
  });

  // The pending payments row was created by place_order; attach the Stripe
  // session so the webhook/confirm flow can find it by transaction_reference.
  const admin = createAdminClient();
  const { error } = await admin
    .from('payments')
    .update({
      transaction_reference: session.id,
      provider_name: 'STRIPE',
      provider_payload: {
        provider: 'stripe',
        sessionId: session.id,
        mode: 'checkout_session',
      },
    })
    .eq('order_id', Number(order.orderId));

  if (error) {
    throw new Error(`Nu am putut asocia sesiunea Stripe comenzii: ${error.message}`);
  }

  return session;
}

export type StripeSessionOutcome = 'paid' | 'failed' | 'pending' | 'not_found' | 'already_recorded';

// Shared by the webhook and the success-redirect confirm endpoint; idempotent,
// so it is safe when both fire for the same session.
export async function recordStripeSessionOutcome(
  session: Stripe.Checkout.Session
): Promise<StripeSessionOutcome> {
  const admin = createAdminClient();

  const existing = await admin
    .from('payments')
    .select('payment_id, status')
    .eq('transaction_reference', session.id)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Nu am putut citi plata pentru sesiunea Stripe: ${existing.error.message}`);
  }
  if (!existing.data) return 'not_found';
  if (existing.data.status === 'PAID') return 'already_recorded';

  const paid = session.payment_status === 'paid';
  const expired = session.status === 'expired';
  if (!paid && !expired) return 'pending';

  const { error } = await admin
    .from('payments')
    .update({
      status: paid ? 'PAID' : 'FAILED',
      paid_at: paid ? new Date().toISOString() : null,
      provider_payload: {
        provider: 'stripe',
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null),
        paymentStatus: session.payment_status,
        sessionStatus: session.status,
        amountTotal: session.amount_total,
        currency: session.currency,
      },
    })
    .eq('payment_id', existing.data.payment_id)
    .neq('status', 'PAID');

  if (error) {
    throw new Error(`Nu am putut actualiza plata Stripe: ${error.message}`);
  }

  // The trg_sync_order_payment_status trigger propagates the new status to the
  // order row, so nothing else to update here.
  return paid ? 'paid' : 'failed';
}
