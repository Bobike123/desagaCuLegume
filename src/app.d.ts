// src/app.d.ts
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			getSession: () => Promise<Session | null>;
			session: Session | null;
			user: User | null;
			isAdmin: boolean;
		}
	}

	interface Window {
		bootstrap?: any;
	}
}

export { };
