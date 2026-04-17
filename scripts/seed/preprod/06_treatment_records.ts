/**
 * Seed: treatment_records + treatment_record_items
 *
 * Creates 40 treatment acts attached to completed appointments.
 * Status distribution: signed(60%), completed(30%), draft(10%).
 * Payment distribution: paid(50%), partial(25%), unpaid(20%), waived(5%).
 */

import { supabase, faker } from './00_config.ts'
import type { SeededAppointment } from './05_appointments.ts'
import type { SeededService } from './02_services.ts'
import type { SeededDoctor } from './01_doctors.ts'
import type { SeededAdminUser } from './03_admin_users.ts'

type TreatmentStatus = 'draft' | 'signed' | 'completed'
type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'waived' | 'refunded'

export async function seedTreatmentRecords(
  appointments: SeededAppointment[],
  services: SeededService[],
  doctors: SeededDoctor[],
  admins: SeededAdminUser[]
): Promise<void> {
  console.log('\n📋  Seeding treatment records…')

  const completedAppts = appointments.filter(a => a.status === 'completed')
  const sample = faker.helpers.shuffle(completedAppts).slice(0, 40)

  const doctorAdmins = admins.filter(a => a.role === 'doctor')

  let count = 0
  for (const appt of sample) {
    const status: TreatmentStatus = faker.helpers.weightedArrayElement([
      { value: 'signed' as TreatmentStatus, weight: 60 },
      { value: 'completed' as TreatmentStatus, weight: 30 },
      { value: 'draft' as TreatmentStatus, weight: 10 },
    ])

    const payment: PaymentStatus = faker.helpers.weightedArrayElement([
      { value: 'paid' as PaymentStatus, weight: 50 },
      { value: 'partial' as PaymentStatus, weight: 25 },
      { value: 'unpaid' as PaymentStatus, weight: 20 },
      { value: 'waived' as PaymentStatus, weight: 5 },
    ])

    // Pick the doctor admin linked to this appointment's doctor
    const createdBy = doctorAdmins[0]?.id ?? admins[0]?.id

    const { data: record, error: recErr } = await supabase
      .from('treatment_records')
      .insert({
        appointment_id: appt.id,
        patient_id: appt.patient_id,
        doctor_id: appt.doctor_id,
        status,
        payment_status: payment,
        notes: faker.datatype.boolean(0.4) ? faker.lorem.sentence() : null,
        created_by: createdBy ?? null,
        created_at: new Date(appt.appointment_date).toISOString(),
      })
      .select('id')
      .single()

    if (recErr) {
      console.warn(`   ⚠️  record: ${recErr.message}`)
      continue
    }

    // 1–4 service items per treatment record
    const itemCount = faker.number.int({ min: 1, max: 4 })
    const itemServices = faker.helpers.shuffle(services).slice(0, itemCount)

    const items = itemServices.map(svc => ({
      treatment_record_id: record.id,
      service_id: svc.id,
      tooth_number: faker.datatype.boolean(0.6)
        ? faker.number.int({ min: 11, max: 48 })
        : null,
      quantity: 1,
      unit_price: svc.price,
      total_price: svc.price,
      notes: null,
    }))

    const { error: itemErr } = await supabase
      .from('treatment_record_items')
      .insert(items)

    if (itemErr) {
      console.warn(`   ⚠️  items: ${itemErr.message}`)
    }

    count++
    process.stdout.write('.')
  }

  console.log(`\n   ✅  ${count} treatment records`)
}
