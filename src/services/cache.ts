/**
 * Advanced caching service with Redis-ready layer
 * Implements stale-while-revalidate and cache invalidation
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
  staleAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
  key?: string
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const STALE_THRESHOLD = 2 * 60 * 1000 // 2 minutes (when to start background refresh)

class CacheService {
  private memoryCache: Map<string, CacheEntry<unknown>>
  private pendingRequests: Map<string, Promise<unknown>>

  constructor() {
    this.memoryCache = new Map()
    this.pendingRequests = new Map()
  }

  /**
   * Get cached data or fetch if not available
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options

    // Check memory cache
    const cached = this.memoryCache.get(key) as CacheEntry<T> | undefined

    if (cached) {
      const now = Date.now()
      const age = now - cached.timestamp

      // Fresh data - return immediately
      if (age < cached.staleAt) {
        return cached.data
      }

      // Stale data - return but trigger background refresh
      if (staleWhileRevalidate && age < ttl) {
        this.backgroundRefresh(key, fetcher, options)
        return cached.data
      }

      // Expired - remove from cache
      if (age >= ttl) {
        this.memoryCache.delete(key)
      }
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key) as Promise<T> | undefined
    if (pending) {
      return pending
    }

    // Fetch fresh data
    return this.fetchAndCache(key, fetcher, options)
  }

  /**
   * Fetch data and cache it
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    const { ttl = DEFAULT_TTL } = options

    const promise = fetcher()
    this.pendingRequests.set(key, promise)

    try {
      const data = await promise

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        staleAt: STALE_THRESHOLD,
      }

      this.memoryCache.set(key, entry as CacheEntry<unknown>)
      this.pendingRequests.delete(key)

      // Schedule cleanup
      setTimeout(() => {
        this.memoryCache.delete(key)
      }, ttl)

      return data
    } catch (error) {
      this.pendingRequests.delete(key)
      throw error
    }
  }

  /**
   * Background refresh for stale-while-revalidate
   */
  private backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): void {
    // Don't start multiple background refreshes
    if (this.pendingRequests.has(key)) {
      return
    }

    this.fetchAndCache(key, fetcher, options).catch(error => {
      // Keep stale data on refresh failure
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`Background refresh failed for ${key}:`, error)
      }
    })
  }

  /**
   * Manually set cache entry
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      staleAt: STALE_THRESHOLD,
    }

    this.memoryCache.set(key, entry as CacheEntry<unknown>)

    // Schedule cleanup
    setTimeout(() => {
      this.memoryCache.delete(key)
    }, ttl)
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key)
    this.pendingRequests.delete(key)
  }

  /**
   * Invalidate by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keys = Array.from(this.memoryCache.keys())

    keys.forEach(key => {
      if (pattern.test(key)) {
        this.memoryCache.delete(key)
        this.pendingRequests.delete(key)
      }
    })
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    pending: number
    keys: string[]
  } {
    return {
      size: this.memoryCache.size,
      pending: this.pendingRequests.size,
      keys: Array.from(this.memoryCache.keys()),
    }
  }
}

// Export singleton instance
export const cache = new CacheService()

/**
 * Helper function for API calls with caching
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: CacheOptions = {}
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`

  return cache.get<T>(
    cacheKey,
    async () => {
      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    cacheOptions
  )
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: CacheOptions = {}
): T {
  return (async (...args: unknown[]) => {
    const cacheKey = options.key || `fn:${fn.name}:${JSON.stringify(args)}`

    return cache.get(cacheKey, () => fn(...args), options)
  }) as T
}

/**
 * PWA Cache strategies
 */
export const PWACache = {
  /**
   * Network first, fallback to cache
   */
  async networkFirst(request: Request): Promise<Response> {
    try {
      const response = await fetch(request)

      if (response.ok) {
        const cache = await caches.open('network-first')
        cache.put(request, response.clone())
      }

      return response
    } catch {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }

      throw new Error('Network failed and no cache available')
    }
  },

  /**
   * Cache first, fallback to network
   */
  async cacheFirst(request: Request): Promise<Response> {
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open('cache-first')
      cache.put(request, response.clone())
    }

    return response
  },

  /**
   * Stale while revalidate
   */
  async staleWhileRevalidate(request: Request): Promise<Response> {
    const cachedResponse = await caches.match(request)

    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open('stale-while-revalidate')
        cache.then(c => c.put(request, response.clone()))
      }
      return response
    })

    return cachedResponse || fetchPromise
  },

  /**
   * Clear specific cache
   */
  async clearCache(cacheName: string): Promise<void> {
    await caches.delete(cacheName)
  },

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
  },
}

export default cache
