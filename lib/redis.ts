import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Create a Redis client
// If env vars are missing, this might throw or fail silently depending on usage
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
});

export async function checkRateLimit(identifier: string) {
    if (!process.env.UPSTASH_REDIS_REST_URL) return { success: true }; // Bypass if not configured
    return await ratelimit.limit(identifier);
}

export default redis;
