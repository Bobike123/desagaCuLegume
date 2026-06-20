const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export type Pagination = {
  page: number;
  limit: number;
  offset: number;
  to: number;
};

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export function getPagination(url: URL, options: PaginationOptions = {}): Pagination {
  const defaultLimit = options.defaultLimit ?? DEFAULT_PAGE_SIZE;
  const maxLimit = options.maxLimit ?? MAX_PAGE_SIZE;
  const page = parsePositiveInt(url.searchParams.get('page'), 1);
  const requestedLimit = parsePositiveInt(url.searchParams.get('limit'), defaultLimit);
  const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    to: offset + limit - 1,
  };
}

export function getPaginationMeta(pagination: Pagination, total: number | null | undefined) {
  const totalCount = typeof total === 'number' && Number.isFinite(total) ? total : null;

  return {
    page: pagination.page,
    limit: pagination.limit,
    total: totalCount,
    totalPages: totalCount == null ? null : Math.max(1, Math.ceil(totalCount / pagination.limit)),
    hasMore: totalCount == null ? null : pagination.offset + pagination.limit < totalCount,
  };
}

export function publicCacheHeaders(maxAgeSeconds = 60, staleSeconds = 300) {
  return {
    'Cache-Control': `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleSeconds}`,
  };
}

export const noStoreHeaders = {
  'Cache-Control': 'no-store',
};
