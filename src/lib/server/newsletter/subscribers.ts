import { createAdminClient } from '$lib/server/supabase';
import { normalizeEmail } from '$lib/server/auth';

export type SubscribeSource = 'REGISTER' | 'FOOTER' | 'ADMIN';

export type SubscribeInput = {
  email: string;
  userId?: number | null;
  source: SubscribeSource;
  ip?: string | null;
};

const UNIQUE_VIOLATION = '23505';

// Idempotent: one row per email forever. A re-subscribe after unsubscribe
// reactivates the existing row (fresh consent timestamp, stable token).
// Callers should report success either way, so the endpoint cannot be used
// to probe which emails are subscribed.
export async function subscribeEmail(input: SubscribeInput) {
  const admin = createAdminClient();
  const email = normalizeEmail(input.email);

  const inserted = await admin.from('newsletter_subscribers').insert({
    email,
    user_id: input.userId ?? null,
    source: input.source,
    consent_ip: input.ip ?? null,
  });

  if (!inserted.error) return;
  if (inserted.error.code !== UNIQUE_VIOLATION) throw inserted.error;

  const updated = await admin
    .from('newsletter_subscribers')
    .update({
      unsubscribed_at: null,
      consented_at: new Date().toISOString(),
      consent_ip: input.ip ?? null,
      source: input.source,
      ...(input.userId != null ? { user_id: input.userId } : {}),
    })
    .eq('email', email);

  if (updated.error) throw updated.error;
}

export async function unsubscribeByToken(token: string) {
  const clean = String(token ?? '').trim();
  if (!/^[a-f0-9]{48}$/i.test(clean)) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', clean)
    .is('unsubscribed_at', null)
    .select('subscriber_id');

  if (error) throw error;
  return (data ?? []).length > 0;
}
