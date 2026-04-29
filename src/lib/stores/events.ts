import { writable } from 'svelte/store';

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

export const eventsStore = {
  subscribe: store.subscribe,

  async loadAll(admin = false) {
    store.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const qs = admin ? '?admin=true' : '';
      const res = await fetch(`/api/evenimente${qs}`);
      const data = await res.json().catch(() => ([]));

      if (!res.ok) throw new Error(data?.error ?? 'Failed to load events');

      const rawItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

      const items = rawItems.map(normalizeEvent);
      store.set({ items, loading: false, error: null });
      return items;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      store.set({ items: [], loading: false, error: msg });
      return [];
    }
  },

  async getById(id: string) {
    const res = await fetch(`/api/evenimente/${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data?.error ?? 'Failed to load event');

    const raw = data && typeof data === 'object' && 'item' in data ? data.item : data;
    return normalizeEvent(raw);
  },

  async update(id: string, patch: Partial<EventItem>) {
    const res = await fetch(`/api/evenimente/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Failed to update event');

    const raw = data && typeof data === 'object' && 'item' in data ? data.item : data;
    return normalizeEvent(raw);
  },

  async remove(id: string) {
    const res = await fetch(`/api/evenimente/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? 'Failed to delete event');

    return data as { success: true };
  }
};

export async function getAllEvents(admin = false) {
  return eventsStore.loadAll(admin);
}

export async function getEventById(id: string) {
  return eventsStore.getById(id);
}

export async function updateEvent(id: string, patch: Partial<EventItem>) {
  return eventsStore.update(id, patch);
}

export async function deleteEvent(id: string) {
  return eventsStore.remove(id);
}
