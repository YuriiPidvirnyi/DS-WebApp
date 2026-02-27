'use server'

import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

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
 * Get cached data or fetch and cache it
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetcher()

    // Cache the result
    await redis.set(key, data, { ex: ttl })

    return data
  } catch (error) {
    console.error('[Redis] Cache error:', error)
    // Fallback to direct fetch on cache error
    return fetcher()
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('[Redis] Invalidate error:', error)
  }
}

/**
 * Rate limiting using Redis
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${CACHE_KEYS.RATE_LIMIT}:${identifier}`
  
  try {
    const current = await redis.incr(key)
    
    // Set expiry on first request
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
    // Allow on error to prevent blocking legitimate requests
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 }
  }
}

/**
 * Store session data
 */
export async function setSession(
  sessionId: string,
  data: Record<string, unknown>,
  ttl: number = CACHE_TTL.SESSION
): Promise<void> {
  const key = `${CACHE_KEYS.SESSION}:${sessionId}`
  await redis.set(key, data, { ex: ttl })
}

/**
 * Get session data
 */
export async function getSession<T = Record<string, unknown>>(
  sessionId: string
): Promise<T | null> {
  const key = `${CACHE_KEYS.SESSION}:${sessionId}`
  return redis.get<T>(key)
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `${CACHE_KEYS.SESSION}:${sessionId}`
  await redis.del(key)
}
