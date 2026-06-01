import Redis from "ioredis";

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    const host = process.env.REDIS_HOST;
    if (host) {
        const port = process.env.REDIS_PORT ?? "6379";
        const password = process.env.REDIS_PASSWORD;
        const auth = password ? `:${encodeURIComponent(password)}@` : "";
        return `redis://${auth}${host}:${port}`;
    }
    throw new Error("REDIS_URL or REDIS_HOST is not defined");
};

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis =
    globalForRedis.redis ??
    new Redis(getRedisUrl(), {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
