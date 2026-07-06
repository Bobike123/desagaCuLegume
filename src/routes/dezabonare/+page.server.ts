import type { Actions, PageServerLoad } from './$types';
import { logRouteError } from '$lib/server/log';
import { unsubscribeByToken } from '$lib/server/newsletter/subscribers';

// GET only shows a confirmation form — mail clients and link scanners
// prefetch GET links, so the actual unsubscribe happens in the POST action.
export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';
  return { hasToken: token.trim().length > 0 };
};

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      const form = await request.formData();
      const token = String(form.get('token') ?? '');
      await unsubscribeByToken(token);
    } catch (error) {
      logRouteError('Newsletter unsubscribe action failed', error);
    }

    // Generic outcome either way — no subscription-status enumeration.
    return { done: true };
  },
};
