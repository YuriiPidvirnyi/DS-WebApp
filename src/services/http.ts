import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'

// Base URL — defaults to the Next.js internal route prefix
// Override with NEXT_PUBLIC_API_URL for external backends
const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL as string | undefined) ||
  '/api'
const TIMEOUT = 10_000

// Simple in-memory cache for GET requests
type CacheEntry = { data: unknown; expiry: number }
const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL = 30_000 // 30s

// Rate limiting to prevent excessive API calls
type RateLimitEntry = { count: number; resetAt: number }
const rateLimits = new Map<string, RateLimitEntry>()
const RATE_WINDOW = 60_000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per minute per endpoint

// Rate limit error
class RateLimitExceededError extends Error {
  retryAfter: number
  constructor(endpoint: string, retryAfter: number) {
    super(`Rate limit exceeded for ${endpoint}. Retry after ${retryAfter}ms.`)
    this.name = 'RateLimitExceededError'
    this.retryAfter = retryAfter
  }
}

// Create axios instance
const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: add auth token, request ID, etc.
http.interceptors.request.use(config => {
  // Attach correlation/request id
  config.headers = config.headers || {}
  config.headers['X-Request-Id'] = crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now())

  // Optional: attach bearer token if available (placeholder)
  const token = (window as any)?.__AUTH_TOKEN__ as string | undefined
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  // Apply rate limiting (except for GET requests which are cached)
  if (config.method?.toLowerCase() !== 'get') {
    const endpoint = `${config.method?.toUpperCase() || 'UNK'}:${config.baseURL || ''}${config.url}`
    const now = Date.now()
    const rateLimit = rateLimits.get(endpoint) || {
      count: 0,
      resetAt: now + RATE_WINDOW,
    }

    // Reset counter if window expired
    if (rateLimit.resetAt <= now) {
      rateLimit.count = 0
      rateLimit.resetAt = now + RATE_WINDOW
    }

    // Check if rate limited
    if (rateLimit.count >= MAX_REQUESTS) {
      const retryAfter = rateLimit.resetAt - now
      throw new RateLimitExceededError(endpoint, retryAfter)
    }

    // Increment counter and update map
    rateLimit.count++
    rateLimits.set(endpoint, rateLimit)
  }

  // Simple GET cache: serve cached response before request if fresh
  if (config.method?.toLowerCase() === 'get') {
    const key = `${config.baseURL || ''}${config.url}?${new URLSearchParams((config.params || {}) as any)}`
    const cached = cache.get(key)
    if (cached && cached.expiry > Date.now()) {
      // Cancel request and return cached response via adapter
      return {
        ...config,
        adapter: async () =>
          ({
            data: cached.data,
            status: 200,
            statusText: 'OK (cache)',
            headers: {},
            config,
            request: {},
          }) as AxiosResponse,
      }
    }
  }

  return config
})

// Response interceptor: cache GETs and retry on transient errors
http.interceptors.response.use(
  response => {
    // Cache GET responses
    const config = response.config
    if (config.method?.toLowerCase() === 'get') {
      const key = `${config.baseURL || ''}${config.url}?${new URLSearchParams((config.params || {}) as any)}`
      cache.set(key, { data: response.data, expiry: Date.now() + DEFAULT_TTL })
    }
    return response
  },
  async (error: AxiosError) => {
    // Handle rate limit errors
    if (
      error.name === 'RateLimitExceededError' &&
      error instanceof RateLimitExceededError
    ) {
      console.warn(`Rate limit exceeded. Retry after ${error.retryAfter}ms.`)
      return Promise.reject(error)
    }

    const config = error.config as
      | (AxiosRequestConfig & { __retryCount?: number })
      | undefined
    const status = error.response?.status

    // Retry on network errors, 429, and 5xx (up to 3 times)
    const shouldRetry =
      !status || status === 429 || (status >= 500 && status < 600)
    if (config && shouldRetry) {
      config.__retryCount = (config.__retryCount || 0) + 1
      if (config.__retryCount <= 3) {
        const delay = 250 * Math.pow(2, config.__retryCount) // 250ms, 500ms, 1000ms
        await new Promise(r => setTimeout(r, delay))
        return http(config)
      }
    }

    // If we get a 429 from the server, update our rate limiting knowledge
    if (status === 429 && config?.url) {
      const endpoint = `${config.method?.toUpperCase() || 'UNK'}:${config.baseURL || ''}${config.url}`
      const retryAfter =
        parseInt(error.response?.headers['retry-after'] || '60', 10) * 1000
      rateLimits.set(endpoint, {
        count: MAX_REQUESTS,
        resetAt: Date.now() + retryAfter,
      })
    }

    return Promise.reject(error)
  }
)

export default http
