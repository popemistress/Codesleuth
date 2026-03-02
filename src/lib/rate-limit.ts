import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

interface RateLimitConfig {
    limit: number;
    windowInSeconds: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number;
}

const defaultConfig: RateLimitConfig = {
    limit: 60,
    windowInSeconds: 60,
};

/**
 * Rate limit using Redis sliding window
 */
export async function rateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
    const { limit, windowInSeconds } = { ...defaultConfig, ...config };
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowInSeconds * 1000;

    try {
        // Use Redis sorted set for sliding window
        const pipeline = redis.pipeline();

        // Remove old entries
        pipeline.zremrangebyscore(key, 0, windowStart);
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        // Count requests in window
        pipeline.zcard(key);
        // Set expiration
        pipeline.expire(key, windowInSeconds);

        const results = await pipeline.exec();

        // Get the count from zcard result
        const count = results?.[2]?.[1] as number || 0;
        const remaining = Math.max(0, limit - count);
        const reset = Math.floor((windowStart + windowInSeconds * 1000) / 1000);

        return {
            success: count <= limit,
            remaining,
            reset,
        };
    } catch (error) {
        console.error("Rate limit error:", error);
        // Allow request if Redis fails
        return { success: true, remaining: limit, reset: 0 };
    }
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Headers {
    const headers = new Headers();
    headers.set("X-RateLimit-Remaining", result.remaining.toString());
    headers.set("X-RateLimit-Reset", result.reset.toString());
    return headers;
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
    req: Request,
    config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult & { response?: NextResponse }> {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0] || "unknown";

    const result = await rateLimit(ip, config);

    if (!result.success) {
        const response = NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Remaining": result.remaining.toString(),
                    "X-RateLimit-Reset": result.reset.toString(),
                    "Retry-After": Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
                },
            }
        );
        return { ...result, response };
    }

    return result;
}
