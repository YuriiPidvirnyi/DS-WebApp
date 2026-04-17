/**
 * Seed: notification_events table
 *
 * Creates a realistic backlog of notification events:
 * - sent booking confirmations (past)
 * - sent appointment reminders (past)
 * - queued upcoming reminders (future)
 * - a few failed events (for error dashboard testing)
 */

import { supabase, faker } from './00_config.ts'
import type { SeededAppointment } from './05_appointments.ts'
import type { SeededPatient } from './04_patients.ts'

type NotificationType =
  | 'booking_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancellation'
  | 'new_booking_admin'
type NotificationStatus = 'sent' | 'queued' | 'failed'

export async function seedNotifications(
  appointments: SeededAppointment[],
  patients: SeededPatient[]
): Promise<void> {
  console.log('\n🔔  Seeding notification events…')

  const patientMap = new Map(patients.map(p => [p.id, p]))
  const rows: object[] = []
  const now = new Date()

  for (const appt of appointments) {
    const patient = patientMap.get(appt.patient_id)
    if (!patient) continue

    const apptDate = new Date(appt.appointment_date)
    const isPast = apptDate < now

    // Booking confirmation — always created
    if (faker.datatype.boolean(0.85)) {
      rows.push({
        type: 'booking_confirmation' as NotificationType,
        appointment_id: appt.id,
        recipient_email: patient.email,
        status: (isPast ? 'sent' : 'queued') as NotificationStatus,
        scheduled_at: new Date(apptDate.getTime() - 7 * 86400000).toISOString(),
        sent_at: isPast
          ? new Date(apptDate.getTime() - 7 * 86400000).toISOString()
          : null,
        error_message: null,
      })
    }

    // Reminder — for appointments in past 7 days or next 2 days
    const daysFromNow = (apptDate.getTime() - now.getTime()) / 86400000
    if (daysFromNow > -7 && daysFromNow < 2) {
      const scheduledAt = new Date(apptDate)
      scheduledAt.setDate(scheduledAt.getDate() - 1)
      scheduledAt.setHours(9, 0, 0, 0)

      rows.push({
        type: 'appointment_reminder' as NotificationType,
        appointment_id: appt.id,
        recipient_email: patient.email,
        status: (daysFromNow < 0 ? 'sent' : 'queued') as NotificationStatus,
        scheduled_at: scheduledAt.toISOString(),
        sent_at: daysFromNow < 0 ? scheduledAt.toISOString() : null,
        error_message: null,
      })
    }

    // Cancellation notification for cancelled appointments
    if (appt.status === 'cancelled' && faker.datatype.boolean(0.8)) {
      rows.push({
        type: 'appointment_cancellation' as NotificationType,
        appointment_id: appt.id,
        recipient_email: patient.email,
        status: 'sent' as NotificationStatus,
        scheduled_at: apptDate.toISOString(),
        sent_at: apptDate.toISOString(),
        error_message: null,
      })
    }
  }

  // Add a handful of failed events for testing the error state
  for (let i = 0; i < 5; i++) {
    const appt = faker.helpers.arrayElement(appointments)
    const patient = patientMap.get(appt.patient_id)
    if (!patient) continue

    rows.push({
      type: 'booking_confirmation' as NotificationType,
      appointment_id: appt.id,
      recipient_email: patient.email,
      status: 'failed' as NotificationStatus,
      scheduled_at: faker.date.recent({ days: 7 }).toISOString(),
      sent_at: null,
      error_message: 'Resend API error: 429 Too Many Requests',
    })
  }

  // Insert in batches
  const BATCH = 50
  let count = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('notification_events')
      .insert(rows.slice(i, i + BATCH))
    if (error) console.warn(`   ⚠️  notifications batch: ${error.message}`)
    else count += Math.min(BATCH, rows.length - i)
  }

  console.log(`   ✅  ${count} notification events`)
}
