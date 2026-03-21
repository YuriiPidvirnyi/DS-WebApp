import type { Appointment, AppointmentFormData, ApiResponse } from '@/types'
import { api } from './api'

const ENDPOINTS = {
  create: '/appointments',
  one: (id: string) => `/appointments/${id}`,
  list: '/appointments',
  status: (id: string) => `/appointments/${id}`,
  slots: '/appointments/slots',
} as const

/**
 * Create a new appointment
 */
export async function createAppointment(
  data: AppointmentFormData
): Promise<ApiResponse<Appointment>> {
  return api.post<ApiResponse<Appointment>>(ENDPOINTS.create, data)
}

/**
 * Get appointment by ID
 */
export async function getAppointment(
  id: string
): Promise<ApiResponse<Appointment>> {
  return api.get<ApiResponse<Appointment>>(ENDPOINTS.one(id))
}

/**
 * Get all appointments (for admin)
 */
export async function getAllAppointments(): Promise<
  ApiResponse<Appointment[]>
> {
  return api.get<ApiResponse<Appointment[]>>(ENDPOINTS.list)
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  id: string,
  status: Appointment['status']
): Promise<ApiResponse<Appointment>> {
  return api.patch<ApiResponse<Appointment>>(ENDPOINTS.status(id), {
    status,
  })
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  id: string
): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(ENDPOINTS.one(id))
}

/**
 * Get available time slots for booking
 */
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
