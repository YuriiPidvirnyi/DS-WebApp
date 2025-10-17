import http from './http'
import type { ApiResponse } from '@/types'
import { mockAPIResponse } from './api'

const ENDPOINTS = {
  subscribe: '/newsletter/subscribe',
} as const

export async function subscribeNewsletter(email: string): Promise<ApiResponse<{ subscribed: boolean }>> {
  try {
    const res = await http.post<ApiResponse<{ subscribed: boolean }>>(ENDPOINTS.subscribe, { email })
    return res.data
  } catch {
    return mockAPIResponse({ subscribed: true }, 500)
  }
}
