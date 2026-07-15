/**
 * Global fallback image, served from the editable static images folder.
 * See `static/images/README.md`. Change the file at this path to swap it
 * site-wide - no code change needed.
 */
export const PLACEHOLDER_IMAGE = '/images/shared/placeholder.png';

export function fallbackImage(event: Event) {
  const img = event.currentTarget as HTMLImageElement;
  if (!img.src.endsWith(PLACEHOLDER_IMAGE)) img.src = PLACEHOLDER_IMAGE;
}

type ImageTransformOptions = {
  width: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain';
};

export function optimizedImageUrl(rawUrl: string, options: ImageTransformOptions) {
  const url = rawUrl.trim();
  if (!url || url.startsWith('/')) return url;

  try {
    const parsed = new URL(url);
    const marker = '/storage/v1/object/public/';
    if (!parsed.pathname.includes(marker)) return url;

    parsed.pathname = parsed.pathname.replace(marker, '/storage/v1/render/image/public/');
    parsed.searchParams.set('width', String(options.width));
    if (options.height) parsed.searchParams.set('height', String(options.height));
    parsed.searchParams.set('quality', String(options.quality ?? 76));
    parsed.searchParams.set('resize', options.resize ?? 'cover');
    return parsed.toString();
  } catch {
    return url;
  }
}
