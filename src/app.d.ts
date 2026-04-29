import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface UserSession {
      id: number;
      email: string;
      username: string;
      fullName: string | null;
      phone: string | null;
      status: string;
    }

    interface SessionState {
      sessionId: string;
      user: UserSession;
      isAdmin: boolean;
      roles: string[];
    }

    interface Locals {
      supabase: SupabaseClient;
      isAdmin: boolean;
      isAuthenticated: boolean;
      user: UserSession | null;
      session: SessionState | null;
    }
  }

  interface Window {
    bootstrap?: any;
  }
}

export {};
