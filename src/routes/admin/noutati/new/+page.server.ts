// src/routes/admin/noutati/new/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validateRequired, handleApiError } from '$lib/helpers';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(303, '/admin/login');
    return { session: locals.session };
};

export const actions: Actions = {
    default: async ({ locals, request }) => {
        try {
            if (!locals.user) {
                return { success: false, error: 'Unauthorized' };
            }

            const formData = await request.formData();
            const title = formData.get('title') as string | null;
            const content = formData.get('content') as string | null;
            const imageUrl = formData.get('imageUrl') as string | null;

            const missing = validateRequired(
                { title: title ?? '', content: content ?? '' },
                ['title', 'content']
            );
            if (missing.length > 0) {
                return { success: false, error: `Missing fields: ${missing.join(', ')} ` };
            }

            const supabase = locals.supabase;

            const { data, error } = await supabase
                .from('noutati')
                .insert([
                    {
                        title: title!,
                        content: content!,
                        image_url: imageUrl || null,
                        date: new Date().toISOString(),
                        published: false
                    }
                ])
                .select('*')
                .single();

            if (error) throw error;

            return {
                success: true,
                message: 'Noutate created successfully',
                noutate: data
            };
        } catch (err) {
            const errorData = handleApiError(err, 'Failed to create noutate');
            return { success: false, error: errorData.error };
        }
    }
};

