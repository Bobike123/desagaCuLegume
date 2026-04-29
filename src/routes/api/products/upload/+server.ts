import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function safeFileName(name: string) {
  const clean = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return clean || 'upload';
}

function errorMessage(error: unknown, fallback = 'Upload failed') {
  if (error instanceof Error && error.message) return error.message;

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

export async function POST(event: RequestEvent) {
  if (!event.locals.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await event.request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size <= 0) {
      return json({ error: 'File is empty' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: 'Invalid file type. Only JPEG, PNG, WebP allowed' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);

    if (!data.publicUrl) {
      return json({ error: 'Upload succeeded but no public URL was returned' }, { status: 500 });
    }

    return json({ url: data.publicUrl }, { status: 200 });
  } catch (error) {
    console.error('Product image upload failed', error);
    return json({ error: errorMessage(error) }, { status: 500 });
  }
}