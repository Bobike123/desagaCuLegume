import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { getRequestMeta, safeClientAddress } from '$lib/server/auth';
import { subscribeEmail } from '$lib/server/newsletter/subscribers';
import { LIMITS, readJsonBody, stringField, validationErrorResponse } from '$lib/server/validation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(event: RequestEvent) {
  try {
    const body = await readJsonBody(event.request, { maxBytes: LIMITS.tinyJson });
    const email = stringField(body, 'email', {
      required: true,
      max: 120,
      pattern: EMAIL_PATTERN,
      fieldLabel: 'Emailul',
    });

    const meta = getRequestMeta(event.request, safeClientAddress(() => event.getClientAddress()));
    await subscribeEmail({
      email,
      userId: event.locals.user?.id ?? null,
      source: 'FOOTER',
      ip: meta.ipAddress,
    });

    return json({ success: true }, { status: 200 });
  } catch (error) {
    const validation = validationErrorResponse(error);
    if (validation) return validation;

    const requestId = logRouteError('Newsletter subscribe failed', error);
    return json({ error: 'Abonarea a eșuat. Încearcă din nou.', requestId }, { status: 400 });
  }
}
