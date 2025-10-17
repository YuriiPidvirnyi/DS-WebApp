import http from './http'
import type { ApiResponse, ContactRequest } from '@/types'
import { mockAPIResponse } from './api'

const ENDPOINTS = {
  create: '/contacts',
} as const

export async function createContact(payload: ContactRequest): Promise<ApiResponse<{ id: string }>> {
  try {
    const res = await http.post<ApiResponse<{ id: string }>>(ENDPOINTS.create, payload)
    return res.data
  } catch {
    // Fallback mock
    return mockAPIResponse({ id: `contact-${Date.now()}` }, 600)
  }
}
