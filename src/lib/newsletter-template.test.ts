import { describe, expect, it } from 'vitest';
import { buildNewsletterHtml, extractTemplateText, textToHtmlBlocks, wrapEmailShell } from './newsletter-template';

const SITE_URL = 'https://example.ro/';

describe('newsletter template helpers', () => {
  it('converts plain text into escaped newsletter blocks', () => {
    const html = textToHtmlBlocks('Salut <admin>\nlinie nouă\n\n# Noutăți\nProdus & livrare');

    expect(html).toContain('Salut &lt;admin&gt;<br />linie nouă');
    expect(html).toContain('Noutăți');
    expect(html).toContain('Produs &amp; livrare');
    expect(html).not.toContain('<admin>');
  });

  it('builds branded HTML with absolute assets and an extractable text marker', () => {
    const text = 'Salut!\n\n# Recolta de azi\nRoșii & castraveți';
    const html = buildNewsletterHtml(text, SITE_URL);

    expect(html).toMatch(/^<!--desaga-text:[A-Za-z0-9+/=]*-->/);
    expect(html).toContain('src="https://example.ro/images/shared/logo.png"');
    expect(html).toContain('src="https://example.ro/new/muraturi-asortate-1.jpg"');
    expect(html).toContain('alt="Murături asortate DeSaga"');
    expect(html).toContain('src="https://example.ro/new/zacusca-fasole-1.jpg"');
    expect(html).toContain('src="https://example.ro/new/dulceata-ceapa-rosie-1.jpg"');
    expect(html).toContain('href="https://example.ro/produse"');
    expect(html).toContain('Vezi produsele');
    expect(html).toContain('<strong style="color:#1f6f45;">echipa DeSaga cu Legume</strong>');
    expect(extractTemplateText(html, SITE_URL)).toBe(text);
  });

  it('falls back to HTML mode for custom or drifted campaign HTML', () => {
    const text = 'Salut!';
    const html = buildNewsletterHtml(text, SITE_URL);

    expect(extractTemplateText('<p>HTML personalizat</p>', SITE_URL)).toBeNull();
    expect(extractTemplateText(html.replace('Vezi produsele', 'Alt buton'), SITE_URL)).toBeNull();
    expect(extractTemplateText('<!--desaga-text:not-valid-->\n<p>x</p>', SITE_URL)).toBeNull();
  });

  it('wraps body content and the required footer in the shared email shell', () => {
    const html = wrapEmailShell('<p>Salut</p>', '<footer>Dezabonare</footer>');

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<p>Salut</p>');
    expect(html).toContain('<footer>Dezabonare</footer>');
    expect(html).toContain('background-color:#f9f7f2');
  });
});
