/**
 * Seed: doctors table
 * Creates 5 realistic Ukrainian dental specialists.
 * Returns array of inserted doctor IDs for use by later modules.
 */

import { supabase, faker, uaFullName } from './00_config.ts'

export interface SeededDoctor {
  id: string
  full_name: string
  specialization: string
  email: string
}

const SPECIALIZATIONS = [
  'Терапевт-стоматолог',
  'Ортодонт',
  'Хірург-стоматолог',
  'Ортопед-стоматолог',
  'Дитячий стоматолог',
]

export async function seedDoctors(): Promise<SeededDoctor[]> {
  console.log('\n👨‍⚕️  Seeding doctors…')

  const rows = SPECIALIZATIONS.map((spec, i) => {
    const { first, last } = uaFullName('male')
    return {
      full_name: `${last} ${first} ${faker.person.middleName()}`.trim(),
      specialization: spec,
      photo_url: null,
      bio: `Досвід роботи ${faker.number.int({ min: 5, max: 25 })} років. Спеціалізація: ${spec}.`,
      email: `doctor${i + 1}@dentalstory.ua`,
      phone: `+38050${faker.string.numeric(7)}`,
      is_active: true,
    }
  })

  const { data, error } = await supabase
    .from('doctors')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: false })
    .select('id, full_name, specialization, email')

  if (error) throw new Error(`doctors upsert: ${error.message}`)

  console.log(`   ✅  ${data!.length} doctors`)
  return data!
}
