// FILE: src/lib/stores/noutati.ts

// src/lib/stores/noutati.ts
import { writable } from 'svelte/store';

export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  image_url?: string;
  published?: boolean;
  author_id?: string;     // page expects it
  created_at?: string;    // keep as string
  updated_at?: string;
}

export type Noutate = NewsItem;

type NoutatiState = {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
};

const store = writable<NoutatiState>({
  items: [],
  loading: false,
  error: null
});

export const noutatiStore = {
  subscribe: store.subscribe,

  async loadAll() {
    store.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/noutati');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load news');
      store.set({ items: data ?? [], loading: false, error: null });
      return data as NewsItem[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      store.set({ items: [], loading: false, error: msg });
      return [];
    }
  },

  async getById(id: string) {
    const res = await fetch(`/api/noutati/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Failed to load news item');
    return data as NewsItem;
  }
};

export async function getAllNoutati() {
  return noutatiStore.loadAll();
}

export async function getNoutateById(id: string) {
  return noutatiStore.getById(id);
}
