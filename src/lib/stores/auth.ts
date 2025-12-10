import { writable, type Writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from '$lib/api/supabase';

// Stores
export const user: Writable<User | null> = writable<User | null>(null);
export const isAdmin: Writable<boolean> = writable(false);
export const isLoading: Writable<boolean> = writable(true);
export const error: Writable<string> = writable('');

// Initialize authentication
export async function initAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      user.set(session.user);

      // Check admin status
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      isAdmin.set(userData?.role === 'admin');
    }
  } catch (err) {
    console.error('Auth init error:', err);
    error.set('Authentication error');
  } finally {
    isLoading.set(false);
  }
}

// Logout function
export async function logout() {
  try {
    await supabase.auth.signOut();
    user.set(null);
    isAdmin.set(false);
  } catch (err) {
    console.error('Logout error:', err);
    error.set('Logout failed');
  }
}
