import { json } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { getStripeClient, isStripeConfigured, recordStripeSessionOutcome } from '$lib/server/stripe';
import {
  LIMITS,
  readJsonBody,
  stringField,
  validationErrorResponse,
} from '$lib/server/validation';

// Fallback for environments without a configured webhook (e.g. local dev):
// the success redirect lands back on /cos, which posts the session id here.
// The outcome comes from Stripe's API, never from the client, and recording
// is idempotent, so replaying a session id is harmless.
export async function POST({ request }) {
  if (!isStripeConfigured()) {
    return json({ error: 'Plata cu cardul nu este disponibilă momentan.' }, { status: 503 });
  }

  try {
    const body = await readJsonBody(request, { maxBytes: LIMITS.tinyJson });
    const sessionId = stringField(body, 'sessionId', {
      max: 200,
      fieldLabel: 'Sesiunea de plată',
      pattern: /^cs_(test|live)_[A-Za-z0-9]+$/,
    });

    if (!sessionId) {
      return json({ error: 'Sesiunea de plată lipsește.' }, { status: 400 });
    }

    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    const outcome = await recordStripeSessionOutcome(session);

    if (outcome === 'not_found') {
      return json({ error: 'Nu am găsit comanda pentru această plată.' }, { status: 404 });
    }

    return json({
      status: outcome === 'already_recorded' ? 'paid' : outcome,
      orderNumber: session.metadata?.order_number ?? null,
    });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Stripe payment confirmation failed', error);
    return json({ error: 'Nu am putut verifica plata. Încearcă din nou.', requestId }, { status: 500 });
  }
}
