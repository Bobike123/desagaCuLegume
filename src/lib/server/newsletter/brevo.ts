import { getNewsletterEnv } from '$lib/server/newsletter/env';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const FETCH_TIMEOUT_MS = 8000;

export const MAX_SEND_ATTEMPTS = 3;

export type SendEmailInput = {
  to: string;
  subject: string;
  htmlContent: string;
  headers?: Record<string, string>;
};

export type SendEmailResult =
  | { ok: true; messageId: string | null }
  // permanent: the recipient/payload is rejected (4xx) — do not retry.
  // retryable: transient failure (5xx, network, timeout) — retry next run.
  | { ok: false; permanent: boolean; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getNewsletterEnv();

  let response: Response;
  try {
    response = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        'api-key': env.brevoApiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: env.fromName, email: env.fromEmail },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.htmlContent,
        ...(input.headers ? { headers: input.headers } : {}),
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    return { ok: false, permanent: false, error: error instanceof Error ? error.message : 'Network error' };
  }

  if (response.ok) {
    const payload = await response.json().catch(() => null);
    return { ok: true, messageId: payload?.messageId ?? null };
  }

  const detail = await response.text().catch(() => '');
  return {
    ok: false,
    // 429 is Brevo telling us to slow down (daily quota/rate), not a bad
    // recipient — leave the row pending for the next daily run.
    permanent: response.status >= 400 && response.status < 500 && response.status !== 429,
    error: `Brevo ${response.status}: ${detail.slice(0, 500)}`,
  };
}
