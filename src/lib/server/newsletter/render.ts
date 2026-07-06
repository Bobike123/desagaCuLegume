import { escapeHtml } from '$lib/server/security-helpers';
import { getNewsletterEnv } from '$lib/server/newsletter/env';

export type RenderedEmail = {
  htmlContent: string;
  headers: Record<string, string>;
};

export function unsubscribePageUrl(token: string) {
  const env = getNewsletterEnv();
  return `${env.siteUrl}/dezabonare?token=${encodeURIComponent(token)}`;
}

export function unsubscribeOneClickUrl(token: string) {
  const env = getNewsletterEnv();
  return `${env.siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

// Wraps the admin-authored HTML in a minimal email shell with the legally
// required footer: sender identity + visible unsubscribe link, plus the
// RFC 8058 one-click headers (Gmail/Yahoo require them for bulk senders).
export function renderCampaignEmail(bodyHtml: string, unsubscribeToken: string): RenderedEmail {
  const env = getNewsletterEnv();
  const pageUrl = unsubscribePageUrl(unsubscribeToken);
  const oneClickUrl = unsubscribeOneClickUrl(unsubscribeToken);

  const htmlContent = `<!doctype html>
<html lang="ro">
<body style="margin:0;padding:0;background-color:#f5f5f4;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;color:#1c1c1a;font-size:16px;line-height:1.6;">
    <div style="background-color:#ffffff;border-radius:8px;padding:24px;">
${bodyHtml}
    </div>
    <div style="padding:16px 8px;font-size:12px;line-height:1.5;color:#6b6b66;text-align:center;">
      <p style="margin:0 0 4px;">Ai primit acest email pentru că te-ai abonat la newsletterul ${escapeHtml(env.fromName)}.</p>
      <p style="margin:0;"><a href="${pageUrl}" style="color:#6b6b66;">Dezabonează-te</a></p>
    </div>
  </div>
</body>
</html>`;

  return {
    htmlContent,
    headers: {
      'List-Unsubscribe': `<${oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
