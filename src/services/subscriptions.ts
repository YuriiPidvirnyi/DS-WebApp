import type { ApiResponse } from '@/types'
import { api, mockAPIResponse } from './api'

const ENDPOINTS = {
  subscribe: '/newsletter/subscribe',
} as const

export async function subscribeNewsletter(
  email: string
): Promise<ApiResponse<{ subscribed: boolean }>> {
  try {
    return await api.post<ApiResponse<{ subscribed: boolean }>>(
      ENDPOINTS.subscribe,
      { email }
    )
  } catch {
    return mockAPIResponse({ subscribed: true }, 500)
  }
}
