import { json, type RequestEvent } from '@sveltejs/kit';

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();

function pruneExpiredBuckets(now = Date.now()) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function consume({ key, limit, windowMs }: RateLimitConfig) {
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

export function getClientIp(event: RequestEvent) {
  const forwarded = event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = event.request.headers.get('x-real-ip')?.trim();
  const cfIp = event.request.headers.get('cf-connecting-ip')?.trim();

  return forwarded || realIp || cfIp || event.getClientAddress();
}

export function rateLimit(event: RequestEvent, config: Omit<RateLimitConfig, 'key'> & { scope: string }) {
  const ip = getClientIp(event);
  const result = consume({
    key: `${config.scope}:${ip}`,
    limit: config.limit,
    windowMs: config.windowMs,
  });

  if (result.allowed) return null;

  return json(
    { error: 'Prea multe cereri. Te rugăm să încerci din nou mai târziu.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(config.limit),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}
