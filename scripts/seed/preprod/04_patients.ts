/**
 * Seed: patients table + auth.users
 *
 * Creates 25 realistic Ukrainian patients with:
 * - Full Ukrainian names, phones, DOB
 * - Verified auth accounts (so patient-cabinet login works in preprod)
 * - Mix of genders and age ranges (18–72)
 */

import { supabase, faker, SEED, uaFullName, uaPhone } from './00_config.ts'

export interface SeededPatient {
  id: string // auth.users.id = patients.id
  email: string
  full_name: string
  phone: string
  sex: 'male' | 'female'
}

const PATIENT_PASSWORD = 'Patient!2026'

export async function seedPatients(): Promise<SeededPatient[]> {
  console.log('\n🧑‍🤝‍🧑  Seeding patients…')

  const { data: listData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const existingEmails = new Map<string, string>(
    listData?.users?.map(u => [u.email!, u.id] as [string, string]) ?? []
  )

  const results: SeededPatient[] = []

  for (let i = 0; i < SEED.patients; i++) {
    const sex: 'male' | 'female' = faker.datatype.boolean() ? 'male' : 'female'
    const { full } = uaFullName(sex)
    const email = `patient${String(i + 1).padStart(2, '0')}@preprod.dentalstory.ua`
    const phone = uaPhone()
    const dob = faker.date
      .birthdate({ min: 18, max: 72, mode: 'age' })
      .toISOString()
      .slice(0, 10)

    process.stdout.write(`  [${String(i + 1).padStart(2)}]  ${email}  … `)

    // 1. Auth user
    let userId = existingEmails.get(email)
    if (userId) {
      process.stdout.write('exists  ')
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        password: PATIENT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: full, phone },
      })
      if (error) {
        console.log(`❌  ${error.message}`)
        continue
      }
      userId = created.user.id
      process.stdout.write('created  ')
    }

    // 2. Upsert patients row (id = auth.uid())
    const { error: pErr } = await supabase.from('patients').upsert(
      {
        id: userId,
        full_name: full,
        email,
        phone,
        date_of_birth: dob,
        sex,
        notes: faker.datatype.boolean(0.3)
          ? `Алергія: ${faker.helpers.arrayElement(['пеніцилін', 'лідокаїн', 'немає'])}`
          : null,
      },
      { onConflict: 'id' }
    )

    if (pErr) {
      console.log(`❌  patients: ${pErr.message}`)
      continue
    }

    console.log('✅')
    results.push({ id: userId as string, email, full_name: full, phone, sex })
  }

  console.log(
    `\n   ✅  ${results.length} patients  (password: ${PATIENT_PASSWORD})`
  )
  return results
}
