// FILE: src/app.d.ts

import type { SupabaseClient } from "@supabase/supabase-js";

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			isAdmin: boolean;
		}
	}

	interface Window {
		bootstrap?: any;
	}
}

export { };
