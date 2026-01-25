// FILE: src/lib/stores/auth.ts

import { writable, derived } from "svelte/store";

export interface AuthState {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAdmin: false,
  loading: true,
  error: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    async initAuth() {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          set({
            isAdmin: false,
            loading: false,
            error: data?.error ?? "Failed to fetch session",
          });
          return;
        }

        set({
          isAdmin: Boolean(data?.isAdmin),
          loading: false,
          error: null,
        });
      } catch (error) {
        set({
          isAdmin: false,
          loading: false,
          error: error instanceof Error ? error.message : "Auth check failed",
        });
      }
    },

    async logout() {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        set({ ...initialState, loading: false });
      } catch (error) {
        update((s) => ({
          ...s,
          error: error instanceof Error ? error.message : "Logout failed",
        }));
      }
    },

    reset() {
      set(initialState);
    },
  };
}

export const auth = createAuthStore();
export const { initAuth, logout } = auth;

export const isAdmin = derived(auth, ($auth) => $auth.isAdmin);
