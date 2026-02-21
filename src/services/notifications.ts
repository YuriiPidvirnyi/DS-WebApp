import type { ApiResponse } from '@/types'
import { api, mockAPIResponse } from './api'

export async function sendBookingConfirmation(payload: {
  appointmentId: string
  email: string
}): Promise<ApiResponse<{ sent: boolean }>> {
  try {
    return await api.post<ApiResponse<{ sent: boolean }>>(
      '/notifications/booking',
      payload
    )
  } catch {
    return mockAPIResponse({ sent: true }, 400)
  }
}
