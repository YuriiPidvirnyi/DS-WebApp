import http from './http'
import type { Appointment, AppointmentFormData, ApiResponse } from '@/types'
import { mockAPIResponse } from './api'

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
    const res = await http.post<ApiResponse<Appointment>>(ENDPOINTS.create, data)
    return res.data
  } catch (e) {
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
    const res = await http.get<ApiResponse<Appointment>>(ENDPOINTS.one(id))
    return res.data
  } catch {
    throw new Error('Not implemented')
  }
}

/**
 * Get all appointments (for admin)
 */
export async function getAllAppointments(): Promise<ApiResponse<Appointment[]>> {
  try {
    const res = await http.get<ApiResponse<Appointment[]>>(ENDPOINTS.list)
    return res.data
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
    const res = await http.patch<ApiResponse<Appointment>>(ENDPOINTS.status(id), { status })
    return res.data
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
    const res = await http.delete<ApiResponse<void>>(ENDPOINTS.one(id))
    return res.data
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
    const res = await http.get<ApiResponse<string[]>>(ENDPOINTS.slots, {
      params: { date, doctorId },
    })
    return res.data
  } catch {
    // Mock data fallback
    const slots = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00']
    return mockAPIResponse(slots, 500)
  }
}
