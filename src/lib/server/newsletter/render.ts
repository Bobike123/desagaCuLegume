import { escapeHtml } from '$lib/server/security-helpers';
import { getNewsletterEnv } from '$lib/server/newsletter/env';
import { wrapEmailShell } from '$lib/newsletter-template';

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

export function unsubscribeFooterHtml(fromName: string, unsubscribePage: string) {
  return `    <div style="padding:16px 8px;font-size:12px;line-height:1.5;color:#6b6b66;text-align:center;">
      <p style="margin:0 0 4px;">Ai primit acest email pentru că te-ai abonat la newsletterul ${escapeHtml(fromName)}.</p>
      <p style="margin:0;"><a href="${escapeHtml(unsubscribePage)}" style="color:#6b6b66;">Dezabonează-te</a></p>
    </div>`;
}

// Wraps the admin-authored HTML in the shared email shell with the legally
// required footer: sender identity + visible unsubscribe link, plus the
// RFC 8058 one-click headers (Gmail/Yahoo require them for bulk senders).
export function renderCampaignEmail(bodyHtml: string, unsubscribeToken: string): RenderedEmail {
  const env = getNewsletterEnv();
  const pageUrl = unsubscribePageUrl(unsubscribeToken);
  const oneClickUrl = unsubscribeOneClickUrl(unsubscribeToken);

  return {
    htmlContent: wrapEmailShell(bodyHtml, unsubscribeFooterHtml(env.fromName, pageUrl)),
    headers: {
      'List-Unsubscribe': `<${oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
