import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { eventsStore, getAllEvents, getEventById } = await import('./events');

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    title: 'Piață de vară',
    description: 'Legume proaspete',
    date: '2024-07-15T10:00:00Z',
    location: 'Cluj-Napoca',
    image_url: 'https://example.com/event.jpg',
    event_type: 'piata',
    published: true,
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
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('eventsStore.loadAll', () => {
  it('populates items on success', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent()] }));
    await eventsStore.loadAll();
    const { items, loading, error } = get(eventsStore);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Piață de vară');
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('handles top-level array response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse([makeEvent(), makeEvent({ id: '2', title: 'Festival' })]));
    await eventsStore.loadAll();
    expect(get(eventsStore).items).toHaveLength(2);
  });

  it('sets error on non-ok response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Not found' }, 404));
    await eventsStore.loadAll();
    const { items, loading, error } = get(eventsStore);
    expect(items).toHaveLength(0);
    expect(loading).toBe(false);
    expect(error).toBe('Not found');
  });

  it('sets error on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network failure'));
    await eventsStore.loadAll();
    const { items, loading, error } = get(eventsStore);
    expect(items).toHaveLength(0);
    expect(loading).toBe(false);
    expect(typeof error).toBe('string');
  });

  it('handles empty items array', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [] }));
    await eventsStore.loadAll();
    expect(get(eventsStore).items).toHaveLength(0);
  });

  it('appends admin param when admin=true', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [] }));
    await eventsStore.loadAll(true);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('admin=true');
  });

  it('does not append admin param by default', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [] }));
    await eventsStore.loadAll();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).not.toContain('admin=true');
  });
});

describe('eventsStore row normalization', () => {
  it('coerces id to string', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent({ id: 7 })] }));
    await eventsStore.loadAll();
    expect(get(eventsStore).items[0].id).toBe('7');
  });

  it('coerces published from falsy value', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent({ published: 0 })] }));
    await eventsStore.loadAll();
    expect(get(eventsStore).items[0].published).toBe(false);
  });

  it('defaults event_type to festival when absent', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent({ event_type: undefined })] }));
    await eventsStore.loadAll();
    expect(get(eventsStore).items[0].event_type).toBe('festival');
  });

  it('preserves null image_url', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent({ image_url: null })] }));
    await eventsStore.loadAll();
    expect(get(eventsStore).items[0].image_url).toBeNull();
  });

  it('uses empty string for missing title', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent({ title: undefined })] }));
    await eventsStore.loadAll();
    expect(get(eventsStore).items[0].title).toBe('');
  });

  it('preserves optional published_at as null when absent', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent()] }));
    await eventsStore.loadAll();
    expect(get(eventsStore).items[0].published_at).toBeNull();
  });
});

describe('eventsStore.getById', () => {
  it('returns a normalized event on success with item wrapper', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ item: makeEvent({ id: '5', title: 'Atelier' }) }));
    const event = await eventsStore.getById('5');
    expect(event.id).toBe('5');
    expect(event.title).toBe('Atelier');
  });

  it('handles top-level response without item wrapper', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse(makeEvent({ id: '3', title: 'Festival Mare' })));
    const event = await eventsStore.getById('3');
    expect(event.title).toBe('Festival Mare');
  });

  it('throws on non-ok response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Not found' }, 404));
    await expect(eventsStore.getById('99')).rejects.toThrow('Not found');
  });

  it('URL-encodes the id parameter', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse(makeEvent()));
    await eventsStore.getById('abc/xyz');
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('abc%2Fxyz');
  });
});

describe('eventsStore.update', () => {
  it('returns normalized event on success', async () => {
    const updated = makeEvent({ id: '5', title: 'Updated Event' });
    fetchMock.mockReturnValueOnce(fakeResponse({ item: updated }));
    const result = await eventsStore.update('5', { title: 'Updated Event' });
    expect(result.title).toBe('Updated Event');
    expect(result.id).toBe('5');
  });

  it('throws on non-ok response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Not found' }, 404));
    await expect(eventsStore.update('99', {})).rejects.toThrow('Not found');
  });

  it('sends PATCH request with JSON body', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ item: makeEvent() }));
    await eventsStore.update('1', { published: true });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toMatchObject({ published: true });
  });
});

describe('eventsStore.remove', () => {
  it('returns success data on deletion', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ success: true }));
    const result = await eventsStore.remove('5');
    expect(result).toMatchObject({ success: true });
  });

  it('throws on non-ok response', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ error: 'Not found' }, 404));
    await expect(eventsStore.remove('99')).rejects.toThrow('Not found');
  });

  it('sends DELETE request', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ success: true }));
    await eventsStore.remove('7');
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('DELETE');
  });
});

describe('getAllEvents / getEventById module exports', () => {
  it('getAllEvents delegates to eventsStore.loadAll', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ items: [makeEvent({ id: '10' })] }));
    const result = await getAllEvents();
    expect(result[0].id).toBe('10');
  });

  it('getEventById delegates to eventsStore.getById', async () => {
    fetchMock.mockReturnValueOnce(fakeResponse({ item: makeEvent({ id: '11', title: 'Piață' }) }));
    const result = await getEventById('11');
    expect(result.title).toBe('Piață');
  });
});
