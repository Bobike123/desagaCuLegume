import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { logRouteError } from '$lib/server/log';
import { unsubscribeByToken } from '$lib/server/newsletter/subscribers';

// RFC 8058 one-click unsubscribe target (List-Unsubscribe-Post). Mail
// providers POST here directly on the user's behalf; hooks.server.ts exempts
// this exact path from the same-origin and JSON content-type checks.
export async function POST(event: RequestEvent) {
  try {
    const token = event.url.searchParams.get('token') ?? '';
    await unsubscribeByToken(token);

    // Always 200 with a generic body: the response must not reveal whether
    // the token matched an active subscription.
    return json({ success: true }, { status: 200 });
  } catch (error) {
    const requestId = logRouteError('Newsletter one-click unsubscribe failed', error);
    return json({ error: 'Dezabonarea a eșuat.', requestId }, { status: 500 });
  }
}
