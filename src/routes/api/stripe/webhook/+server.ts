import { json } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { logRouteError } from '$lib/server/log';
import {
  getStripeClient,
  getStripeWebhookSecret,
  recordStripeSessionOutcome,
} from '$lib/server/stripe';

const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
]);

export async function POST({ request }) {
  const secret = getStripeWebhookSecret();
  if (!secret) {
    return json({ error: 'Webhook-ul Stripe nu este configurat.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return json({ error: 'Semnătura Stripe lipsește.' }, { status: 400 });
  }

  // Signature verification needs the raw body exactly as Stripe sent it.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripeClient().webhooks.constructEventAsync(payload, signature, secret);
  } catch (error) {
    logRouteError('Stripe webhook signature verification failed', error);
    return json({ error: 'Semnătura Stripe este invalidă.' }, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return json({ received: true, ignored: event.type });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const outcome = await recordStripeSessionOutcome(session);
    return json({ received: true, outcome });
  } catch (error) {
    // Non-2xx makes Stripe retry the event, which recordStripeSessionOutcome
    // tolerates because it is idempotent.
    const requestId = logRouteError('Stripe webhook processing failed', error);
    return json({ error: 'Procesarea evenimentului a eșuat.', requestId }, { status: 500 });
  }
}
