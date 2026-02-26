import type { Appointment, AppointmentFormData, ApiResponse } from '@/types'
import { api, mockAPIResponse } from './api'

const ENDPOINTS = {
  create: '/appointments',
  one: (id: string) => `/appointments/${id}`,
  list: '/appointments',
  status: (id: string) => `/appointments/${id}/status`,
  slots: '/appointments/slots',
} as const

/**
 * Create a new appointment
 */
export async function createAppointment(
  data: AppointmentFormData
): Promise<ApiResponse<Appointment>> {
  try {
    return await api.post<ApiResponse<Appointment>>(ENDPOINTS.create, data)
  } catch (_e) {
    // Fallback to mock in development/no-backend
    const appointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    }
    return mockAPIResponse(appointment, 800)
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointment(
  id: string
): Promise<ApiResponse<Appointment>> {
  try {
    return await api.get<ApiResponse<Appointment>>(ENDPOINTS.one(id))
  } catch {
    throw new Error('Not implemented')
  }
}

/**
 * Get all appointments (for admin)
 */
export async function getAllAppointments(): Promise<
  ApiResponse<Appointment[]>
> {
  try {
    return await api.get<ApiResponse<Appointment[]>>(ENDPOINTS.list)
  } catch {
    throw new Error('Not implemented')
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  id: string,
  status: Appointment['status']
): Promise<ApiResponse<Appointment>> {
  try {
    return await api.patch<ApiResponse<Appointment>>(ENDPOINTS.status(id), {
      status,
    })
  } catch {
    throw new Error('Not implemented')
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  id: string
): Promise<ApiResponse<void>> {
  try {
    return await api.delete<ApiResponse<void>>(ENDPOINTS.one(id))
  } catch {
    throw new Error('Not implemented')
  }
}

/**
 * Get available time slots for booking
 */
export async function getAvailableSlots(
  date: string,
  doctorId?: string
): Promise<ApiResponse<string[]>> {
  try {
    const params = new URLSearchParams({ date })
    if (doctorId) params.set('doctorId', doctorId)
    return await api.get<ApiResponse<string[]>>(
      `${ENDPOINTS.slots}?${params.toString()}`
    )
  } catch {
    // Mock data fallback
    const slots = [
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ]
    return mockAPIResponse(slots, 500)
  }
}
