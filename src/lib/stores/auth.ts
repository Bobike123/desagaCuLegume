import { derived, writable } from 'svelte/store';

export interface SessionUser {
  id: number;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  status: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: SessionUser | null;
  roles: string[];
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  roles: [],
  loading: true,
  error: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  async function loadSession() {
    update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        set({
          ...initialState,
          loading: false,
          error: data?.error ?? 'Failed to fetch session',
        });
        return null;
      }

      set({
        isAuthenticated: Boolean(data?.isAuthenticated),
        isAdmin: Boolean(data?.isAdmin),
        user: data?.user ?? null,
        roles: Array.isArray(data?.roles) ? data.roles : [],
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      set({
        ...initialState,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch session',
      });
      return null;
    }
  }

  return {
    subscribe,
    initAuth: loadSession,
    refresh: loadSession,

    async login(payload: { identity: string; password: string; requireAdmin?: boolean }) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error ?? 'Login failed';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        await loadSession();
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        update((state) => ({ ...state, loading: false, error: message }));
        throw error;
      }
    },

    async register(payload: {
      username?: string;
      email: string;
      password: string;
      fullName?: string;
      phone?: string;
    }) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error ?? 'Registration failed';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        await loadSession();
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        update((state) => ({ ...state, loading: false, error: message }));
        throw error;
      }
    },

    async updateProfile(payload: {
      fullName?: string;
      phone?: string;
      email?: string;
      username?: string;
    }) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/api/user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error ?? 'Profile update failed';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        await loadSession();
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Profile update failed';
        update((state) => ({ ...state, loading: false, error: message }));
        throw error;
      }
    },

    async changePassword(payload: { currentPassword: string; newPassword: string }) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error ?? 'Password change failed';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        update((state) => ({ ...state, loading: false, error: null }));
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Password change failed';
        update((state) => ({ ...state, loading: false, error: message }));
        throw error;
      }
    },

    async logout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } finally {
        set({ ...initialState, loading: false });
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
export const isAuthenticated = derived(auth, ($auth) => $auth.isAuthenticated);
export const currentUser = derived(auth, ($auth) => $auth.user);
