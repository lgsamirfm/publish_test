import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Redis-backed rate limiter using Upstash.
 * Falls back to in-memory for local development without Redis credentials.
 */

// Initialize Redis client - only if credentials are provided
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Convert milliseconds to Upstash Duration string.
 * Upstash expects template literal types like "60 s", "1 m", "1 h", etc.
 * Duration = `${number} ms | s | m | h | d`
 */
function msToDuration(ms: number): Duration {
  if (ms < 1000) return "1 s" as Duration;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s` as Duration;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} m` as Duration;
  const hours = Math.round(minutes / 60);
  return `${hours} h` as Duration;
}

/**
 * In-memory fallback for local development (no Redis credentials).
 * Mirrors the original fixed-window implementation.
 */
class MemoryRateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  private lastPurge = Date.now();
  private readonly PURGE_INTERVAL = 5 * 60 * 1000;

  private purge() {
    const now = Date.now();
    if (now - this.lastPurge < this.PURGE_INTERVAL) return;
    this.lastPurge = now;
    for (const [k, b] of this.buckets) {
      if (b.resetAt <= now) this.buckets.delete(k);
    }
  }

  limit(key: string, limit: number, windowMs: number): RateLimitResult {
    this.purge();
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    const success = bucket.count <= limit;
    return {
      success,
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

/**
 * Rate limit a request.
 * Uses Upstash Redis if credentials are configured, otherwise falls back to in-memory.
 *
 * @param key - Unique identifier (e.g., "login-192.168.1.1")
 * @param limit - Max requests allowed in window
 * @param windowMs - Window size in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (redis) {
    // Use Upstash Redis-backed rate limiter
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(limit, msToDuration(windowMs)),
      prefix: "ratelimit",
    });

    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
      limit: result.limit,
    };
  }

  // Fallback to in-memory
  return memoryLimiter.limit(key, limit, windowMs);
}

/**
 * Generate standard rate limit headers for responses.
 */
export function rateLimitHeaders(res: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(res.limit),
    "X-RateLimit-Remaining": String(res.remaining),
    "X-RateLimit-Reset": String(Math.round(res.resetAt / 1000)),
  };
}