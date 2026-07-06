import { writable } from 'svelte/store';

interface SessionUser {
  id: number;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  status: string;
}

interface AuthState {
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
          error: data?.error ?? 'Nu am putut verifica sesiunea.',
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
        error: error instanceof Error ? error.message : 'Nu am putut verifica sesiunea.',
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
          signal: AbortSignal.timeout(30_000),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error ?? 'Autentificarea a eșuat.';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        await loadSession();
        return data;
      } catch (error) {
        const message =
          error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
            ? 'Autentificarea a durat prea mult (30s). Verifică conexiunea și încearcă din nou.'
            : error instanceof Error
              ? error.message
              : 'Autentificarea a eșuat.';
        update((state) => ({ ...state, loading: false, error: message }));
        throw new Error(message);
      }
    },

    async register(payload: {
      username?: string;
      email: string;
      password: string;
      fullName?: string;
      phone?: string;
      newsletter?: boolean;
    }) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30_000),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error ?? 'Înregistrarea a eșuat.';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        await loadSession();
        return data;
      } catch (error) {
        const message =
          error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
            ? 'Înregistrarea a durat prea mult (30s). Verifică conexiunea și încearcă din nou.'
            : error instanceof Error
              ? error.message
              : 'Înregistrarea a eșuat.';
        update((state) => ({ ...state, loading: false, error: message }));
        throw new Error(message);
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
          const message = data?.error ?? 'Actualizarea profilului a eșuat.';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        await loadSession();
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Actualizarea profilului a eșuat.';
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
          const message = data?.error ?? 'Schimbarea parolei a eșuat.';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        update((state) => ({ ...state, loading: false, error: null }));
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Schimbarea parolei a eșuat.';
        update((state) => ({ ...state, loading: false, error: message }));
        throw error;
      }
    },

    async deleteAccount(payload: { currentPassword: string; confirmation: string }) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/api/user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error ?? 'Ștergerea contului a eșuat.';
          update((state) => ({ ...state, loading: false, error: message }));
          throw new Error(message);
        }

        set({ ...initialState, loading: false });
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ștergerea contului a eșuat.';
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
