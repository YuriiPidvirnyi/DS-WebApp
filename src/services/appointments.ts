import type { Appointment, AppointmentFormData, ApiResponse } from '@/types'
import { mockAPIResponse } from './api'

/**
 * Create a new appointment
 */
export async function createAppointment(
  data: AppointmentFormData
): Promise<ApiResponse<Appointment>> {
  // TODO: Replace with real API call when backend is ready
  // return api.post<ApiResponse<Appointment>>('/appointments', data)

  // Mock response for development
  const appointment: Appointment = {
    ...data,
    id: `apt-${Date.now()}`,
    status: 'pending',
    createdAt: new Date(),
  }

  return mockAPIResponse(appointment, 1500)
}

/**
 * Get appointment by ID
 */
export async function getAppointment(
  _id: string
): Promise<ApiResponse<Appointment>> {
  // TODO: Replace with real API call
  // return api.get<ApiResponse<Appointment>>(`/appointments/${id}`)

  throw new Error('Not implemented')
}

/**
 * Get all appointments (for admin)
 */
export async function getAllAppointments(): Promise<
  ApiResponse<Appointment[]>
> {
  // TODO: Replace with real API call
  // return api.get<ApiResponse<Appointment[]>>('/appointments')

  throw new Error('Not implemented')
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  _id: string,
  _status: Appointment['status']
): Promise<ApiResponse<Appointment>> {
  // TODO: Replace with real API call
  // return api.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status })

  throw new Error('Not implemented')
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  _id: string
): Promise<ApiResponse<void>> {
  // TODO: Replace with real API call
  // return api.delete<ApiResponse<void>>(`/appointments/${id}`)

  throw new Error('Not implemented')
}

/**
 * Get available time slots for booking
 */
export async function getAvailableSlots(
  _date: string,
  _doctorId?: string
): Promise<ApiResponse<string[]>> {
  // TODO: Replace with real API call
  // return api.get<ApiResponse<string[]>>(`/appointments/slots?date=${date}&doctorId=${doctorId}`)

  // Mock data
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

  return mockAPIResponse(slots, 800)
}
