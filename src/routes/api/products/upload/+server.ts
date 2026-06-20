import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { Buffer } from 'node:buffer';
import { createAdminClient } from '$lib/server/supabase';
import { RequestValidationError } from '$lib/server/validation';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 180;
const MAX_IMAGE_EDGE = 6000;
const MAX_IMAGE_PIXELS = 30_000_000;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_STORAGE_FOLDERS = new Set(['products', 'events']);

type ImageInfo = {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  width: number;
  height: number;
};

function safeFileName(name: string) {
  const clean = name
    .trim()
    .slice(0, MAX_FILE_NAME_LENGTH)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return clean || 'upload';
}

function readUInt24LE(buffer: Buffer, offset: number) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

function parsePng(buffer: Buffer): ImageInfo | null {
  if (buffer.length < 24) return null;
  if (!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return null;
  }

  return {
    mime: 'image/png',
    extension: 'png',
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJpeg(buffer: Buffer): ImageInfo | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break;
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (offset + 2 > buffer.length) break;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) break;

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame && segmentLength >= 7) {
      return {
        mime: 'image/jpeg',
        extension: 'jpg',
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function parseWebp(buffer: Buffer): ImageInfo | null {
  if (
    buffer.length < 30 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null;
  }

  const chunk = buffer.toString('ascii', 12, 16);

  if (chunk === 'VP8X' && buffer.length >= 30) {
    return {
      mime: 'image/webp',
      extension: 'webp',
      width: readUInt24LE(buffer, 24) + 1,
      height: readUInt24LE(buffer, 27) + 1,
    };
  }

  if (chunk === 'VP8 ' && buffer.length >= 30) {
    return {
      mime: 'image/webp',
      extension: 'webp',
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunk === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];

    return {
      mime: 'image/webp',
      extension: 'webp',
      width: 1 + b1 + ((b2 & 0x3f) << 8),
      height: 1 + ((b2 >> 6) | (b3 << 2) | ((b4 & 0x0f) << 10)),
    };
  }

  return null;
}

function detectImage(buffer: Buffer): ImageInfo | null {
  return parsePng(buffer) ?? parseJpeg(buffer) ?? parseWebp(buffer);
}

function validateImage(file: File, buffer: Buffer) {
  const info = detectImage(buffer);
  if (!info || !ALLOWED_TYPES.has(info.mime)) {
    throw new RequestValidationError('Fișier imagine invalid. Sunt permise doar imagini reale JPEG, PNG și WebP.');
  }

  if (file.type && file.type !== info.mime) {
    throw new RequestValidationError('Tipul MIME nu corespunde conținutului imaginii încărcate.');
  }

  if (info.width < 1 || info.height < 1) {
    throw new RequestValidationError('Dimensiunile imaginii nu au putut fi citite.');
  }

  if (info.width > MAX_IMAGE_EDGE || info.height > MAX_IMAGE_EDGE) {
    throw new RequestValidationError(`Dimensiunile imaginii sunt prea mari (maxim ${MAX_IMAGE_EDGE}px pe fiecare latură).`);
  }

  if (info.width * info.height > MAX_IMAGE_PIXELS) {
    throw new RequestValidationError('Imaginea are prea mulți pixeli pentru grila de produse.');
  }

  return info;
}

function storageFolderFromValue(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return 'products';
  const folder = value.trim().toLowerCase();
  return ALLOWED_STORAGE_FOLDERS.has(folder) ? folder : 'products';
}

export async function POST(event: RequestEvent) {
  if (!event.locals.isAdmin) {
    return json({ error: 'Acces neautorizat.' }, { status: 401 });
  }

  try {
    const formData = await event.request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return json({ error: 'Nu a fost trimis niciun fișier.' }, { status: 400 });
    }

    if (file.size <= 0) {
      return json({ error: 'Fișierul este gol.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return json({ error: 'Fișierul este prea mare (maxim 10MB).' }, { status: 400 });
    }

    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return json({ error: 'Tip de fișier invalid. Sunt permise doar JPEG, PNG și WebP.' }, { status: 400 });
    }

    if (file.name.length > MAX_FILE_NAME_LENGTH) {
      return json({ error: 'Numele fișierului este prea lung.' }, { status: 400 });
    }

    const storageFolder = storageFolderFromValue(formData.get('folder'));
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = validateImage(file, buffer);
    const supabase = createAdminClient();
    const baseName = safeFileName(file.name).replace(/\.[a-z0-9]+$/i, '');
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${baseName}.${image.extension}`;
    const filePath = `${storageFolder}/${new Date().toISOString().slice(0, 10)}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, buffer, {
      cacheControl: '31536000',
      upsert: false,
      contentType: image.mime,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);

    if (!data.publicUrl) {
      return json({ error: 'Încărcarea a reușit, dar nu am primit URL-ul public.' }, { status: 500 });
    }

    return json({ url: data.publicUrl, width: image.width, height: image.height }, { status: 200 });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return json({ error: error.message }, { status: error.status });
    }

    console.error('Product image upload failed', error);
    return json({ error: 'Încărcarea a eșuat.' }, { status: 500 });
  }
}
