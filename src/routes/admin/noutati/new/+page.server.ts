import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseServer } from '$lib/api/supabase';
import { validateRequired, handleApiError } from '$lib/helpers';

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user) {
        throw redirect(303, '/admin/login');
    }
    return {};
};

export const actions: Actions = {
    default: async (event) => {
        try {
            if (!event.locals.user) {
                return {
                    success: false,
                    error: 'Unauthorized'
                };
            }

            const formData = await event.request.formData();
            const title = formData.get('title') as string;
            const content = formData.get('content') as string;
            const imageUrl = formData.get('imageUrl') as string;

            const missing = validateRequired({ title, content }, ['title', 'content']);
            if (missing.length > 0) {
                return {
                    success: false,
                    error: `Missing fields: ${missing.join(', ')}`
                };
            }

            const supabase = supabaseServer(event.locals.session?.access_token || '');

            const { data, error } = await supabase
                .from('noutati')
                .insert([
                    {
                        title,
                        content,
                        image_url: imageUrl || null,
                        date: new Date().toISOString(),
                        published: false
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: 'Noutate created successfully',
                noutate: data
            };
        } catch (err) {
            const errorData = handleApiError(err, 'Failed to create noutate');
            return {
                success: false,
                error: errorData.error
            };
        }
    }
};
