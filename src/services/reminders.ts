import { api, mockAPIResponse } from './api'
import type { ApiResponse } from '@/types'

// Types
export type ReminderPreference = 'email' | 'sms' | 'both' | 'none'

export interface ReminderDetails {
  appointmentId: string
  patientName: string
  date: string
  time: string
  service: string
  contactMethod: ReminderPreference
  email?: string
  phone?: string
}

export interface ScheduledReminder {
  id: string
  appointmentId: string
  type: 'day-before' | 'hour-before' | 'custom'
  sendAt: string
  sent: boolean
  contactMethod: ReminderPreference
}

// API endpoints
export async function scheduleReminder(
  details: ReminderDetails
): Promise<ApiResponse<{ scheduled: boolean; reminderId: string }>> {
  try {
    return await api.post<
      ApiResponse<{ scheduled: boolean; reminderId: string }>
    >('/reminders/schedule', details)
  } catch (_error) {
    // Mock response on error or in development
    return mockAPIResponse(
      {
        scheduled: true,
        reminderId: `reminder-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      },
      500
    )
  }
}

export async function cancelReminder(
  reminderId: string
): Promise<ApiResponse<{ cancelled: boolean }>> {
  try {
    return await api.delete<ApiResponse<{ cancelled: boolean }>>(
      `/reminders/${reminderId}`
    )
  } catch (_error) {
    return mockAPIResponse({ cancelled: true }, 300)
  }
}

export async function updateReminderPreference(
  appointmentId: string,
  preference: ReminderPreference
): Promise<ApiResponse<{ updated: boolean }>> {
  try {
    return await api.patch<ApiResponse<{ updated: boolean }>>(
      `/appointments/${appointmentId}/reminder-preference`,
      { preference }
    )
  } catch (_error) {
    return mockAPIResponse({ updated: true }, 300)
  }
}

// Client-side reminder storage
// This would normally be handled entirely server-side, but we'll use this for demo purposes
const REMINDERS_KEY = 'ds_appointment_reminders'

export function storeLocalReminder(
  appointmentId: string,
  date: string,
  time: string
): void {
  try {
    const reminders = getLocalReminders()

    // Remove any existing reminder for this appointment
    const filtered = reminders.filter(r => r.appointmentId !== appointmentId)

    // Create reminder timestamps (day before and hour before)
    const appointmentDate = new Date(`${date}T${time}`)
    const dayBefore = new Date(appointmentDate)
    dayBefore.setDate(dayBefore.getDate() - 1)
    dayBefore.setHours(9, 0, 0, 0) // 9 AM day before

    const hourBefore = new Date(appointmentDate)
    hourBefore.setHours(hourBefore.getHours() - 1)

    // Add new reminders
    filtered.push({
      id: `day-${appointmentId}`,
      appointmentId,
      type: 'day-before',
      sendAt: dayBefore.toISOString(),
      sent: false,
      contactMethod: 'both',
    })

    filtered.push({
      id: `hour-${appointmentId}`,
      appointmentId,
      type: 'hour-before',
      sendAt: hourBefore.toISOString(),
      sent: false,
      contactMethod: 'both',
    })

    // Save reminders
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to store local reminder', error)
  }
}

export function getLocalReminders(): ScheduledReminder[] {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (_error) {
    return []
  }
}

export function removeLocalReminder(appointmentId: string): void {
  try {
    const reminders = getLocalReminders()
    const filtered = reminders.filter(r => r.appointmentId !== appointmentId)
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove local reminder', error)
  }
}

export function checkDueReminders(): ScheduledReminder[] {
  try {
    const now = new Date().toISOString()
    const reminders = getLocalReminders()

    // Find due but unsent reminders
    const due = reminders.filter(r => !r.sent && r.sendAt <= now)

    // Mark these as sent
    if (due.length > 0) {
      const updated = reminders.map(r => {
        if (due.some(d => d.id === r.id)) {
          return { ...r, sent: true }
        }
        return r
      })
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated))
    }

    return due
  } catch (_error) {
    return []
  }
}
