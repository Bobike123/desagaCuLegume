/**
 * Branded newsletter template shared by the admin composer (client) and the
 * send-time renderer (server). Admins write plain text; the text is converted
 * into the branded HTML and also embedded as a base64 marker comment so the
 * composer can reopen a campaign in text mode. Hand-edited HTML (marker
 * removed or content drifted) simply falls back to HTML mode.
 */

export const TEXT_MARKER_PATTERN = /^<!--desaga-text:([A-Za-z0-9+/=]*)-->\n?/;

export const NEW_CAMPAIGN_SAMPLE_TEXT = `Salut!

Avem vești proaspete de la rulota DeSaga: murături, zacuscă, vinete coapte și dulcețuri pregătite în bucătăria noastră.

Treci pe la noi sau comandă online — stocul de azi se termină repede.`;

// Email clients need absolute URLs; every image below already exists in static.
const TEMPLATE_IMAGES = {
  logo: '/images/shared/logo.png',
  hero: '/new/muraturi-asortate-1.jpg',
  rows: [
    [
      { path: '/new/zacusca-fasole-1.jpg', alt: 'Zacuscă de fasole' },
      { path: '/new/vinete-coapte-1.jpg', alt: 'Vinete coapte' },
      { path: '/new/dulceata-ardei-iute-1.jpg', alt: 'Dulceață de ardei iute' },
    ],
    [
      { path: '/new/castraveti-murati-1.jpg', alt: 'Castraveți murați' },
      { path: '/new/gogonele-murate-1.jpg', alt: 'Gogonele murate' },
      { path: '/new/dulceata-ceapa-rosie-1.jpg', alt: 'Dulceață de ceapă roșie' },
    ],
  ],
} as const;

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSiteUrl(siteUrl: string): string {
  const clean = siteUrl.trim().replace(/\/+$/, '');
  if (!clean) return '';

  try {
    return new URL(clean).toString().replace(/\/$/, '');
  } catch {
    return clean;
  }
}

function absoluteUrl(siteUrl: string, path: string): string {
  const base = normalizeSiteUrl(siteUrl);
  if (!base) return escapeEmailHtml(path);

  try {
    return escapeEmailHtml(new URL(path, `${base}/`).toString());
  } catch {
    const separator = path.startsWith('/') ? '' : '/';
    return escapeEmailHtml(`${base}${separator}${path}`);
  }
}

// Plain text -> paragraphs: blank lines separate blocks, lines starting with
// "# " become headings, and single newlines inside a paragraph become <br>.
export function textToHtmlBlocks(text: string): string {
  const html: string[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    const paragraph = paragraphLines.join('\n').trim();
    paragraphLines = [];
    if (!paragraph) return;

    const withBreaks = escapeEmailHtml(paragraph).replace(/\n/g, '<br />');
    html.push(
      `<p style="margin:0 0 14px;color:#14212b;font-size:16px;line-height:1.65;">${withBreaks}</p>`
    );
  }

  for (const rawLine of text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    if (line.startsWith('# ')) {
      flushParagraph();
      html.push(
        `<h2 style="margin:0 0 12px;color:#17452d;font-size:22px;line-height:1.3;">${escapeEmailHtml(line.slice(2).trim())}</h2>`
      );
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return html.join('\n');
}

export function buildNewsletterHtml(text: string, siteUrl: string): string {
  const contentHtml = textToHtmlBlocks(text);
  const productRows = TEMPLATE_IMAGES.rows
    .map(
      (row, index) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;${index ? 'margin-top:4px;' : ''}">
  <tr>
${row
  .map(
    (image) =>
      `    <td style="padding:4px;">
      <img src="${absoluteUrl(siteUrl, image.path)}" alt="${escapeEmailHtml(image.alt)}" width="176" style="width:100%;height:96px;object-fit:cover;border-radius:12px;display:block;" />
    </td>`
  )
  .join('\n')}
  </tr>
</table>`
    )
    .join('\n');

  return `<!--desaga-text:${toBase64(text)}-->
<div style="text-align:center;padding-bottom:14px;">
  <img src="${absoluteUrl(siteUrl, TEMPLATE_IMAGES.logo)}" alt="DeSaga cu Legume" width="64" height="64" style="border-radius:16px;display:inline-block;" />
  <p style="margin:8px 0 0;color:#1f6f45;font-size:18px;font-weight:bold;letter-spacing:0.02em;">DeSaga cu Legume</p>
  <p style="margin:2px 0 0;color:#5c4033;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Legume locale · Cluj-Napoca</p>
</div>
<img src="${absoluteUrl(siteUrl, TEMPLATE_IMAGES.hero)}" alt="Murături asortate DeSaga" width="552" style="width:100%;border-radius:16px;display:block;" />
<div style="padding:18px 2px 4px;">
${contentHtml}
</div>
<div style="text-align:center;padding:6px 0 18px;">
  <a href="${absoluteUrl(siteUrl, '/produse')}" style="display:inline-block;background-color:#1f6f45;color:#ffffff;font-weight:bold;font-size:16px;text-decoration:none;padding:12px 28px;border-radius:999px;">Vezi produsele</a>
</div>
${productRows}
<p style="margin:18px 0 0;color:#14212b;font-size:15px;line-height:1.6;">
  Cu drag,<br />
  <strong style="color:#1f6f45;">echipa DeSaga cu Legume</strong>
</p>`;
}

function normalizeGeneratedHtml(html: string): string {
  return html.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// Returns the original plain text when the HTML still carries the composer
// marker, or null for hand-written/edited HTML. When siteUrl is provided, the
// generated HTML must still match the text marker so manual HTML edits stay in
// advanced mode instead of being overwritten by regenerated text-mode HTML.
export function extractTemplateText(html: string, siteUrl?: string): string | null {
  const match = TEXT_MARKER_PATTERN.exec(html.trimStart());
  if (!match) return null;
  try {
    const text = fromBase64(match[1]);
    if (
      siteUrl &&
      normalizeGeneratedHtml(html) !== normalizeGeneratedHtml(buildNewsletterHtml(text, siteUrl))
    ) {
      return null;
    }
    return text;
  } catch {
    return null;
  }
}

// The outer email chrome (cream background + white card). Used by the server
// renderer for real sends and by the composer preview so what the admin sees
// matches what recipients get.
export function wrapEmailShell(innerHtml: string, footerHtml = ''): string {
  return `<!doctype html>
<html lang="ro">
<body style="margin:0;padding:0;background-color:#f9f7f2;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;color:#14212b;font-size:16px;line-height:1.6;">
    <div style="background-color:#ffffff;border-radius:16px;padding:24px;">
${innerHtml}
    </div>
${footerHtml}
  </div>
</body>
</html>`;
}
