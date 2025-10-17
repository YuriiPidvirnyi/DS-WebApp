import type { ApiResponse } from '@/types'

// API Base URL from environment variables
const API_URL = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:3001/api'

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

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

    if (error instanceof Error) {
      throw new APIError(
        'Помилка з\'єднання. Перевірте інтернет-підключення.',
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

/**
 * Mock API response wrapper (for development without backend)
 */
export async function mockAPIResponse<T>(
  data: T,
  delay: number = 1000
): Promise<ApiResponse<T>> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        data,
        message: 'Success',
      })
    }, delay)
  })
}

/**
 * Mock API error (for testing error handling)
 */
export async function mockAPIError(
  message: string,
  delay: number = 1000
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new APIError(message, 400, 'MOCK_ERROR'))
    }, delay)
  })
}
