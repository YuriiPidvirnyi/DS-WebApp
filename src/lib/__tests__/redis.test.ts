import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the @upstash/redis module
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  })),
}))

// Import after mocking
import {
  getCachedData,
  invalidateCache,
  checkRateLimit,
  setSession,
  getSession,
  deleteSession,
  CACHE_KEYS,
  CACHE_TTL,
} from '../redis'
import { Redis } from '@upstash/redis'

describe('Redis Cache Utility', () => {
  let mockRedis: ReturnType<typeof vi.mocked<InstanceType<typeof Redis>>>

  beforeEach(() => {
    vi.clearAllMocks()
    // Get the mocked instance
    mockRedis = vi.mocked(new Redis({ url: '', token: '' }))
  })

  describe('CACHE_KEYS', () => {
    it('should have correct key prefixes', () => {
      expect(CACHE_KEYS.SLOTS).toBe('slots')
      expect(CACHE_KEYS.ANALYTICS).toBe('analytics')
      expect(CACHE_KEYS.RATE_LIMIT).toBe('rate_limit')
      expect(CACHE_KEYS.SESSION).toBe('session')
    })
  })

  describe('CACHE_TTL', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.SLOTS).toBe(60)
      expect(CACHE_TTL.ANALYTICS).toBe(300)
      expect(CACHE_TTL.SESSION).toBe(86400)
      expect(CACHE_TTL.RATE_LIMIT).toBe(60)
    })
  })

  describe('getCachedData', () => {
    it('should return cached data if available', async () => {
      const cachedData = { foo: 'bar' }
      mockRedis.get.mockResolvedValueOnce(cachedData)

      const fetcher = vi.fn().mockResolvedValue({ foo: 'new' })
      const result = await getCachedData('test-key', fetcher)

      expect(result).toEqual(cachedData)
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('should fetch and cache data if not in cache', async () => {
      mockRedis.get.mockResolvedValueOnce(null)
      mockRedis.set.mockResolvedValueOnce('OK')

      const freshData = { foo: 'fresh' }
      const fetcher = vi.fn().mockResolvedValue(freshData)

      const result = await getCachedData('test-key', fetcher, 300)

      expect(result).toEqual(freshData)
      expect(fetcher).toHaveBeenCalled()
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', freshData, { ex: 300 })
    })

    it('should fallback to fetcher on cache error', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'))

      const freshData = { foo: 'fallback' }
      const fetcher = vi.fn().mockResolvedValue(freshData)

      const result = await getCachedData('test-key', fetcher)

      expect(result).toEqual(freshData)
      expect(fetcher).toHaveBeenCalled()
    })
  })

  describe('invalidateCache', () => {
    it('should delete cache key', async () => {
      mockRedis.del.mockResolvedValueOnce(1)

      await invalidateCache('test-key')

      expect(mockRedis.del).toHaveBeenCalledWith('test-key')
    })

    it('should not throw on error', async () => {
      mockRedis.del.mockRejectedValueOnce(new Error('Redis error'))

      await expect(invalidateCache('test-key')).resolves.not.toThrow()
    })
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      mockRedis.incr.mockResolvedValueOnce(5)
      mockRedis.ttl.mockResolvedValueOnce(55)

      const result = await checkRateLimit('user-123', 60, 60)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(55)
    })

    it('should block requests exceeding limit', async () => {
      mockRedis.incr.mockResolvedValueOnce(61)
      mockRedis.ttl.mockResolvedValueOnce(30)

      const result = await checkRateLimit('user-123', 60, 60)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should set expiry on first request', async () => {
      mockRedis.incr.mockResolvedValueOnce(1)
      mockRedis.expire.mockResolvedValueOnce(1)
      mockRedis.ttl.mockResolvedValueOnce(60)

      await checkRateLimit('new-user', 60, 60)

      expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:new-user', 60)
    })

    it('should allow on Redis error', async () => {
      mockRedis.incr.mockRejectedValueOnce(new Error('Redis error'))

      const result = await checkRateLimit('user-123')

      expect(result.allowed).toBe(true)
    })
  })

  describe('Session Management', () => {
    describe('setSession', () => {
      it('should store session data', async () => {
        mockRedis.set.mockResolvedValueOnce('OK')

        const sessionData = { userId: '123', email: 'test@example.com' }
        await setSession('sess-abc', sessionData)

        expect(mockRedis.set).toHaveBeenCalledWith(
          'session:sess-abc',
          sessionData,
          { ex: CACHE_TTL.SESSION }
        )
      })

      it('should use custom TTL', async () => {
        mockRedis.set.mockResolvedValueOnce('OK')

        await setSession('sess-abc', { foo: 'bar' }, 3600)

        expect(mockRedis.set).toHaveBeenCalledWith(
          'session:sess-abc',
          { foo: 'bar' },
          { ex: 3600 }
        )
      })
    })

    describe('getSession', () => {
      it('should retrieve session data', async () => {
        const sessionData = { userId: '123' }
        mockRedis.get.mockResolvedValueOnce(sessionData)

        const result = await getSession('sess-abc')

        expect(result).toEqual(sessionData)
        expect(mockRedis.get).toHaveBeenCalledWith('session:sess-abc')
      })

      it('should return null for non-existent session', async () => {
        mockRedis.get.mockResolvedValueOnce(null)

        const result = await getSession('non-existent')

        expect(result).toBeNull()
      })
    })

    describe('deleteSession', () => {
      it('should delete session', async () => {
        mockRedis.del.mockResolvedValueOnce(1)

        await deleteSession('sess-abc')

        expect(mockRedis.del).toHaveBeenCalledWith('session:sess-abc')
      })
    })
  })
})
