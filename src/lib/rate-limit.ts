/**
 * Simple in-memory sliding-window rate limiter.
 * Uses a Map keyed by IP (or identifier) with timestamped request counts.
 * Not suitable for multi-instance deployments — use Upstash or Redis for production at scale.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until window resets
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowSeconds: 60 },
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    // New window
    store.set(identifier, { count: 1, resetTime: now + windowMs });
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
