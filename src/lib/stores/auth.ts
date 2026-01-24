// FILE: src/lib/stores/auth.ts

import { writable, derived } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  loading: true,
  error: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    async initAuth() {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          update((state) => ({
            ...state,
            loading: false,
            error: 'Failed to fetch session'
          }));
          return;
        }

        const data = await response.json();
        set({
          user: data.user,
          isAdmin: data.isAdmin,
          loading: false,
          error: null
        });
      } catch (error) {
        set({
          user: null,
          isAdmin: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Auth check failed'
        });
      }
    },

    async logout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        set(initialState);
      } catch (error) {
        update((state) => ({
          ...state,
          error: error instanceof Error ? error.message : 'Logout failed'
        }));
      }
    },

    reset() {
      set(initialState);
    },

    setUser(user: User | null) {
      update((state) => ({ ...state, user }));
    },

    setAdmin(isAdmin: boolean) {
      update((state) => ({ ...state, isAdmin }));
    }
  };
}

export const auth = createAuthStore();

export const { initAuth, logout, setUser, setAdmin } = auth;

export const user = derived(auth, ($auth) => $auth.user);
export const isAdmin = derived(auth, ($auth) => $auth.isAdmin);

export async function getSession(token: string): Promise<{
  user: User | null;
  isAdmin: boolean;
  error: string | null;
}> {
  try {
    const response = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return { user: null, isAdmin: false, error: 'Invalid session' };
    }

    const data = await response.json();
    return { user: data.user, isAdmin: data.isAdmin, error: null };
  } catch (error) {
    return { user: null, isAdmin: false, error: 'Session fetch failed' };
  }
}
