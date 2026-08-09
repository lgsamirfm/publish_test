import crypto from "crypto";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasCompleteRedisConfig = Boolean(redisUrl && redisToken);
const hasPartialRedisConfig = Boolean(redisUrl || redisToken) && !hasCompleteRedisConfig;

const redis = hasCompleteRedisConfig
  ? new Redis({ url: redisUrl!, token: redisToken! })
  : null;

const redisLimiters = new Map<string, Ratelimit>();

function msToDuration(ms: number): Duration {
  if (ms < 1000) return "1 s" as Duration;
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} s` as Duration;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} m` as Duration;
  const hours = Math.ceil(minutes / 60);
  return `${hours} h` as Duration;
}

class MemoryRateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  private lastPurge = Date.now();

  private purge(now: number) {
    if (now - this.lastPurge < 5 * 60_000) return;
    this.lastPurge = now;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }

  limit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    this.purge(now);

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;

    return {
      success: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: bucket.resetAt,
      limit,
    };
  }
}

const memoryLimiter = new MemoryRateLimiter();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Distributed rate limiting is unavailable");
    this.name = "RateLimitUnavailableError";
  }
}

function privacyPreservingKey(key: string) {
  // Avoid storing raw phone numbers/IP addresses in Redis keys.
  return crypto.createHash("sha256").update(key).digest("hex");
}

function productionMemoryFallbackAllowed() {
  return process.env.RATE_LIMIT_ALLOW_MEMORY === "true";
}

/**
 * Distributed fixed-window limiter. Production fails closed when Redis is not
 * configured or unavailable, unless the operator explicitly confirms a
 * single-instance deployment with RATE_LIMIT_ALLOW_MEMORY=true.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const safeKey = privacyPreservingKey(key);

  if (redis) {
    const cacheKey = `${limit}:${windowMs}`;
    let limiter = redisLimiters.get(cacheKey);
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(limit, msToDuration(windowMs)),
        prefix: `bafkhaneh:ratelimit:${limit}:${windowMs}`,
        analytics: false,
      });
      redisLimiters.set(cacheKey, limiter);
    }

    try {
      const result = await limiter.limit(safeKey);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        limit: result.limit,
      };
    } catch (error) {
      console.error("[rate-limit] Redis request failed", error);
      if (
        process.env.NODE_ENV === "production" &&
        !productionMemoryFallbackAllowed()
      ) {
        throw new RateLimitUnavailableError();
      }
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    (!productionMemoryFallbackAllowed() || hasPartialRedisConfig)
  ) {
    throw new RateLimitUnavailableError();
  }

  return memoryLimiter.limit(safeKey, limit, windowMs);
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(
      Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
    ),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
