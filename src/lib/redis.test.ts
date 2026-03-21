import { describe, it, expect, vi } from 'vitest'

// Mock @upstash/redis — simulate no Redis connection
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}))

// Must import after mock
import { checkRateLimit, getCachedData, CACHE_KEYS, CACHE_TTL } from './redis'

describe('Redis (no connection — graceful fallback)', () => {
  describe('checkRateLimit', () => {
    it('allows all requests when Redis is unavailable', async () => {
      const result = await checkRateLimit('test:127.0.0.1', 10, 60)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(10)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it('uses default limit of 60', async () => {
      const result = await checkRateLimit('test:key')

      expect(result.remaining).toBe(60)
    })
  })

  describe('getCachedData', () => {
    it('falls back to fetcher when Redis is unavailable', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' })

      const result = await getCachedData('test-key', fetcher)

      expect(fetcher).toHaveBeenCalledOnce()
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('constants', () => {
    it('has correct cache key prefixes', () => {
      expect(CACHE_KEYS.RATE_LIMIT).toBe('rate_limit')
      expect(CACHE_KEYS.SLOTS).toBe('slots')
      expect(CACHE_KEYS.SESSION).toBe('session')
    })

    it('has correct TTL values', () => {
      expect(CACHE_TTL.RATE_LIMIT).toBe(60)
      expect(CACHE_TTL.SLOTS).toBe(60)
      expect(CACHE_TTL.SESSION).toBe(86400)
    })
  })
})
