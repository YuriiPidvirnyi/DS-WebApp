// API Base URL — defaults to the Next.js internal route prefix
// Override with NEXT_PUBLIC_API_URL for external backends
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const CSRF_TOKEN_KEY = 'csrf_token'

function generateClientCSRFToken(): string {
  if (typeof window === 'undefined') return ''

  try {
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(32)
      window.crypto.getRandomValues(bytes)
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(
        ''
      )
    }
  } catch {
    // Fall through to non-crypto fallback.
  }

  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.padEnd(
    32,
    '0'
  )
}

/** Read (or lazily create) the CSRF token from sessionStorage */
function getCSRFToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    const existing = sessionStorage.getItem(CSRF_TOKEN_KEY)
    if (existing && existing.length >= 32) {
      return existing
    }

    const token = generateClientCSRFToken()
    if (token.length >= 32) {
      sessionStorage.setItem(CSRF_TOKEN_KEY, token)
      return token
    }

    return ''
  } catch {
    return ''
  }
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  // Attach CSRF token for mutating requests
  const method = (options.method || 'GET').toUpperCase()
  const csrfHeaders: Record<string, string> = {}
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      csrfHeaders['X-CSRF-Token'] = csrfToken
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    // Parse response body
    const data = await response.json().catch(() => null)

    // Handle HTTP errors
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || 'Щось пішло не так'
      throw new APIError(
        errorMessage,
        response.status,
        data?.code,
        data?.details
      )
    }

    return data
  } catch (error) {
    // Handle network errors
    if (error instanceof APIError) {
      throw error
    }

    const isAbort =
      (typeof DOMException !== 'undefined' &&
        error instanceof DOMException &&
        error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError')

    if (isAbort) {
      throw new APIError(
        'Запит перервано (таймаут або скасування).',
        0,
        'ABORTED',
        error instanceof Error ? error.message : undefined
      )
    }

    if (error instanceof Error) {
      throw new APIError(
        "Помилка з'єднання. Перевірте інтернет-підключення.",
        0,
        'NETWORK_ERROR',
        error.message
      )
    }

    throw new APIError('Невідома помилка', 0, 'UNKNOWN_ERROR')
  }
}

/**
 * API methods
 */
export const api = {
  // GET request
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    fetchAPI<T>(endpoint, { ...options, method: 'GET' }),

  // POST request
  post: <T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PUT request
  put: <T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // PATCH request
  patch: <T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // DELETE request
  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    fetchAPI<T>(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Helper function to handle API errors in UI
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Виникла невідома помилка'
}

/**
 * Helper function to check if error is specific type
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError
}
