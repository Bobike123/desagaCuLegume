import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
  VEGETABLE_STORE_DESCRIPTION,
  VEGETABLE_STORE_TITLE,
} from '$lib/seo/vegetable-store';
import Page from './+page.svelte';

describe('/legume-proaspete-cluj-napoca', () => {
  it('renders human content and page metadata', async () => {
    render(Page);

    await expect.element(page.getByRole('heading', { name: 'Legume proaspete în Cluj-Napoca' })).toBeInTheDocument();
    expect(document.title).toBe(VEGETABLE_STORE_TITLE);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      VEGETABLE_STORE_DESCRIPTION
    );
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain('GroceryStore');
  });
});
