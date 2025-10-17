import type { ApiResponse } from '@/types'
import http from './http'
import { mockAPIResponse } from './api'

export async function sendBookingConfirmation(payload: { appointmentId: string; email: string }): Promise<ApiResponse<{ sent: boolean }>> {
  try {
    const res = await http.post<ApiResponse<{ sent: boolean }>>('/notifications/booking', payload)
    return res.data
  } catch {
    return mockAPIResponse({ sent: true }, 400)
  }
}
