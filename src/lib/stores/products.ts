// src/lib/server/products.ts
import { supabaseServer } from '$lib/api/supabase';
export const supabaseAdmin = supabaseServer()

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock?: number;
  created_at?: string;
}

export async function getAllProducts(category?: string | null) {
  let query = supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data as Product[];
}

export async function getProductById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string) {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}