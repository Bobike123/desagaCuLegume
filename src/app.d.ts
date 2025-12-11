import { type SupabaseClient, type Session, type User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			getSession(): Promise<Session | null>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session: Session | null;
		}
	}
}

export { };
