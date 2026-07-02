/**
 * Shared browser-side fetch wrapper: JSON handling, Content-Type defaulting
 * and uniform error normalization (server error message + requestId when the
 * API returned one). Replaces the fetch→json→!ok-throw block previously
 * duplicated across stores and pages.
 */
export class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

type ApiFetchOptions = RequestInit & { fallbackError?: string };

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { fallbackError, ...init } = options;
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> | null;

  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : (fallbackError ?? 'Cererea a eșuat.');
    const requestId = typeof data?.requestId === 'string' ? data.requestId : undefined;
    throw new ApiError(message, res.status, requestId);
  }

  return data as T;
}
