import { Redis } from '@upstash/redis';

const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// In-memory fallback for local development when Redis credentials are not provided
class InMemoryRedis {
  private store = new Map<string, { value: string; expiry: number | null }>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  }

  async set(
    key: string,
    value: any,
    options?: { ex?: number; px?: number }
  ): Promise<'OK' | null> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    let expiry: number | null = null;
    if (options?.ex) {
      expiry = Date.now() + options.ex * 1000;
    } else if (options?.px) {
      expiry = Date.now() + options.px;
    }
    this.store.set(key, { value: stringValue, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async incr(key: string): Promise<number> {
    const val = await this.get(key);
    const num = val ? Number(val) : 0;
    const nextVal = num + 1;
    await this.set(key, nextVal);
    return nextVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiry = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }
}

let redisClient: Redis | InMemoryRedis;

if (isRedisConfigured) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  });
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ Upstash Redis environment variables not configured. Falling back to in-memory store.'
    );
  }
  redisClient = new InMemoryRedis();
}

export default redisClient;
