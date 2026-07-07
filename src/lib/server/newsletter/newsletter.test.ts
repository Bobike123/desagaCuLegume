import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: {
    BREVO_API_KEY: 'test-api-key',
    NEWSLETTER_FROM_EMAIL: 'newsletter@example.ro',
    NEWSLETTER_FROM_NAME: 'DeSaga cu Legume',
    NEWSLETTER_DAILY_LIMIT: '280',
    CRON_SECRET: 'test-cron-secret',
  },
}));

vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SITE_URL: 'https://example.ro/',
  },
}));

import { getNewsletterEnv } from './env';
import { renderCampaignEmail, unsubscribeOneClickUrl, unsubscribePageUrl } from './render';
import { sendEmail } from './brevo';
import { isCampaignReadyToSend, utcDayStartIso } from './schedule';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('newsletter env', () => {
  it('parses and normalizes the configured values', () => {
    const env = getNewsletterEnv();
    expect(env.siteUrl).toBe('https://example.ro');
    expect(env.dailyLimit).toBe(280);
  });
});

describe('newsletter schedule helpers', () => {
  it('checks whether a campaign reached its scheduled send time', () => {
    const now = new Date('2026-07-06T10:15:00.000Z');

    expect(isCampaignReadyToSend(null, now)).toBe(true);
    expect(isCampaignReadyToSend('2026-07-06T10:15:00.000Z', now)).toBe(true);
    expect(isCampaignReadyToSend('2026-07-06T10:20:00.000Z', now)).toBe(false);
    expect(isCampaignReadyToSend('not-a-date', now)).toBe(false);
  });

  it('builds the UTC day boundary used for the daily send cap', () => {
    expect(utcDayStartIso(new Date('2026-07-06T23:59:59.000Z'))).toBe('2026-07-06T00:00:00.000Z');
  });
});

describe('renderCampaignEmail', () => {
  it('wraps the body and appends the unsubscribe footer', () => {
    const token = 'a'.repeat(48);
    const rendered = renderCampaignEmail('<p>Salut</p>', token);

    expect(rendered.htmlContent).toContain('<p>Salut</p>');
    expect(rendered.htmlContent).toContain('Dezabonează-te');
    expect(rendered.htmlContent).toContain(`https://example.ro/dezabonare?token=${token}`);
    expect(rendered.htmlContent).toContain('DeSaga cu Legume');
  });

  it('sets the RFC 8058 one-click unsubscribe headers', () => {
    const token = 'b'.repeat(48);
    const rendered = renderCampaignEmail('<p>x</p>', token);

    expect(rendered.headers['List-Unsubscribe']).toBe(
      `<https://example.ro/api/newsletter/unsubscribe?token=${token}>`
    );
    expect(rendered.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });

  it('builds encoded unsubscribe URLs', () => {
    expect(unsubscribePageUrl('x y')).toBe('https://example.ro/dezabonare?token=x%20y');
    expect(unsubscribeOneClickUrl('x y')).toBe('https://example.ro/api/newsletter/unsubscribe?token=x%20y');
  });
});

describe('sendEmail failure classification', () => {
  function stubFetchResponse(status: number, body = '{}') {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body, { status }))
    );
  }

  it('returns ok with the Brevo message id on success', async () => {
    stubFetchResponse(201, JSON.stringify({ messageId: '<abc@brevo>' }));
    const result = await sendEmail({ to: 'a@b.ro', subject: 's', htmlContent: '<p>x</p>' });
    expect(result).toEqual({ ok: true, messageId: '<abc@brevo>' });
  });

  it('marks 4xx responses as permanent failures', async () => {
    stubFetchResponse(400, '{"message":"invalid recipient"}');
    const result = await sendEmail({ to: 'a@b.ro', subject: 's', htmlContent: '<p>x</p>' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.permanent).toBe(true);
  });

  it('treats 429 (quota) and 5xx as retryable', async () => {
    stubFetchResponse(429);
    const quota = await sendEmail({ to: 'a@b.ro', subject: 's', htmlContent: '<p>x</p>' });
    expect(quota.ok).toBe(false);
    if (!quota.ok) expect(quota.permanent).toBe(false);

    stubFetchResponse(503);
    const outage = await sendEmail({ to: 'a@b.ro', subject: 's', htmlContent: '<p>x</p>' });
    expect(outage.ok).toBe(false);
    if (!outage.ok) expect(outage.permanent).toBe(false);
  });

  it('treats network errors as retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('socket hang up');
      })
    );
    const result = await sendEmail({ to: 'a@b.ro', subject: 's', htmlContent: '<p>x</p>' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.permanent).toBe(false);
      expect(result.error).toContain('socket hang up');
    }
  });
});
