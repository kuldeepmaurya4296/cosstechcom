import { Ratelimit } from "@upstash/ratelimit";
import redisClient from "./redis";

// Check if redisClient is the real Upstash Redis client (has the config or class check)
const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Local in-memory sliding window store for fallback
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const localStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function localCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of localStore) {
    if (now > entry.resetTime) {
      localStore.delete(key);
    }
  }
}

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // in seconds
}

// Instantiate Upstash Ratelimit if configured
let ratelimitInstance: Ratelimit | null = null;
if (isRedisConfigured && (redisClient as any).url) {
  ratelimitInstance = new Ratelimit({
    redis: redisClient as any,
    // default/fallback limiter, we can customize per call, but we'll instantiate a default one
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
  });
}

const ratelimitInstances = new Map<string, Ratelimit>();
const ephemeralCaches = new Map<string, Map<any, any>>();

/**
 * Universal rate limit function. Uses Upstash Redis rate limiting if configured,
 * otherwise falls back to local in-memory sliding window rate limiting.
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowSeconds: 60 }
): Promise<RateLimitResult> {
  const cacheKey = `ratelimit:${identifier}:${options.limit}:${options.windowSeconds}`;

  if (isRedisConfigured && ratelimitInstance) {
    try {
      const configKey = `${options.limit}:${options.windowSeconds}`;
      let customRatelimit = ratelimitInstances.get(configKey);
      if (!customRatelimit) {
        let cache = ephemeralCaches.get(configKey);
        if (!cache) {
          cache = new Map();
          ephemeralCaches.set(configKey, cache);
        }
        customRatelimit = new Ratelimit({
          redis: redisClient as any,
          limiter: Ratelimit.slidingWindow(options.limit, `${options.windowSeconds} s`),
          ephemeralCache: cache,
        });
        ratelimitInstances.set(configKey, customRatelimit);
      }
      
      const result = await customRatelimit.limit(cacheKey);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetIn: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (err) {
      console.error("Upstash Redis rate limit failed, falling back to local memory:", err);
    }
  }

  // Local In-Memory Fallback
  localCleanup();
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const entry = localStore.get(cacheKey);

  if (!entry || now > entry.resetTime) {
    localStore.set(cacheKey, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: options.limit - 1, resetIn: options.windowSeconds };
  }

  if (entry.count >= options.limit) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);
  return { allowed: true, remaining: options.limit - entry.count, resetIn };
}

/**
 * Extracts client IP from request headers (works with Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
