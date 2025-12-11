// src/lib/server/noutati.ts
import { supabaseServer } from '$lib/api/supabase';
export const supabaseAdmin = supabaseServer()

export interface Noutate {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  created_at?: string | Date;
  author_id: string;
  published: boolean;
}

export async function getAllNoutati() {
  const { data, error } = await supabaseAdmin
    .from('noutati')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Noutate[];
}

export async function getNoutateById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('noutati')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Noutate;
}

export async function createNoutate(noutate: Omit<Noutate, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('noutati')
    .insert(noutate)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Noutate;
}

export async function updateNoutate(id: string, noutate: Partial<Noutate>) {
  const { data, error } = await supabaseAdmin
    .from('noutati')
    .update(noutate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Noutate;
}

export async function deleteNoutate(id: string) {
  const { error } = await supabaseAdmin
    .from('noutati')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}