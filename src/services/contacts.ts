import type { ApiResponse, ContactRequest } from '@/types'
import { api } from './api'

const ENDPOINTS = {
  create: '/contacts',
} as const

export async function createContact(
  payload: ContactRequest
): Promise<ApiResponse<{ id: string }>> {
  return api.post<ApiResponse<{ id: string }>>(ENDPOINTS.create, payload)
}
