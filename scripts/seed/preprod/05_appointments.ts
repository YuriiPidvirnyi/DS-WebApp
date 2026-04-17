/**
 * Seed: appointments table
 *
 * Creates 180 appointments spread across -6 months → +2 months from today.
 * Status distribution:
 *   - past: completed(50%), cancelled(15%), no_show(5%)
 *   - future: confirmed(60%), pending(30%), cancelled(10%)
 *
 * Uses only service IDs from the services seed (02).
 */

import { supabase, faker, SEED } from './00_config.ts'
import type { SeededDoctor } from './01_doctors.ts'
import type { SeededService } from './02_services.ts'
import type { SeededPatient } from './04_patients.ts'

export interface SeededAppointment {
  id: string
  patient_id: string
  doctor_id: string
  service_id: string
  appointment_date: string
  status: string
}

type AppStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

function randomStatus(isPast: boolean): AppStatus {
  if (isPast) {
    return faker.helpers.weightedArrayElement([
      { value: 'completed' as AppStatus, weight: 50 },
      { value: 'cancelled' as AppStatus, weight: 15 },
      { value: 'no_show' as AppStatus, weight: 5 },
      { value: 'confirmed' as AppStatus, weight: 30 },
    ])
  }
  return faker.helpers.weightedArrayElement([
    { value: 'confirmed' as AppStatus, weight: 60 },
    { value: 'pending' as AppStatus, weight: 30 },
    { value: 'cancelled' as AppStatus, weight: 10 },
  ])
}

function appointmentSlot(): { date: string; time: string } {
  const now = new Date()
  const pastDays = faker.number.int({ min: 0, max: 180 })
  const futureDays = faker.number.int({ min: 1, max: 60 })
  const isPast = faker.datatype.boolean(0.75)

  const d = new Date(now)
  if (isPast) {
    d.setDate(d.getDate() - pastDays)
  } else {
    d.setDate(d.getDate() + futureDays)
  }

  // Monday–Saturday, 09:00–18:00, 30-min slots
  const dayOfWeek = d.getDay()
  if (dayOfWeek === 0) d.setDate(d.getDate() + 1)

  const hour = faker.number.int({ min: 9, max: 17 })
  const minute = faker.helpers.arrayElement([0, 30])
  const date = d.toISOString().slice(0, 10)
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  return { date, time }
}

export async function seedAppointments(
  patients: SeededPatient[],
  doctors: SeededDoctor[],
  services: SeededService[]
): Promise<SeededAppointment[]> {
  console.log('\n📅  Seeding appointments…')

  const rows = Array.from({ length: SEED.appointmentsTotal }, () => {
    const patient = faker.helpers.arrayElement(patients)
    const doctor = faker.helpers.arrayElement(doctors)
    const service = faker.helpers.arrayElement(services)
    const { date, time } = appointmentSlot()
    const now = new Date()
    const apptDate = new Date(date)
    const isPast = apptDate < now
    const status = randomStatus(isPast)

    return {
      patient_id: patient.id,
      patient_name: patient.full_name,
      patient_phone: patient.phone,
      doctor_id: doctor.id,
      service_id: service.id,
      appointment_date: date,
      appointment_time: time,
      status,
      notes: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
      created_at: new Date(
        Date.now() - faker.number.int({ min: 0, max: 30 * 86400000 })
      ).toISOString(),
    }
  })

  // Insert in batches of 50 to stay within Supabase payload limits
  const BATCH = 50
  const inserted: SeededAppointment[] = []

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('appointments')
      .insert(batch)
      .select('id, patient_id, doctor_id, service_id, appointment_date, status')

    if (error) {
      console.warn(`   ⚠️  batch ${i / BATCH + 1}: ${error.message}`)
      continue
    }
    inserted.push(...(data ?? []))
    process.stdout.write('.')
  }

  console.log(`\n   ✅  ${inserted.length} appointments`)
  return inserted
}
