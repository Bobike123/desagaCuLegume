import { describe, expect, it } from 'vitest';
import { getPagination, getPaginationMeta, publicCacheHeaders, noStoreHeaders } from './pagination';

function url(params: Record<string, string> = {}) {
  const u = new URL('https://desagaculegume.ro/api/test');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u;
}

describe('getPagination', () => {
  it('returns page 1, default limit when no params given', () => {
    const p = getPagination(url());
    expect(p.page).toBe(1);
    expect(p.limit).toBe(50);
    expect(p.offset).toBe(0);
  });

  it('computes offset for page 2', () => {
    const p = getPagination(url({ page: '2', limit: '10' }));
    expect(p.page).toBe(2);
    expect(p.offset).toBe(10);
    expect(p.to).toBe(19);
  });

  it('clamps limit to MAX_PAGE_SIZE (100)', () => {
    const p = getPagination(url({ limit: '500' }));
    expect(p.limit).toBe(100);
  });

  it('clamps limit to 1 minimum', () => {
    const p = getPagination(url({ limit: '0' }));
    expect(p.limit).toBe(50);
  });

  it('uses default limit for negative limit', () => {
    const p = getPagination(url({ limit: '-5' }));
    expect(p.limit).toBe(50);
  });

  it('uses default page for invalid page string', () => {
    const p = getPagination(url({ page: 'abc' }));
    expect(p.page).toBe(1);
  });

  it('uses page 1 for zero page', () => {
    const p = getPagination(url({ page: '0' }));
    expect(p.page).toBe(1);
  });

  it('uses page 1 for negative page', () => {
    const p = getPagination(url({ page: '-3' }));
    expect(p.page).toBe(1);
  });

  it('floors decimal page', () => {
    const p = getPagination(url({ page: '2.9' }));
    expect(p.page).toBe(2);
  });

  it('respects defaultLimit option', () => {
    const p = getPagination(url(), { defaultLimit: 20 });
    expect(p.limit).toBe(20);
  });

  it('respects maxLimit option', () => {
    const p = getPagination(url({ limit: '200' }), { maxLimit: 50 });
    expect(p.limit).toBe(50);
  });
});

describe('getPaginationMeta', () => {
  const base = { page: 1, limit: 10, offset: 0, to: 9 };

  it('computes totalPages and hasMore correctly', () => {
    const meta = getPaginationMeta(base, 25);
    expect(meta.total).toBe(25);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasMore).toBe(true);
  });

  it('hasMore is false on last page', () => {
    const meta = getPaginationMeta({ page: 3, limit: 10, offset: 20, to: 29 }, 25);
    expect(meta.hasMore).toBe(false);
  });

  it('totalPages is 1 for zero total', () => {
    const meta = getPaginationMeta(base, 0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasMore).toBe(false);
  });

  it('returns null total/totalPages/hasMore for null input', () => {
    const meta = getPaginationMeta(base, null);
    expect(meta.total).toBeNull();
    expect(meta.totalPages).toBeNull();
    expect(meta.hasMore).toBeNull();
  });

  it('returns null total/totalPages/hasMore for undefined input', () => {
    const meta = getPaginationMeta(base, undefined);
    expect(meta.total).toBeNull();
    expect(meta.totalPages).toBeNull();
  });

  it('returns null for non-finite total', () => {
    const meta = getPaginationMeta(base, Infinity);
    expect(meta.total).toBeNull();
  });
});

describe('cache headers', () => {
  it('publicCacheHeaders includes max-age', () => {
    const h = publicCacheHeaders(30, 120);
    expect(h['Cache-Control']).toContain('max-age=30');
    expect(h['Cache-Control']).toContain('stale-while-revalidate=120');
  });

  it('noStoreHeaders is no-store', () => {
    expect(noStoreHeaders['Cache-Control']).toBe('no-store');
  });
});
