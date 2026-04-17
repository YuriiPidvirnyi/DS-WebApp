/**
 * Preprod seed runner — DentalStory WebApp
 *
 * Usage:
 *   npx tsx scripts/seed/preprod/index.ts
 *   npx tsx scripts/seed/preprod/index.ts --only=patients,appointments
 *   SEED_WIPE=1 npx tsx scripts/seed/preprod/index.ts   # delete existing seed data first
 *
 * Prerequisites:
 *   NEXT_PUBLIC_SUPABASE_URL   — must NOT match production URL pattern
 *   SUPABASE_SERVICE_ROLE_KEY  — service role (bypasses RLS)
 *
 * All modules are idempotent: re-running skips already-existing records
 * (upsert on natural keys / existing auth emails).
 */

import { SUPABASE_URL_VALUE, supabase } from './00_config.ts'
import { seedDoctors } from './01_doctors.ts'
import { seedServices } from './02_services.ts'
import { seedAdminUsers } from './03_admin_users.ts'
import { seedPatients } from './04_patients.ts'
import { seedAppointments } from './05_appointments.ts'
import { seedTreatmentRecords } from './06_treatment_records.ts'
import { seedMaterials } from './07_materials.ts'
import { seedMaterialOrders } from './08_material_orders.ts'
import { seedChat } from './09_chat.ts'
import { seedReviews } from './10_reviews.ts'
import { seedNotifications } from './11_notifications.ts'

// ─── Parse CLI flags ──────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const onlyArg = args.find(a => a.startsWith('--only='))
const only = onlyArg ? new Set(onlyArg.replace('--only=', '').split(',')) : null
const wipe = process.env.SEED_WIPE === '1'

function shouldRun(name: string) {
  return !only || only.has(name)
}

// ─── Optional wipe ────────────────────────────────────────────────────────────
async function wipeSeedData() {
  console.log('\n🗑️   Wiping existing seed data…')
  const tables = [
    'notification_events',
    'chat_messages',
    'chat_sessions',
    'treatment_materials_used',
    'treatment_record_items',
    'treatment_records',
    'material_order_items',
    'material_orders',
    'appointments',
    'reviews',
  ]
  for (const t of tables) {
    const { error } = await supabase
      .from(t)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.warn(`   ⚠️  wipe ${t}: ${error.message}`)
    else process.stdout.write(`   🗑  ${t}\n`)
  }
  console.log('   Wipe complete. Patient / doctor / admin_users rows kept.')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  🦷  DentalStory Preprod Seed System')
  console.log(`  📡  ${SUPABASE_URL_VALUE}`)
  console.log('═══════════════════════════════════════════════════════')

  if (wipe) await wipeSeedData()

  const doctors = shouldRun('doctors') ? await seedDoctors() : []
  const services = shouldRun('services') ? await seedServices() : []

  // Admin users depend on doctors being seeded
  const admins = shouldRun('admins') ? await seedAdminUsers(doctors) : []
  const patients = shouldRun('patients') ? await seedPatients() : []

  // All subsequent modules need patients, doctors, services
  let appointments: Awaited<ReturnType<typeof seedAppointments>> = []
  if (
    shouldRun('appointments') &&
    patients.length &&
    doctors.length &&
    services.length
  ) {
    appointments = await seedAppointments(patients, doctors, services)
  }

  if (
    shouldRun('treatments') &&
    appointments.length &&
    services.length &&
    doctors.length
  ) {
    await seedTreatmentRecords(appointments, services, doctors, admins)
  }

  const materials = shouldRun('materials') ? await seedMaterials() : []

  if (shouldRun('orders') && materials.length && admins.length) {
    await seedMaterialOrders(materials, admins)
  }

  if (shouldRun('chat') && patients.length) {
    await seedChat(patients)
  }

  if (shouldRun('reviews') && patients.length && doctors.length) {
    await seedReviews(patients, doctors)
  }

  if (shouldRun('notifications') && appointments.length && patients.length) {
    await seedNotifications(appointments, patients)
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  ✅  Preprod seed complete!')
  console.log('\n  Credentials:')
  console.log('    Admin accounts   → PreprodTest!2026')
  console.log('    Patient accounts → Patient!2026')
  console.log('    Domain: @preprod.dentalstory.ua (patients)')
  console.log('            @dentalstory.ua (admins)')
  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err)
  process.exit(1)
})
