import { env } from '$env/dynamic/private';

type NewsletterEnv = {
  brevoApiKey: string;
  fromEmail: string;
  fromName: string;
  siteUrl: string;
  dailyLimit: number;
  cronSecret: string;
};

const DEFAULT_DAILY_LIMIT = 280;

// Read via $env/dynamic/private (not $env/static/private) so builds and every
// non-newsletter route keep working before these variables are configured;
// the assertions only fire lazily inside newsletter code paths.

function assertPresent(name: string, value: string | undefined) {
  const clean = String(value ?? '').trim();
  if (!clean) {
    throw new Error(`Variabila de mediu ${name} lipsește.`);
  }

  if (/^(your-|change-me|replace-me|placeholder)/i.test(clean)) {
    throw new Error(`Variabila de mediu ${name} conține o valoare placeholder.`);
  }

  return clean;
}

function assertUrl(name: string, value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Protocol invalid');
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Variabila de mediu ${name} trebuie să fie un URL valid.`);
  }
}

function parseDailyLimit(raw: string | undefined) {
  const value = Number(raw ?? DEFAULT_DAILY_LIMIT);
  if (!Number.isFinite(value) || value < 1) return DEFAULT_DAILY_LIMIT;
  return Math.min(Math.floor(value), 300);
}

export function getNewsletterEnv(): NewsletterEnv {
  return {
    brevoApiKey: assertPresent('BREVO_API_KEY', env.BREVO_API_KEY),
    fromEmail: assertPresent('NEWSLETTER_FROM_EMAIL', env.NEWSLETTER_FROM_EMAIL),
    fromName: assertPresent('NEWSLETTER_FROM_NAME', env.NEWSLETTER_FROM_NAME),
    siteUrl: assertUrl('PUBLIC_SITE_URL', assertPresent('PUBLIC_SITE_URL', env.PUBLIC_SITE_URL)),
    dailyLimit: parseDailyLimit(env.NEWSLETTER_DAILY_LIMIT),
    cronSecret: assertPresent('CRON_SECRET', env.CRON_SECRET),
  };
}
