
import { writable, type Writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from '$lib/api/supabase';


export interface Product {
  id: string;
  title: string;
  description?: string;
  price?: number;
  image_url: string;
  category?: string;
}

export const products = writable<Product[]>([]);
export const loading = writable(false);
export const error = writable('');

export async function fetchProducts() {
  loading.set(true);
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    products.set(await res.json());
  } catch (err: any) {
    error.set(err.message);
  } finally {
    loading.set(false);
  }
}

export async function fetchProductsByCategory(category: string) {
  loading.set(true);
  try {
    const res = await fetch(`/api/products?category=${category}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    products.set(await res.json());
  } catch (err: any) {
    error.set(err.message);
  } finally {
    loading.set(false);
  }
}
