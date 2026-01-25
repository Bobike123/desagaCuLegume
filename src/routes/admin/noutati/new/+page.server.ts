// FILE: src/routes/admin/noutati/new/+page.server.ts

// src/routes/admin/noutati/new/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { validateRequired, handleApiError } from "$lib/helpers";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.isAdmin) throw redirect(303, "/admin/login");
    return {};
};

export const actions: Actions = {
    default: async ({ locals, request }) => {
        try {
            if (!locals.isAdmin) {
                return { success: false, error: "Unauthorized" };
            }

            const formData = await request.formData();
            const title = formData.get("title") as string | null;
            const content = formData.get("content") as string | null;
            const imageUrl = formData.get("imageUrl") as string | null;

            const missing = validateRequired(
                { title: title ?? "", content: content ?? "" },
                ["title", "content"]
            );
            if (missing.length > 0) {
                return {
                    success: false,
                    error: `Missing fields: ${missing.join(", ")} `,
                };
            }

            const supabase = locals.supabase;

            const { data, error } = await supabase
                .from("noutati")
                .insert({
                    title: title?.trim(),
                    content: content?.trim(),
                    image_url: imageUrl?.trim() || null,
                })
                .select()
                .single();

            if (error) return { success: false, error: error.message };

            return { success: true, item: data };
        } catch (error) {
            const err = handleApiError(error, "Create failed");
            return { success: false, error: err.error };
        }
    },
};
