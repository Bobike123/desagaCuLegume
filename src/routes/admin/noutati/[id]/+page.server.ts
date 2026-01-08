// src/routes/admin/noutati/[id]/+page.server.ts
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";

const sbAdmin = () =>
    createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.isAdmin) {
        throw error(401, "Unauthorized");
    }

    const { data, error: dbError } = await sbAdmin()
        .from("noutati")
        .select("*")
        .eq("id", params.id)
        .single();

    if (dbError) {
        throw error(400, dbError.message);
    }

    return {
        item: data,
    };
};
