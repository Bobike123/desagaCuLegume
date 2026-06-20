import { json, type RequestEvent } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { createAdminClient } from '$lib/server/supabase';
import type { ConsumeRateLimitArgs, ConsumeRateLimitRow } from '$lib/server/rpc-contracts';

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
    if (!warnedAboutPersistentRateLimit) {
      warnedAboutPersistentRateLimit = true;
      console.warn(
        'Persistent Supabase rate limiting is unavailable; falling back to process-local limits. Run the provided SQL before production traffic.',
        error
      );
    }

    return null;
  }
}

export function getClientIp(event: RequestEvent) {
  const directIp = event.getClientAddress();
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return directIp;

  const candidates = [
    event.request.headers.get('cf-connecting-ip'),
    event.request.headers.get('x-real-ip'),
    event.request.headers.get('x-forwarded-for')?.split(',')[0],
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim().slice(0, 64);
    if (value && isIP(value)) return value;
  }

  return directIp;
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

export async function rateLimitKey(config: RateLimitConfig) {
  const result = await checkRateLimitKey(config);
  return rateLimitResponse(result, config.limit);
}

export async function identityRateLimit(
  identity: string,
  config: Omit<RateLimitConfig, 'key'> & { scope: string }
) {
  const normalizedIdentity = identity.trim().toLowerCase();
  if (!normalizedIdentity) return null;

  const identityHash = createHash('sha256').update(normalizedIdentity).digest('hex');
  return rateLimitKey({
    key: `${config.scope}:${identityHash}`,
    limit: config.limit,
    windowMs: config.windowMs,
  });
}
