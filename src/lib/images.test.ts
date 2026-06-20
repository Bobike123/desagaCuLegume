import { describe, expect, it } from 'vitest';
import { fallbackImage, optimizedImageUrl, PLACEHOLDER_IMAGE } from './images';

// ─── fallbackImage ────────────────────────────────────────────────────────────

describe('fallbackImage', () => {
  function makeImgEvent(src: string) {
    const img = { src } as HTMLImageElement;
    return { currentTarget: img } as unknown as Event;
  }

  it('sets src to the placeholder when image fails to load', () => {
    const event = makeImgEvent('https://example.com/broken.jpg');
    fallbackImage(event);
    expect((event.currentTarget as HTMLImageElement).src).toBe(PLACEHOLDER_IMAGE);
  });

  it('does not change src when it is already the placeholder (idempotent)', () => {
    const event = makeImgEvent(PLACEHOLDER_IMAGE);
    fallbackImage(event);
    expect((event.currentTarget as HTMLImageElement).src).toBe(PLACEHOLDER_IMAGE);
  });

  it('replaces any non-placeholder src', () => {
    const event = makeImgEvent('https://cdn.example.com/img.webp');
    fallbackImage(event);
    expect((event.currentTarget as HTMLImageElement).src).toBe(PLACEHOLDER_IMAGE);
  });
});

// ─── optimizedImageUrl ────────────────────────────────────────────────────────

const SUPABASE_URL =
  'https://xyzabc.supabase.co/storage/v1/object/public/products/photo.jpg';

describe('optimizedImageUrl', () => {
  it('rewrites a Supabase storage URL to the render endpoint', () => {
    const result = optimizedImageUrl(SUPABASE_URL, { width: 400 });
    expect(result).toContain('/storage/v1/render/image/public/');
    expect(result).toContain('width=400');
  });

  it('appends quality defaulting to 76', () => {
    const result = optimizedImageUrl(SUPABASE_URL, { width: 400 });
    expect(result).toContain('quality=76');
  });

  it('uses provided quality when given', () => {
    const result = optimizedImageUrl(SUPABASE_URL, { width: 400, quality: 50 });
    expect(result).toContain('quality=50');
  });

  it('appends height when provided', () => {
    const result = optimizedImageUrl(SUPABASE_URL, { width: 400, height: 300 });
    expect(result).toContain('height=300');
  });

  it('does not append height when omitted', () => {
    const result = optimizedImageUrl(SUPABASE_URL, { width: 400 });
    expect(result).not.toContain('height=');
  });

  it('defaults resize to cover', () => {
    const result = optimizedImageUrl(SUPABASE_URL, { width: 400 });
    expect(result).toContain('resize=cover');
  });

  it('uses provided resize mode', () => {
    const result = optimizedImageUrl(SUPABASE_URL, { width: 400, resize: 'contain' });
    expect(result).toContain('resize=contain');
  });

  it('returns relative paths unchanged', () => {
    expect(optimizedImageUrl('/images/local.jpg', { width: 400 })).toBe('/images/local.jpg');
  });

  it('returns empty string for empty input', () => {
    expect(optimizedImageUrl('', { width: 400 })).toBe('');
  });

  it('returns whitespace-only input as empty string (trimmed)', () => {
    expect(optimizedImageUrl('   ', { width: 400 })).toBe('');
  });

  it('returns non-Supabase HTTPS URLs unchanged', () => {
    const url = 'https://cdn.other.com/image.jpg';
    expect(optimizedImageUrl(url, { width: 400 })).toBe(url);
  });

  it('returns malformed URLs unchanged (no crash)', () => {
    const bad = 'not a url at all ://??#';
    const result = optimizedImageUrl(bad, { width: 400 });
    expect(typeof result).toBe('string');
  });
});
