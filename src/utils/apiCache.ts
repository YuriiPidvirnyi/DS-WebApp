/**
 * Advanced API caching with stale-while-revalidate strategy
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
  expiresAt: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
  forceRefresh?: boolean
}

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private pendingRequests: Map<string, Promise<unknown>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100

  /**
   * Get cached data or fetch from API
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.DEFAULT_TTL,
      staleWhileRevalidate = true,
      forceRefresh = false,
    } = options

    // Force refresh bypasses cache
    if (forceRefresh) {
      return this.fetchAndCache(key, fetcher, ttl)
    }

    const cached = this.cache.get(key) as CacheEntry<T> | undefined

    if (!cached) {
      // No cache, fetch fresh
      return this.fetchAndCache(key, fetcher, ttl)
    }

    const now = Date.now()
    const isExpired = now > cached.expiresAt

    if (!isExpired) {
      // Cache is fresh
      return cached.data
    }

    if (staleWhileRevalidate) {
      // Return stale data immediately, fetch in background
      this.fetchAndCache(key, fetcher, ttl).catch(err => {
        console.warn('Background revalidation failed:', err)
      })
      return cached.data
    }

    // Cache expired, fetch fresh
    return this.fetchAndCache(key, fetcher, ttl)
  }

  /**
   * Fetch data and update cache
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Prevent duplicate requests
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending as Promise<T>
    }

    const promise = fetcher()
      .then(data => {
        const now = Date.now()
        const entry: CacheEntry<T> = {
          data,
          timestamp: now,
          expiresAt: now + ttl,
        }

        this.cache.set(key, entry as CacheEntry<unknown>)
        this.pendingRequests.delete(key)

        // Enforce max cache size
        if (this.cache.size > this.MAX_CACHE_SIZE) {
          this.evictOldest()
        }

        return data
      })
      .catch(err => {
        this.pendingRequests.delete(key)
        throw err
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Set cache entry manually
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    }

    this.cache.set(key, entry as CacheEntry<unknown>)

    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.evictOldest()
    }
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    const cached = this.cache.get(key)
    if (!cached) return false

    const now = Date.now()
    return now <= cached.expiresAt
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  /**
   * Invalidate multiple entries by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        this.pendingRequests.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    hits: number
    misses: number
    hitRate: number
  } {
    return {
      size: this.cache.size,
      hits: 0, // Would need to track this
      misses: 0, // Would need to track this
      hitRate: 0,
    }
  }

  /**
   * Evict oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Preload cache entries
   */
  async preload<T>(
    entries: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>
  ): Promise<void> {
    await Promise.allSettled(
      entries.map(({ key, fetcher, ttl }) =>
        this.fetchAndCache(key, fetcher, ttl || this.DEFAULT_TTL)
      )
    )
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Export cache to JSON
   */
  export(): Record<string, CacheEntry<unknown>> {
    const exported: Record<string, CacheEntry<unknown>> = {}
    for (const [key, value] of this.cache.entries()) {
      exported[key] = value
    }
    return exported
  }

  /**
   * Import cache from JSON
   */
  import(data: Record<string, CacheEntry<unknown>>): void {
    const now = Date.now()

    for (const [key, entry] of Object.entries(data)) {
      // Only import non-expired entries
      if (now <= entry.expiresAt) {
        this.cache.set(key, entry)
      }
    }
  }

  /**
   * Persist cache to localStorage
   */
  persist(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const exported = this.export()
      localStorage.setItem('api-cache', JSON.stringify(exported))
    } catch (err) {
      console.warn('Failed to persist cache:', err)
    }
  }

  /**
   * Restore cache from localStorage
   */
  restore(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const stored = localStorage.getItem('api-cache')
      if (stored) {
        const data = JSON.parse(stored)
        this.import(data)
      }
    } catch (err) {
      console.warn('Failed to restore cache:', err)
    }
  }
}

// Export singleton instance
export const apiCache = new APICache()

// Restore cache on initialization
if (typeof window !== 'undefined') {
  apiCache.restore()

  // Persist cache before page unload
  window.addEventListener('beforeunload', () => {
    apiCache.persist()
  })

  // Persist cache periodically
  setInterval(() => {
    apiCache.persist()
  }, 60 * 1000) // Every minute
}

/**
 * React hook for cached API calls
 */
import { useState, useEffect } from 'react'

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
): {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { enabled = true, ...cacheOptions } = options

  const fetchData = async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)
      const result = await apiCache.get(key, fetcher, cacheOptions)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [key, enabled])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

/**
 * Cache key generator
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, unknown>
): string {
  if (!params) return endpoint

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&')

  return `${endpoint}?${sortedParams}`
}
