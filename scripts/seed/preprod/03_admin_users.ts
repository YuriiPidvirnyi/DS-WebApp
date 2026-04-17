/**
 * Seed: admin_users + corresponding auth.users
 *
 * Creates one admin account per role (all 8 canonical roles).
 * Also links doctor admin_users rows to seeded doctor records.
 *
 * Replaces the broken scripts/seed-rbac-test-users.mjs which
 * referenced removed roles (senior_assistant, staff).
 */

import { supabase, SUPABASE_URL_VALUE, faker } from './00_config.ts'
import type { AdminRole } from './00_config.ts'
import type { SeededDoctor } from './01_doctors.ts'

export interface SeededAdminUser {
  id: string
  email: string
  role: AdminRole
  doctor_id: string | null
}

const PASSWORD = 'PreprodTest!2026'

interface AdminSpec {
  email: string
  role: AdminRole
  displayName: string
  specialization?: string
}

const ADMIN_SPECS: AdminSpec[] = [
  {
    email: 'seed.superadmin@dentalstory.ua',
    role: 'superadmin',
    displayName: 'Super Admin',
  },
  {
    email: 'seed.admin@dentalstory.ua',
    role: 'admin',
    displayName: 'Адміністратор',
  },
  {
    email: 'seed.receptionist@dentalstory.ua',
    role: 'receptionist',
    displayName: 'Реєстратор',
  },
  {
    email: 'seed.doctor1@dentalstory.ua',
    role: 'doctor',
    displayName: 'Лікар (Терапевт)',
    specialization: 'Терапевт-стоматолог',
  },
  {
    email: 'seed.doctor2@dentalstory.ua',
    role: 'doctor',
    displayName: 'Лікар (Ортодонт)',
    specialization: 'Ортодонт',
  },
  {
    email: 'seed.assistant@dentalstory.ua',
    role: 'assistant',
    displayName: 'Асистент',
  },
  {
    email: 'seed.billing@dentalstory.ua',
    role: 'billing_manager',
    displayName: 'Менеджер розрахунків',
  },
  {
    email: 'seed.inventory@dentalstory.ua',
    role: 'inventory_manager',
    displayName: 'Менеджер матеріалів',
  },
  {
    email: 'seed.analyst@dentalstory.ua',
    role: 'analyst',
    displayName: 'Аналітик',
  },
]

export async function seedAdminUsers(
  doctors: SeededDoctor[]
): Promise<SeededAdminUser[]> {
  console.log('\n🔑  Seeding admin users…')
  console.log(`    URL: ${SUPABASE_URL_VALUE}`)

  // Map doctor emails to doctor ids for linking
  const doctorSpecs = ADMIN_SPECS.filter(s => s.role === 'doctor')
  const doctorsBySpec: Record<string, string> = {}
  for (const d of doctors) {
    doctorsBySpec[d.specialization] = d.id
  }

  const results: SeededAdminUser[] = []

  // List existing auth users once to avoid N+1 list calls
  const { data: listData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const existingEmails = new Map<string, string>(
    listData?.users?.map(u => [u.email!, u.id] as [string, string]) ?? []
  )

  let doctorIndex = 0
  for (const spec of ADMIN_SPECS) {
    process.stdout.write(`  [${spec.role.padEnd(18)}]  ${spec.email}  … `)

    // 1. Ensure auth user
    let userId = existingEmails.get(spec.email)
    if (userId) {
      process.stdout.write('auth exists  ')
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: PASSWORD,
        email_confirm: true,
      })
      if (error) {
        console.log(`❌  ${error.message}`)
        continue
      }
      userId = created.user.id
      process.stdout.write('auth created  ')
    }

    // 2. Resolve doctor_id for doctor roles
    let doctor_id: string | null = null
    if (spec.role === 'doctor' && spec.specialization) {
      doctor_id =
        doctorsBySpec[spec.specialization] ??
        doctors[doctorIndex % doctors.length]?.id ??
        null
      doctorIndex++
    }

    // 3. Upsert admin_users row
    const { error: upsertErr } = await supabase.from('admin_users').upsert(
      {
        id: userId,
        role: spec.role,
        display_name: spec.displayName,
        specialization: spec.specialization ?? null,
        doctor_id,
      },
      { onConflict: 'id' }
    )

    if (upsertErr) {
      console.log(`❌  admin_users: ${upsertErr.message}`)
      continue
    }

    console.log('✅')
    results.push({
      id: userId as string,
      email: spec.email,
      role: spec.role,
      doctor_id,
    })
  }

  console.log(`\n   Password for all seed admin accounts: ${PASSWORD}`)
  return results
}
