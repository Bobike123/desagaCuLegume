import { json, type RequestEvent } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { createAdminClient } from '$lib/server/supabase';
import type {
  ConsumeRateLimitArgs,
  ConsumeRateLimitRow,
  ConsumeRateLimitsArgs,
  ConsumeRateLimitsRow,
  PeekRateLimitArgs,
  PeekRateLimitRow,
  ResetRateLimitArgs,
} from '$lib/server/rpc-contracts';

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, Bucket>();
let warnedAboutPersistentRateLimit = false;
const MAX_IN_MEMORY_BUCKETS = 10_000;

function pruneExpiredBuckets(now = Date.now()) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size <= MAX_IN_MEMORY_BUCKETS) return;

  const entries = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  const overflow = buckets.size - MAX_IN_MEMORY_BUCKETS;
  for (let index = 0; index < overflow; index += 1) {
    buckets.delete(entries[index][0]);
  }
}

function consumeInMemory({ key, limit, windowMs }: RateLimitConfig): RateLimitDecision {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: 0,
  };
}

function warnPersistentUnavailableOnce(error: unknown) {
  if (warnedAboutPersistentRateLimit) return;
  warnedAboutPersistentRateLimit = true;
  console.warn(
    'Persistent Supabase rate limiting is unavailable; falling back to process-local limits. Run the provided SQL before production traffic.',
    error
  );
}

async function consumePersistent({ key, limit, windowMs }: RateLimitConfig): Promise<RateLimitDecision | null> {
  try {
    const { data, error } = await createAdminClient().rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    } satisfies ConsumeRateLimitArgs);

    if (error) throw error;

    const row = (Array.isArray(data) ? data[0] : data) as ConsumeRateLimitRow | null;
    if (!row) return null;

    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
    };
  } catch (error) {
    warnPersistentUnavailableOnce(error);
    return null;
  }
}

// One trusted header per deployment. Vercel overwrites x-real-ip but passes
// cf-connecting-ip through untouched, so trusting a header list lets clients
// spoof their IP — the selector must match the actual proxy in front.
const TRUSTED_PROXY_IP_HEADERS: Record<string, string> = {
  vercel: 'x-real-ip',
  cloudflare: 'cf-connecting-ip',
};

export function trustedIpFromHeaders(headers: Headers) {
  const proxy = (process.env.TRUSTED_PROXY ?? '').trim().toLowerCase();
  const headerName = TRUSTED_PROXY_IP_HEADERS[proxy];
  if (!headerName) return null;

  const value = headers.get(headerName)?.trim().slice(0, 64);
  return value && isIP(value) ? value : null;
}

export function getClientIp(event: RequestEvent) {
  const trusted = trustedIpFromHeaders(event.request.headers);
  if (trusted) return trusted;

  // The dev server (and some proxy setups) cannot always resolve the socket
  // address; SvelteKit then throws. A shared fallback bucket beats a 500.
  try {
    return event.getClientAddress();
  } catch {
    return 'unknown';
  }
}

export async function checkRateLimit(
  event: RequestEvent,
  config: Omit<RateLimitConfig, 'key'> & { scope: string }
) {
  const ip = getClientIp(event);
  const key = `${config.scope}:${ip}`;
  return checkRateLimitKey({
    key,
    limit: config.limit,
    windowMs: config.windowMs,
  });
}

export async function checkRateLimitKey(config: RateLimitConfig) {
  const persistentResult = await consumePersistent({
    key: config.key,
    limit: config.limit,
    windowMs: config.windowMs,
  });
  const result =
    persistentResult ??
    consumeInMemory({
      key: config.key,
      limit: config.limit,
      windowMs: config.windowMs,
    });

  return result;
}

