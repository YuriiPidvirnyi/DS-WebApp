import type { ApiResponse, ContactRequest } from '@/types'
import { api, mockAPIResponse } from './api'

const ENDPOINTS = {
  create: '/contacts',
} as const

export async function createContact(
  payload: ContactRequest
): Promise<ApiResponse<{ id: string }>> {
  try {
    return await api.post<ApiResponse<{ id: string }>>(
      ENDPOINTS.create,
      payload
    )
  } catch {
    // Fallback mock
    return mockAPIResponse({ id: `contact-${Date.now()}` }, 600)
  }
}
