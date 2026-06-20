import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

function jsonResponse(body: unknown) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('/+page.svelte', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn(async () => jsonResponse({ items: [] }));
		vi.stubGlobal(
			'fetch',
			fetchMock
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should render h1', async () => {
		render(Page);
		
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
	});
});
