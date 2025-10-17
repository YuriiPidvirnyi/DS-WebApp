import http from './http'
import { mockAPIResponse } from './api'
import type { ApiResponse } from '@/types'

export async function sendFormFeedback(payload: { form: string; rating: 'up' | 'down'; refId?: string }): Promise<ApiResponse<{ recorded: boolean }>> {
  try {
    const res = await http.post<ApiResponse<{ recorded: boolean }>>('/feedback/form', payload)
    return res.data
  } catch {
    return mockAPIResponse({ recorded: true }, 300)
  }
}
