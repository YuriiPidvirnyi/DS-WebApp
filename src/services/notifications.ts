import type { ApiResponse } from '@/types'
import { api } from './api'

export async function sendBookingConfirmation(payload: {
  appointmentId: string
  email: string
}): Promise<ApiResponse<{ sent: boolean }>> {
  return api.post<ApiResponse<{ sent: boolean }>>(
    '/notifications/booking',
    payload
  )
}
