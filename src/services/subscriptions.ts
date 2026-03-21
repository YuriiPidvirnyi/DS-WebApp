import type { ApiResponse } from '@/types'
import { api } from './api'

const ENDPOINTS = {
  subscribe: '/newsletter',
} as const

export async function subscribeNewsletter(
  email: string
): Promise<ApiResponse<{ subscribed: boolean }>> {
  return api.post<ApiResponse<{ subscribed: boolean }>>(ENDPOINTS.subscribe, {
    email,
  })
}
