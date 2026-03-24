import { Redis } from '@upstash/redis'

// Redis URL/Token: support both Vercel KV (KV_REST_API_*) and Upstash direct (UPSTASH_REDIS_REST_*)
const redisUrl =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const redisToken =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

// Initialize Redis client (null when env vars are missing — all functions degrade gracefully)
const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null

export { redis }

// Cache key prefixes
export const CACHE_KEYS = {
  SLOTS: 'slots',
  ANALYTICS: 'analytics',
  RATE_LIMIT: 'rate_limit',
  SESSION: 'session',
} as const

// Default TTL values in seconds
export const CACHE_TTL = {
  SLOTS: 60, // 1 minute - slots change frequently
  ANALYTICS: 300, // 5 minutes
  SESSION: 86400, // 24 hours
  RATE_LIMIT: 60, // 1 minute window
} as const

/**
 * Get cached data or fetch and cache it.
 * Falls back to direct fetch when Redis is unavailable.
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  if (!redis) return fetcher()

  try {
    const cached = await redis.get<T>(key)
    if (cached !== null) return cached

    const data = await fetcher()
    await redis.set(key, data, { ex: ttl })
    return data
  } catch (error) {
    console.error('[Redis] Cache error:', error)
    return fetcher()
  }
}

/**
 * Invalidate cache by key.
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch (error) {
    console.error('[Redis] Invalidate error:', error)
  }
}

/**
 * Rate limiting using Redis.
 * Always allows requests when Redis is unavailable.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const fallback = {
    allowed: true,
    remaining: limit,
    resetAt: Date.now() + windowSeconds * 1000,
  }
  if (!redis) return fallback

  const key = `${CACHE_KEYS.RATE_LIMIT}:${identifier}`

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    const ttl = await redis.ttl(key)
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000)

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    }
  } catch (error) {
    console.error('[Redis] Rate limit error:', error)
    return fallback
  }
}

/**
 * Store session data.
 */
export async function setSession(
  sessionId: string,
  data: Record<string, unknown>,
  ttl: number = CACHE_TTL.SESSION
): Promise<void> {
  if (!redis) return
  const key = `${CACHE_KEYS.SESSION}:${sessionId}`
  await redis.set(key, data, { ex: ttl })
}

/**
 * Get session data.
 */
export async function getSession<T = Record<string, unknown>>(
  sessionId: string
): Promise<T | null> {
  if (!redis) return null
  const key = `${CACHE_KEYS.SESSION}:${sessionId}`
  return redis.get<T>(key)
}

/**
 * Delete session.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  if (!redis) return
  const key = `${CACHE_KEYS.SESSION}:${sessionId}`
  await redis.del(key)
}

export interface CacheStats {
  connected: boolean
  latencyMs: number
  keyCount: number | null
  memoryUsage: string | null
}

/**
 * Gather basic cache health metrics for monitoring.
 * Returns connection status, round-trip latency, approximate key count
 * and memory usage (when available via Upstash INFO).
 */
export async function getCacheStats(): Promise<CacheStats> {
  if (!redis) {
    return {
      connected: false,
      latencyMs: -1,
      keyCount: null,
      memoryUsage: null,
    }
  }

  const start = performance.now()
  try {
    await redis.ping()
    const latencyMs = Math.round(performance.now() - start)

    let keyCount: number | null = null
    let memoryUsage: string | null = null
    try {
      keyCount = await redis.dbsize()
    } catch {
      /* Upstash may restrict DBSIZE on some plans */
    }
    try {
      const infoResult = await (
        redis as unknown as { info: (section: string) => Promise<string> }
      ).info('memory')
      const match = infoResult?.match?.(/used_memory_human:(\S+)/)
      memoryUsage = match?.[1] ?? null
    } catch {
      /* INFO may be unavailable on all Upstash plans */
    }

    return { connected: true, latencyMs, keyCount, memoryUsage }
  } catch {
    return {
      connected: false,
      latencyMs: Math.round(performance.now() - start),
      keyCount: null,
      memoryUsage: null,
    }
  }
}
