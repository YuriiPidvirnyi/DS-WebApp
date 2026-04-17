/**
 * Preprod seed system — shared config, client, and types.
 *
 * SAFETY: All modules import this file. The guard here prevents accidental
 * execution against a production Supabase project.
 */

import { createClient } from '@supabase/supabase-js'
import { fakerUK as faker } from '@faker-js/faker'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env: worktree-local first, fall back to project root
loadEnv({ path: resolve(__dirname, '../../../.env.local') })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  loadEnv({ path: resolve(__dirname, '../../../../../../.env.local') })
}

// ─── Safety guard ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const PROD_URL_PATTERN = /dentalstory\.com\.ua|dentals\d+\.supabase\.co/i

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

if (
  PROD_URL_PATTERN.test(SUPABASE_URL) &&
  process.env.SEED_FORCE_PROD !== 'yes_i_know'
) {
  console.error(
    `❌  REFUSED: SUPABASE_URL looks like production (${SUPABASE_URL}).`
  )
  console.error('    Set SEED_FORCE_PROD=yes_i_know to override (dangerous!).')
  process.exit(1)
}

// ─── Deterministic faker seed ─────────────────────────────────────────────────
faker.seed(42)
export { faker }

// ─── Supabase service-role client ────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export const SUPABASE_URL_VALUE = SUPABASE_URL

// ─── Seed volumes ─────────────────────────────────────────────────────────────
export const SEED = {
  patients: 25,
  appointmentsTotal: 180, // spread across past 6 months + next 2 months
  treatmentRecords: 40,
  materials: 30,
  materialOrders: 15,
  chatSessions: 20,
  messagesPerChat: { min: 4, max: 24 },
  reviews: 35,
}

// ─── Common role list ─────────────────────────────────────────────────────────
export type AdminRole =
  | 'superadmin'
  | 'admin'
  | 'receptionist'
  | 'doctor'
  | 'assistant'
  | 'billing_manager'
  | 'inventory_manager'
  | 'analyst'

// ─── Ukrainian dental services list ──────────────────────────────────────────
export const SERVICE_NAMES_UK = [
  'Терапевтичне лікування',
  'Пломбування зуба (фотополімер)',
  'Лікування пульпіту',
  'Лікування періодонтиту',
  'Відбілювання (кабінетне)',
  'Ультразвукове чищення',
  'Air Flow',
  'Видалення зуба (просте)',
  'Видалення зуба (складне)',
  'Рентген (прицільний)',
  'Ортопантомограма (панорамний)',
  'Консультація лікаря',
  'Виготовлення вініра',
  'Коронка металокерамічна',
  'Коронка цирконієва',
  'Імплантація (Straumann)',
  'Імплантація (MIS)',
  'Синус-ліфт',
  'Брекет-система металева',
  'Знімний протез часткові',
  'Анестезія місцева',
  'Лікування карієсу (молочний зуб)',
  'Герметизація фісур',
  'Відновлення кореня штифтом',
  'Шинування зубів',
] as const

export type ServiceName = (typeof SERVICE_NAMES_UK)[number]

// ─── Ukrainian given/family names pool ───────────────────────────────────────
export const UA_MALE_FIRST = [
  'Олексій',
  'Михайло',
  'Іван',
  'Андрій',
  'Сергій',
  'Дмитро',
  'Василь',
  'Ярослав',
  'Богдан',
  'Олег',
  'Тарас',
  'Максим',
  'Роман',
  'Віктор',
  'Євген',
]
export const UA_FEMALE_FIRST = [
  'Олена',
  'Наталія',
  'Марія',
  'Іванна',
  'Христина',
  'Тетяна',
  'Оксана',
  'Людмила',
  'Галина',
  'Ірина',
  'Юлія',
  'Вікторія',
  'Анна',
  'Діана',
  'Соломія',
]
export const UA_LAST_MALE = [
  'Коваленко',
  'Шевченко',
  'Бойко',
  'Поліщук',
  'Ткаченко',
  'Іванченко',
  'Мороз',
  'Лисенко',
  'Сидоренко',
  'Захаренко',
  'Павленко',
  'Гнатенко',
  'Кравченко',
  'Марченко',
  'Петренко',
]
export const UA_LAST_FEMALE = [
  'Коваленко',
  'Шевченко',
  'Бойко',
  'Поліщук',
  'Ткаченко',
  'Іванченко',
  'Мороз',
  'Лисенко',
  'Сидоренко',
  'Захаренко',
  'Павленко',
  'Гнатенко',
  'Кравченко',
  'Марченко',
  'Петренко',
]

export function uaFullName(sex: 'male' | 'female') {
  const first =
    sex === 'male'
      ? UA_MALE_FIRST[
          faker.number.int({ min: 0, max: UA_MALE_FIRST.length - 1 })
        ]
      : UA_FEMALE_FIRST[
          faker.number.int({ min: 0, max: UA_FEMALE_FIRST.length - 1 })
        ]
  const last =
    sex === 'male'
      ? UA_LAST_MALE[faker.number.int({ min: 0, max: UA_LAST_MALE.length - 1 })]
      : UA_LAST_FEMALE[
          faker.number.int({ min: 0, max: UA_LAST_FEMALE.length - 1 })
        ]
  return { first, last, full: `${last} ${first}` }
}

export function uaPhone() {
  const ops = [
    '067',
    '068',
    '096',
    '097',
    '098',
    '050',
    '066',
    '095',
    '099',
    '073',
  ]
  const op = ops[faker.number.int({ min: 0, max: ops.length - 1 })]
  return `+380${op}${faker.string.numeric(7)}`
}
