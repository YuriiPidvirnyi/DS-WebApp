/**
 * Preprod seed: inventory-v2 catalog data.
 *
 * Runs after all inventory-v2 migrations have been applied.  Each section
 * guards itself with a table-existence check and skips gracefully when the
 * required migration hasn't run yet — so the script is safe to run at any
 * phase of the rollout.
 *
 * Prerequisite: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   node scripts/seed-stock-preprod.mjs
 *
 * Idempotent — re-running is safe (upsert / ON CONFLICT DO NOTHING throughout).
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
    '❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function tableExists(name) {
  const { data, error } = await supabase
    .rpc('to_regclass', { rel: `public.${name}` })
    .single()
  if (error) return false
  return data !== null
}

function log(msg) {
  console.log(`  ${msg}`)
}

// ---------------------------------------------------------------------------
// Phase 0: clinic_settings
// ---------------------------------------------------------------------------

async function seedClinicSettings() {
  if (!(await tableExists('clinic_settings'))) {
    log(
      '⏭  clinic_settings table not found — skipping (run 20260430_clinic_settings.sql first)'
    )
    return
  }

  const rows = [
    { key: 'allow_negative_balance', value: true },
    { key: 'writeoff_mode', value: 'draft_hybrid' },
    { key: 'auto_ap_bill_on_incoming', value: false },
    { key: 'default_expense_category_id', value: null },
    { key: 'enforce_stock_permissions', value: true },
    { key: 'show_my_inventory', value: true },
  ]

  for (const row of rows) {
    const { error } = await supabase
      .from('clinic_settings')
      .upsert(
        { key: row.key, value: row.value },
        { onConflict: 'key', ignoreDuplicates: true }
      )
    if (error)
      console.error(`  ❌  clinic_settings[${row.key}]: ${error.message}`)
  }
  log(`✅  clinic_settings — ${rows.length} rows`)
}

// ---------------------------------------------------------------------------
// Phase 1: stock_warehouses (3-tier topology: 1 main + 3 cabinets + doctors)
// ---------------------------------------------------------------------------

async function seedWarehouses() {
  if (!(await tableExists('stock_warehouses'))) {
    log('⏭  stock_warehouses not found — skipping (Phase 1 migration needed)')
    return
  }

  // Main warehouse
  const { error: mainErr } = await supabase
    .from('stock_warehouses')
    .upsert(
      { name_uk: 'Головний склад', kind: 'main', is_main: true, sort_order: 0 },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  if (mainErr && !mainErr.message.includes('unique')) {
    console.error(`  ❌  main warehouse: ${mainErr.message}`)
  }

  // 3 cabinets (Q1 lock: the clinic has exactly 3 treatment cabinets)
  const cabinets = [
    { name_uk: 'Кабінет 1', kind: 'cabinet', is_main: false, sort_order: 10 },
    { name_uk: 'Кабінет 2', kind: 'cabinet', is_main: false, sort_order: 11 },
    { name_uk: 'Кабінет 3', kind: 'cabinet', is_main: false, sort_order: 12 },
  ]
  for (const cab of cabinets) {
    const { count } = await supabase
      .from('stock_warehouses')
      .select('id', { count: 'exact', head: true })
      .eq('name_uk', cab.name_uk)
    if (count === 0) {
      const { error } = await supabase.from('stock_warehouses').insert(cab)
      if (error) console.error(`  ❌  ${cab.name_uk}: ${error.message}`)
    }
  }

  // 2 sample doctor satellites (seeded by last_name + first_name; real prod
  // cutover uses the backfill in 20260501_stock_backfill.sql which reads doctors table)
  const sampleDoctors = [
    {
      name_uk: 'Склад Іванченко Олег',
      kind: 'doctor',
      is_main: false,
      sort_order: 100,
    },
    {
      name_uk: 'Склад Петренко Марія',
      kind: 'doctor',
      is_main: false,
      sort_order: 101,
    },
  ]
  for (const d of sampleDoctors) {
    const { count } = await supabase
      .from('stock_warehouses')
      .select('id', { count: 'exact', head: true })
      .eq('name_uk', d.name_uk)
    if (count === 0) {
      const { error } = await supabase.from('stock_warehouses').insert(d)
      if (error) console.error(`  ❌  ${d.name_uk}: ${error.message}`)
    }
  }

  log('✅  stock_warehouses — 1 main + 3 cabinets + 2 sample doctor satellites')
}

// ---------------------------------------------------------------------------
// Phase 2: material_brands + material_suppliers (directories)
// ---------------------------------------------------------------------------

async function seedBrands() {
  if (!(await tableExists('material_brands'))) {
    log('⏭  material_brands not found — skipping (Phase 2 migration needed)')
    return
  }

  const brands = [
    { name_uk: 'Dentsply Sirona', name_en: 'Dentsply Sirona' },
    { name_uk: '3M ESPE', name_en: '3M ESPE' },
    { name_uk: 'GC Corporation', name_en: 'GC Corporation' },
    { name_uk: 'Ivoclar Vivadent', name_en: 'Ivoclar Vivadent' },
    { name_uk: 'VOCO', name_en: 'VOCO' },
  ]

  for (const b of brands) {
    const { error } = await supabase
      .from('material_brands')
      .upsert(
        { name_uk: b.name_uk, name_en: b.name_en },
        { onConflict: 'name_uk', ignoreDuplicates: true }
      )
    if (error) console.error(`  ❌  brand ${b.name_uk}: ${error.message}`)
  }
  log(`✅  material_brands — ${brands.length} rows`)
}

async function seedSuppliers() {
  if (!(await tableExists('material_suppliers'))) {
    log(
      '⏭  material_suppliers not found — skipping (Phase 2 migration needed)'
    )
    return
  }

  const suppliers = [
    {
      name_uk: 'МедТех Постач',
      phone: '+380441234567',
      email: 'orders@medtech.ua',
    },
    {
      name_uk: 'Стомасервіс',
      phone: '+380442345678',
      email: 'info@stomaservice.ua',
    },
    {
      name_uk: 'ДентаПро',
      phone: '+380443456789',
      email: 'supply@dentapro.com.ua',
    },
    {
      name_uk: 'Фармацевтична Логістика',
      phone: '+380444567890',
      email: 'pharma@fl.ua',
    },
  ]

  for (const s of suppliers) {
    const { error } = await supabase
      .from('material_suppliers')
      .upsert(
        { name_uk: s.name_uk, phone: s.phone, email: s.email },
        { onConflict: 'name_uk', ignoreDuplicates: true }
      )
    if (error) console.error(`  ❌  supplier ${s.name_uk}: ${error.message}`)
  }
  log(`✅  material_suppliers — ${suppliers.length} rows`)
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

console.log('\n🦷  DentalStory inventory-v2 preprod seed\n')

await seedClinicSettings()
await seedWarehouses()
await seedBrands()
await seedSuppliers()

console.log('\n✔   Done.\n')
