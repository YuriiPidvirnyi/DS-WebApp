/**
 * Seed script: create EN + PL test patients (auth users + patient records).
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   node scripts/seed-i18n-test-patients.mjs
 *
 * The script is idempotent — re-running it skips accounts that already exist.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  config({ path: resolve(__dirname, '../../../../.env.local') })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'PatientTest!2026'

const TEST_PATIENTS = [
  // ── English ──────────────────────────────────────────────────────────────────
  {
    email: 'en-patient01@preprod.dentalstory.ua',
    firstName: 'Emma',
    lastName: 'Thompson',
    phone: '+44-20-7946-0101',
    dob: '1990-03-14',
    gender: 'female',
    address: '12 Baker Street, London',
    notes:
      'Mild anxiety about dental procedures. Prefers detailed explanations before treatment.',
    totalVisits: 3,
    totalSpent: 9600,
  },
  {
    email: 'en-patient02@preprod.dentalstory.ua',
    firstName: 'James',
    lastName: 'Wilson',
    phone: '+44-20-7946-0102',
    dob: '1985-07-22',
    gender: 'male',
    address: '45 Oxford Road, Manchester',
    notes: 'Dental implant in upper left. No known allergies.',
    totalVisits: 5,
    totalSpent: 22400,
  },
  {
    email: 'en-patient03@preprod.dentalstory.ua',
    firstName: 'Sophie',
    lastName: 'Clarke',
    phone: '+44-20-7946-0103',
    dob: '1995-11-08',
    gender: 'female',
    address: '7 Victoria Avenue, Birmingham',
    notes: 'Orthodontic treatment in progress. Braces fitted 2025-09.',
    totalVisits: 7,
    totalSpent: 18000,
  },
  {
    email: 'en-patient04@preprod.dentalstory.ua',
    firstName: 'Oliver',
    lastName: 'Bennett',
    phone: '+44-20-7946-0104',
    dob: '1978-01-30',
    gender: 'male',
    address: '33 High Street, Bristol',
    notes: 'Chronic periodontitis. Regular hygienist visits required.',
    totalVisits: 12,
    totalSpent: 41200,
  },
  {
    email: 'en-patient05@preprod.dentalstory.ua',
    firstName: 'Charlotte',
    lastName: 'Davies',
    phone: '+44-20-7946-0105',
    dob: '1992-05-17',
    gender: 'female',
    address: '19 Castle Road, Cardiff',
    notes: 'Teeth whitening completed. No special notes.',
    totalVisits: 2,
    totalSpent: 4800,
  },
  {
    email: 'en-patient06@preprod.dentalstory.ua',
    firstName: 'Harry',
    lastName: 'Morrison',
    phone: '+44-20-7946-0106',
    dob: '1988-09-03',
    gender: 'male',
    address: '88 Queen Street, Edinburgh',
    notes: 'Wisdom teeth extracted 2026-01. Healing well.',
    totalVisits: 4,
    totalSpent: 13600,
  },
  {
    email: 'en-patient07@preprod.dentalstory.ua',
    firstName: 'Grace',
    lastName: 'Anderson',
    phone: '+44-20-7946-0107',
    dob: '1998-12-25',
    gender: 'female',
    address: '5 Park Lane, Leeds',
    notes: 'First visit. Routine checkup and scaling requested.',
    totalVisits: 1,
    totalSpent: 1200,
  },
  {
    email: 'en-patient08@preprod.dentalstory.ua',
    firstName: 'Liam',
    lastName: 'Turner',
    phone: '+44-20-7946-0108',
    dob: '1983-06-11',
    gender: 'male',
    address: '22 Bridge Street, Liverpool',
    notes: 'Veneer on upper right central incisor. Sensitive to cold.',
    totalVisits: 6,
    totalSpent: 28800,
  },
  {
    email: 'en-patient09@preprod.dentalstory.ua',
    firstName: 'Amelia',
    lastName: 'Hughes',
    phone: '+44-20-7946-0109',
    dob: '2000-02-19',
    gender: 'female',
    address: '14 Station Road, Sheffield',
    notes: 'Penicillin allergy — documented. Use alternative antibiotics.',
    totalVisits: 3,
    totalSpent: 7200,
  },
  {
    email: 'en-patient10@preprod.dentalstory.ua',
    firstName: 'Noah',
    lastName: 'Walker',
    phone: '+44-20-7946-0110',
    dob: '1975-10-05',
    gender: 'male',
    address: '67 Church Lane, Nottingham',
    notes: 'Diabetes type 2. Slower healing expected post-surgery.',
    totalVisits: 9,
    totalSpent: 35600,
  },
  // ── Polish ───────────────────────────────────────────────────────────────────
  {
    email: 'pl-patient01@preprod.dentalstory.ua',
    firstName: 'Katarzyna',
    lastName: 'Wiśniewska',
    phone: '+48-12-345-6001',
    dob: '1991-04-18',
    gender: 'female',
    address: 'ul. Floriańska 12, Kraków',
    notes: 'Leczenie kanałowe zęba 36. Brak alergii.',
    totalVisits: 4,
    totalSpent: 14400,
  },
  {
    email: 'pl-patient02@preprod.dentalstory.ua',
    firstName: 'Piotr',
    lastName: 'Kowalczyk',
    phone: '+48-22-345-6002',
    dob: '1980-08-27',
    gender: 'male',
    address: 'ul. Marszałkowska 45, Warszawa',
    notes: 'Implanty — planowana procedura w 2026. Niedobór witaminy D.',
    totalVisits: 6,
    totalSpent: 24000,
  },
  {
    email: 'pl-patient03@preprod.dentalstory.ua',
    firstName: 'Magdalena',
    lastName: 'Nowak',
    phone: '+48-71-345-6003',
    dob: '1996-01-09',
    gender: 'female',
    address: 'ul. Świdnicka 7, Wrocław',
    notes: 'Aparat ortodontyczny. Wizyta kontrolna co 6 tygodni.',
    totalVisits: 8,
    totalSpent: 19200,
  },
  {
    email: 'pl-patient04@preprod.dentalstory.ua',
    firstName: 'Tomasz',
    lastName: 'Zieliński',
    phone: '+48-61-345-6004',
    dob: '1972-11-14',
    gender: 'male',
    address: 'ul. Półwiejska 33, Poznań',
    notes: 'Paradontoza przewlekła. Wymaga regularnych wizyt u higienistki.',
    totalVisits: 15,
    totalSpent: 52800,
  },
  {
    email: 'pl-patient05@preprod.dentalstory.ua',
    firstName: 'Anna',
    lastName: 'Wróbel',
    phone: '+48-32-345-6005',
    dob: '1987-06-23',
    gender: 'female',
    address: 'ul. Mariacka 19, Katowice',
    notes: 'Uczulenie na latex. Prosimy używać rękawiczek latexfree.',
    totalVisits: 5,
    totalSpent: 16800,
  },
  {
    email: 'pl-patient06@preprod.dentalstory.ua',
    firstName: 'Marek',
    lastName: 'Jabłoński',
    phone: '+48-58-345-6006',
    dob: '1969-03-31',
    gender: 'male',
    address: 'ul. Długa 88, Gdańsk',
    notes: 'Mosty protetyczne na zębach 14–16. Kontrola co rok.',
    totalVisits: 11,
    totalSpent: 44000,
  },
  {
    email: 'pl-patient07@preprod.dentalstory.ua',
    firstName: 'Agnieszka',
    lastName: 'Krawczyk',
    phone: '+48-91-345-6007',
    dob: '1994-09-07',
    gender: 'female',
    address: 'ul. Bogurodzicy 5, Szczecin',
    notes: 'Wybielanie zębów zakończone. Brak przeciwwskazań.',
    totalVisits: 2,
    totalSpent: 5600,
  },
  {
    email: 'pl-patient08@preprod.dentalstory.ua',
    firstName: 'Krzysztof',
    lastName: 'Dąbrowski',
    phone: '+48-81-345-6008',
    dob: '1976-12-02',
    gender: 'male',
    address: 'ul. Krakowskie Przedmieście 22, Lublin',
    notes: 'Cukrzyca typu 1. Wymaga specjalnego podejścia przy gojeniu.',
    totalVisits: 10,
    totalSpent: 38400,
  },
  {
    email: 'pl-patient09@preprod.dentalstory.ua',
    firstName: 'Monika',
    lastName: 'Pawlak',
    phone: '+48-42-345-6009',
    dob: '1999-07-16',
    gender: 'female',
    address: 'ul. Piotrkowska 67, Łódź',
    notes: 'Pierwsza wizyta. Prosi o pełne badanie stomatologiczne.',
    totalVisits: 1,
    totalSpent: 1600,
  },
  {
    email: 'pl-patient10@preprod.dentalstory.ua',
    firstName: 'Rafał',
    lastName: 'Woźniak',
    phone: '+48-89-345-6010',
    dob: '1982-05-28',
    gender: 'male',
    address: 'ul. Warmińska 14, Olsztyn',
    notes: 'Ekstrakcja zęba mądrości 2026-02. Gojenie prawidłowe.',
    totalVisits: 3,
    totalSpent: 8800,
  },
]

async function run() {
  console.log(
    `\n🌍  Seeding ${TEST_PATIENTS.length} i18n test patients (EN + PL) against ${SUPABASE_URL}\n`
  )

  const { data: listData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const existingEmails = new Set(listData?.users?.map(u => u.email) ?? [])

  for (const p of TEST_PATIENTS) {
    const lang = p.email.startsWith('en-') ? 'EN' : 'PL'
    process.stdout.write(
      `  [${lang}] ${p.firstName} ${p.lastName.padEnd(14)} ${p.email}  … `
    )

    let userId

    if (existingEmails.has(p.email)) {
      const existing = listData.users.find(u => u.email === p.email)
      userId = existing.id
      process.stdout.write('auth exists  ')
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: p.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: p.firstName, last_name: p.lastName },
      })
      if (error) {
        console.log(`❌  ${error.message}`)
        continue
      }
      userId = created.user.id
      process.stdout.write('auth created  ')
    }

    const { error: upsertErr } = await supabase.from('patients').upsert(
      {
        id: userId,
        first_name: p.firstName,
        last_name: p.lastName,
        phone: p.phone,
        email: p.email,
        date_of_birth: p.dob,
        gender: p.gender,
        address: p.address,
        medical_notes: p.notes,
        total_visits: p.totalVisits,
        total_spent_uah: p.totalSpent,
      },
      { onConflict: 'id' }
    )

    if (upsertErr) {
      console.log(`❌  patients upsert: ${upsertErr.message}`)
    } else {
      console.log(`✅  (id: ${userId})`)
    }
  }

  console.log('\n────────────────────────────────────────────────────')
  console.log('Password for all accounts: ' + PASSWORD)
  console.log('────────────────────────────────────────────────────')
  console.log('\nEN patients: en-patient01..10@preprod.dentalstory.ua')
  console.log('PL patients: pl-patient01..10@preprod.dentalstory.ua\n')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
