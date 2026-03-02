import { redis } from "@/lib/redis";

interface CacheOptions {
    ttl?: number; // Time to live in seconds
    prefix?: string;
}

const DEFAULT_TTL = 60 * 5; // 5 minutes

/**
 * Get cached data or fetch and cache it
 */
export async function getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { ttl = DEFAULT_TTL, prefix = "cache" } = options;
    const cacheKey = `${prefix}:${key}`;

    try {
        // Try to get from cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached) as T;
        }
    } catch (error) {
        console.error("Cache get error:", error);
    }

    // Fetch fresh data
    const data = await fetcher();

    try {
        // Store in cache
        await redis.setex(cacheKey, ttl, JSON.stringify(data));
    } catch (error) {
        console.error("Cache set error:", error);
    }

    return data;
}

/**
 * Invalidate cache by key
 */
export async function invalidate(key: string, prefix = "cache"): Promise<void> {
    const cacheKey = `${prefix}:${key}`;
    try {
        await redis.del(cacheKey);
    } catch (error) {
        console.error("Cache invalidate error:", error);
    }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error("Cache invalidate pattern error:", error);
    }
}

/**
 * Simple memoization with Redis for expensive operations
 */
export function createCachedFetcher<TArgs extends unknown[], TResult>(
    keyGenerator: (...args: TArgs) => string,
    fetcher: (...args: TArgs) => Promise<TResult>,
    options: CacheOptions = {}
) {
    return async (...args: TArgs): Promise<TResult> => {
        const key = keyGenerator(...args);
        return getOrSet(key, () => fetcher(...args), options);
    };
}