function rateLimitResponse(result: RateLimitDecision, limit: number) {
  if (result.allowed) return null;

  return json(
    { error: 'Prea multe cereri. Te rugăm să încerci din nou mai târziu.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

export async function rateLimit(event: RequestEvent, config: Omit<RateLimitConfig, 'key'> & { scope: string }) {
  const result = await checkRateLimit(event, config);
  return rateLimitResponse(result, config.limit);
}

export type ScopedRateLimitConfig = Omit<RateLimitConfig, 'key'> & { scope: string };

async function consumeManyPersistent(checks: RateLimitConfig[]): Promise<Map<string, RateLimitDecision> | null> {
  try {
    const { data, error } = await createAdminClient().rpc('consume_rate_limits', {
      p_checks: checks.map((check) => ({
        key: check.key,
        limit: check.limit,
        window_seconds: Math.max(1, Math.ceil(check.windowMs / 1000)),
      })),
    } satisfies ConsumeRateLimitsArgs);

    if (error) throw error;

    const rows = (Array.isArray(data) ? data : []) as ConsumeRateLimitsRow[];
    if (rows.length !== checks.length) return null;

    const byKey = new Map<string, RateLimitDecision>();
    for (const row of rows) {
      byKey.set(String(row.key), {
        allowed: Boolean(row.allowed),
        remaining: Number(row.remaining ?? 0),
        retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
      });
    }
    return byKey;
  } catch (error) {
    warnPersistentUnavailableOnce(error);
    return null;
  }
}

// Consumes several scopes for the same client in ONE Supabase round-trip
// (consume_rate_limits RPC); the sequential single-scope calls in the request
// envelope used to cost 2-3 round-trips per request. Returns the 429 response
// for the first violated scope, or null when all pass.
export async function rateLimitMany(event: RequestEvent, configs: ScopedRateLimitConfig[]) {
  if (configs.length === 0) return null;

  const ip = getClientIp(event);
  const checks = configs.map((config) => ({
    key: `${config.scope}:${ip}`,
    limit: config.limit,
    windowMs: config.windowMs,
  }));

  const persistent = await consumeManyPersistent(checks);

  for (const check of checks) {
    const decision = persistent?.get(check.key) ?? consumeInMemory(check);
    const response = rateLimitResponse(decision, check.limit);
    if (response) return response;
  }

  return null;
}

export async function rateLimitKey(config: RateLimitConfig) {
  const result = await checkRateLimitKey(config);
  return rateLimitResponse(result, config.limit);
}

export function identityRateLimitKey(scope: string, identity: string) {
  const normalizedIdentity = identity.trim().toLowerCase();
  if (!normalizedIdentity) return null;

  const identityHash = createHash('sha256').update(normalizedIdentity).digest('hex');
  return `${scope}:${identityHash}`;
}

export async function identityRateLimit(
  identity: string,
  config: Omit<RateLimitConfig, 'key'> & { scope: string }
) {
  const key = identityRateLimitKey(config.scope, identity);
  if (!key) return null;

  return rateLimitKey({
    key,
    limit: config.limit,
    windowMs: config.windowMs,
  });
}

export type RateLimitPeek = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function peekInMemory(key: string, limit: number, now = Date.now()): RateLimitPeek {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) return { allowed: true, retryAfterSeconds: 0 };

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

// Read-only check: reports whether the next consume would be allowed without
// incrementing any counter. Used by the login lockout.
export async function peekRateLimitKey(key: string, limit: number): Promise<RateLimitPeek> {
  try {
    const { data, error } = await createAdminClient().rpc('peek_rate_limit', {
      p_key: key,
      p_limit: limit,
    } satisfies PeekRateLimitArgs);

    if (error) throw error;

    const row = (Array.isArray(data) ? data[0] : data) as PeekRateLimitRow | null;
    if (!row) return peekInMemory(key, limit);

    return {
      allowed: Boolean(row.allowed),
      retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
    };
  } catch (error) {
    warnPersistentUnavailableOnce(error);
    return peekInMemory(key, limit);
  }
}

// Clears a counter (e.g. login failures after a successful login). Always
// clears the in-memory bucket too so the fallback path stays consistent.
export async function resetRateLimitKey(key: string) {
  buckets.delete(key);

  try {
    const { error } = await createAdminClient().rpc('reset_rate_limit', {
      p_key: key,
    } satisfies ResetRateLimitArgs);

    if (error) throw error;
  } catch (error) {
    warnPersistentUnavailableOnce(error);
  }
}
