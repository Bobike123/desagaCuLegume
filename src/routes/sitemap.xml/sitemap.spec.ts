import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { PUBLIC_SITEMAP_PATHS, absoluteUrl } from '$lib/seo/site';
import { GET } from './+server';

describe('robots.txt and sitemap.xml', () => {
  it('disallows admin, API, and decoy routes in robots.txt', async () => {
    const robots = await readFile('static/robots.txt', 'utf8');

    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Disallow: /security-decoy');
    expect(robots).toContain('Disallow: /.env');
    expect(robots).toContain('Disallow: /backup.zip');
    expect(robots).toContain('Sitemap: https://desagaculegume.ro/sitemap.xml');
  });

  it('includes public pages and excludes decoy pages from sitemap.xml', async () => {
    const response = GET();
    const xml = await response.text();

    expect(response.headers.get('Content-Type')).toContain('application/xml');
    for (const path of PUBLIC_SITEMAP_PATHS) {
      expect(xml).toContain(`<loc>${absoluteUrl(path)}</loc>`);
    }

    expect(xml).toContain('<loc>https://desagaculegume.ro/legume-proaspete-cluj-napoca</loc>');
    expect(xml).not.toContain('/security-decoy');
    expect(xml).not.toContain('/admin-backup');
    expect(xml).not.toContain('/.env');
  });
});
