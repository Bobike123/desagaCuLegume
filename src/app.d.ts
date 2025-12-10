import type { Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			user: Session['user'] | null;
			session: Session | null;
		}
	}
}

export { };
