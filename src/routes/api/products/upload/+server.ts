import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseServer } from '$lib/api/supabase';
import { handleApiError } from '$lib/helpers';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(event: RequestEvent) {
  try {
    if (!event.locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await event.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: 'Invalid file type. Only JPEG, PNG, WebP allowed' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return json({
      success: true,
      url: urlData.publicUrl,
      path: filePath
    }, { status: 200 });
  } catch (err) {
    const errorData = handleApiError(err, 'Failed to upload file');
    return json({ error: errorData.error }, { status: errorData.status });
  }
}
