import type { Appointment, AppointmentFormData, ApiResponse } from '@/types'
import { api } from './api'

const ENDPOINTS = {
  create: '/appointments',
  slots: '/appointments/slots',
} as const

export async function createAppointment(
  data: AppointmentFormData
): Promise<ApiResponse<Appointment>> {
  return api.post<ApiResponse<Appointment>>(ENDPOINTS.create, data)
}

export async function getAvailableSlots(
  date: string,
  doctorId?: string
): Promise<ApiResponse<string[]>> {
  const params = new URLSearchParams({ date })
  if (doctorId) params.set('doctorId', doctorId)
  return api.get<ApiResponse<string[]>>(
    `${ENDPOINTS.slots}?${params.toString()}`
  )
}
