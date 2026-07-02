import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { productsStore } = await import('./products');

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    sku: 'SKU-001',
    name: 'Roșii',
    description: 'Roșii de sezon',
    category: 'de-sezon',
    price: 8.5,
    image_url: 'http://example.com/rosii.jpg',
    in_stock: true,
    stock_quantity: 20,
    status: 'active',
    ...overrides,
  };
}

function fakeResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  productsStore.invalidate();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('productsStore.loadAll', () => {
  it('populates items on success', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeProduct()] }));
    await productsStore.loadAll();
    const { items, loading, error } = get(productsStore);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Roșii');
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('handles top-level array response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse([makeProduct(), makeProduct({ id: '2', name: 'Morcovi' })]));
    await productsStore.loadAll();
    expect(get(productsStore).items).toHaveLength(2);
  });

  it('sets error on non-ok response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Not found' }, 404));
    await productsStore.loadAll();
    const { items, loading, error } = get(productsStore);
    expect(items).toHaveLength(0);
    expect(loading).toBe(false);
    expect(error).toBe('Not found');
  });

  it('sets error on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    await productsStore.loadAll();
    const { items, loading, error } = get(productsStore);
    expect(items).toHaveLength(0);
    expect(loading).toBe(false);
    expect(typeof error).toBe('string');
  });

  it('handles empty items array', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [] }));
    await productsStore.loadAll();
    expect(get(productsStore).items).toHaveLength(0);
  });

  it('appends category filter to request', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [] }));
    await productsStore.loadAll('la-borcan');
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('category=la-borcan');
  });
});

describe('productsStore row normalization', () => {
  it('coerces price string to number', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeProduct({ price: '12.5' })] }));
    await productsStore.loadAll();
    expect(get(productsStore).items[0].price).toBe(12.5);
  });

  it('normalizes in_stock from truthy string', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeProduct({ in_stock: '1' })] }));
    await productsStore.loadAll();
    expect(get(productsStore).items[0].in_stock).toBe(true);
  });

  it('normalizes in_stock from false', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeProduct({ in_stock: false })] }));
    await productsStore.loadAll();
    expect(get(productsStore).items[0].in_stock).toBe(false);
  });

  it('defaults category to de-sezon when absent', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeProduct({ category: undefined })] }));
    await productsStore.loadAll();
    expect(get(productsStore).items[0].category).toBe('de-sezon');
  });

  it('converts numeric id to string', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeProduct({ id: 99 })] }));
    await productsStore.loadAll();
    expect(get(productsStore).items[0].id).toBe('99');
  });
});

describe('productsStore.getById', () => {
  it('returns a normalized product on success', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ item: makeProduct({ id: '7', name: 'Salată' }) }));
    const product = await productsStore.getById('7');
    expect(product.id).toBe('7');
    expect(product.name).toBe('Salată');
  });

  it('throws on non-ok response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Not found' }, 404));
    await expect(productsStore.getById('99')).rejects.toThrow('Not found');
  });

  it('handles top-level item response (no wrapper)', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse(makeProduct({ id: '3', name: 'Ceapă' })));
    const product = await productsStore.getById('3');
    expect(product.name).toBe('Ceapă');
  });
});
