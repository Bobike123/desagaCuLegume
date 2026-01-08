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
  created_at?: string;    // keep as string (ISO)
  updated_at?: string;
  
}

export type Noutate = NewsItem;

type NewsState = {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
};

const state = writable<NewsState>({ items: [], loading: false, error: null });

export const noutatiStore = {
  subscribe: state.subscribe,

  async loadAll() {
    state.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/noutati');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load news');
      state.set({ items: data ?? [], loading: false, error: null });
      return data as NewsItem[];
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      state.set({ items: [], loading: false, error: msg });
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
