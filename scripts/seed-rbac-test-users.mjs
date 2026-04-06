/**
 * Seed script: create one test admin_user per RBAC role.
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   node scripts/seed-rbac-test-users.mjs
 *
 * The script is idempotent — re-running it skips accounts that already exist.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Try worktree-local .env.local first, fall back to main project root
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

const PASSWORD = 'RbacTest!2026'

const TEST_USERS = [
  { email: 'rbac.superadmin@dentalstory.ua', role: 'superadmin', displayName: 'Super Admin' },
  { email: 'rbac.admin@dentalstory.ua',      role: 'admin',       displayName: 'Admin' },
  { email: 'rbac.receptionist@dentalstory.ua', role: 'receptionist', displayName: 'Receptionist' },
  { email: 'rbac.doctor@dentalstory.ua',     role: 'doctor',      displayName: 'Dr. Test', specialization: 'Терапевт' },
  { email: 'rbac.seniorasst@dentalstory.ua', role: 'senior_assistant', displayName: 'Senior Assistant' },
  { email: 'rbac.assistant@dentalstory.ua',  role: 'assistant',   displayName: 'Assistant' },
  { email: 'rbac.staff@dentalstory.ua',      role: 'staff',       displayName: 'Staff' },
]

async function run() {
  console.log(`🔑  Seeding ${TEST_USERS.length} RBAC test users against ${SUPABASE_URL}\n`)

  for (const u of TEST_USERS) {
    process.stdout.write(`  [${u.role.padEnd(16)}]  ${u.email}  … `)

    // 1. Check if auth user already exists
    const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = listData?.users?.find(x => x.email === u.email)

    let userId = existing?.id

    if (userId) {
      process.stdout.write('auth exists  ')
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
      })
      if (createErr) {
        console.log(`❌  ${createErr.message}`)
        continue
      }
      userId = created.user.id
      process.stdout.write('auth created  ')
    }

    // 2. Upsert admin_users row
    const { error: upsertErr } = await supabase.from('admin_users').upsert(
      {
        id: userId,
        role: u.role,
        display_name: u.displayName,
        specialization: u.specialization ?? null,
      },
      { onConflict: 'id' }
    )

    if (upsertErr) {
      console.log(`❌  admin_users upsert: ${upsertErr.message}`)
    } else {
      console.log('✅')
    }
  }

  console.log('\n────────────────────────────────────────────────────')
  console.log('Password for all accounts: ' + PASSWORD)
  console.log('────────────────────────────────────────────────────')
  console.log('\nRole → email mapping:')
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.padEnd(16)}  ${u.email}`)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
