import { writable, type Writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from '$lib/api/supabase';


export interface Noutate {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  created_at: string | Date;
  author_id: string;
  published: boolean;
}

export const noutati = writable<Noutate[]>([]);
export const loading = writable(false);
export const error = writable('');

export async function fetchNoutati() {
  loading.set(true);
  try {
    const res = await fetch('/api/noutati');
    if (!res.ok) throw new Error('Failed to fetch news');
    noutati.set(await res.json());
  } catch (err: any) {
    error.set(err.message);
  } finally {
    loading.set(false);
  }
}
