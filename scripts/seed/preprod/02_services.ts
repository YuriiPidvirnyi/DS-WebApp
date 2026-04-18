/**
 * Seed: services table
 * Creates 25 standard Ukrainian dental services with realistic prices (UAH).
 */

import { supabase, SERVICE_NAMES_UK } from './00_config.ts'

export interface SeededService {
  id: string
  name: string
  price: number
}

const PRICE_MAP: Record<string, number> = {
  'Консультація лікаря': 200,
  'Рентген (прицільний)': 150,
  'Ортопантомограма (панорамний)': 500,
  'Анестезія місцева': 150,
  'Терапевтичне лікування': 800,
  'Пломбування зуба (фотополімер)': 1200,
  'Лікування пульпіту': 2500,
  'Лікування періодонтиту': 2200,
  'Відбілювання (кабінетне)': 3500,
  'Ультразвукове чищення': 1100,
  'Air Flow': 700,
  'Видалення зуба (просте)': 800,
  'Видалення зуба (складне)': 1800,
  'Виготовлення вініра': 8000,
  'Коронка металокерамічна': 5500,
  'Коронка цирконієва': 9500,
  'Імплантація (Straumann)': 22000,
  'Імплантація (MIS)': 15000,
  'Синус-ліфт': 18000,
  'Брекет-система металева': 18000,
  'Знімний протез часткові': 7500,
  'Лікування карієсу (молочний зуб)': 600,
  'Герметизація фісур': 500,
  'Відновлення кореня штифтом': 1800,
  'Шинування зубів': 2500,
}

export async function seedServices(): Promise<SeededService[]> {
  console.log('\n🦷  Seeding services…')

  const rows = SERVICE_NAMES_UK.map(name => ({
    name,
    price: PRICE_MAP[name] ?? 500,
    duration: 60,
    is_active: true,
    description: null,
  }))

  const { data, error } = await supabase
    .from('services')
    .upsert(rows, { onConflict: 'name', ignoreDuplicates: false })
    .select('id, name, price')

  if (error) throw new Error(`services upsert: ${error.message}`)

  console.log(`   ✅  ${data!.length} services`)
  return data!
}
