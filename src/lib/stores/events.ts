import { get, writable } from 'svelte/store';
import { apiFetch } from '$lib/api-client';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string | null;
  event_type: string;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}

export type Event = EventItem;

type EventsState = {
  items: EventItem[];
  loading: boolean;
  error: string | null;
};

const store = writable<EventsState>({
  items: [],
  loading: false,
  error: null
});

function normalizeEvent(raw: any): EventItem {
  return {
    id: raw?.id != null ? String(raw.id) : '',
    title: String(raw?.title ?? ''),
    description: String(raw?.description ?? ''),
    date: String(raw?.date ?? ''),
    location: String(raw?.location ?? ''),
    image_url: raw?.image_url ?? null,
    event_type: String(raw?.event_type ?? 'festival'),
    published: Boolean(raw?.published),
    created_at: raw?.created_at ?? undefined,
    updated_at: raw?.updated_at ?? undefined,
    published_at: raw?.published_at ?? null
  };
}

// Skip refetching on every page mount: data younger than this is served from
// the store (the API layer also caches publicly for 60s via s-maxage).
const STALE_AFTER_MS = 60 * 1000;
let lastLoad: { key: string; at: number } | null = null;

export const eventsStore = {
  subscribe: store.subscribe,

  invalidate() {
    lastLoad = null;
  },

  async loadAll(admin = false, options: { force?: boolean } = {}) {
    const key = admin ? 'admin' : 'public';
    if (!options.force && lastLoad?.key === key && Date.now() - lastLoad.at < STALE_AFTER_MS) {
      return get(store).items;
    }

    store.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams({ limit: '100' });
      if (admin) params.set('admin', 'true');
      const data = await apiFetch<any>(`/api/evenimente?${params.toString()}`, {
        fallbackError: 'Nu am putut încărca evenimentele.',
      });

      const rawItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

      const items = rawItems.map(normalizeEvent);
      store.set({ items, loading: false, error: null });
      lastLoad = { key, at: Date.now() };
      return items;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Eroare necunoscută.';
      store.set({ items: [], loading: false, error: msg });
      lastLoad = null;
      return [];
    }
  },

  async getById(id: string) {
    const data = await apiFetch<any>(`/api/evenimente/${encodeURIComponent(id)}`, {
      fallbackError: 'Nu am putut încărca evenimentul.',
    });
    const raw = data && typeof data === 'object' && 'item' in data ? data.item : data;
    return normalizeEvent(raw);
  },

  async update(id: string, patch: Partial<EventItem>) {
    const data = await apiFetch<any>(`/api/evenimente/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      fallbackError: 'Nu am putut actualiza evenimentul.',
    });
    this.invalidate();

    const raw = data && typeof data === 'object' && 'item' in data ? data.item : data;
    return normalizeEvent(raw);
  },

  async remove(id: string) {
    const data = await apiFetch<{ success: true }>(`/api/evenimente/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      fallbackError: 'Nu am putut șterge evenimentul.',
    });
    this.invalidate();

    return data;
  }
};

export async function getAllEvents(admin = false) {
  return eventsStore.loadAll(admin);
}

export async function getEventById(id: string) {
  return eventsStore.getById(id);
}
