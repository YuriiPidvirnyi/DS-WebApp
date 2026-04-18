/**
 * Seed: material_orders + material_order_items
 *
 * Creates 15 material orders in various stages of the approval workflow.
 * Status distribution: draft(2), pending_approval(3), approved(3), ordered(4), delivered(3).
 * Urgency distribution: low(4), normal(6), high(3), critical(2).
 */

import { supabase, faker } from './00_config.ts'
import type { SeededMaterial } from './07_materials.ts'
import type { SeededAdminUser } from './03_admin_users.ts'

type OrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ordered'
  | 'delivered'
type OrderUrgency = 'low' | 'normal' | 'high' | 'critical'

export async function seedMaterialOrders(
  materials: SeededMaterial[],
  admins: SeededAdminUser[]
): Promise<void> {
  console.log('\n📦  Seeding material orders…')

  const statuses: OrderStatus[] = [
    'draft',
    'draft',
    'pending_approval',
    'pending_approval',
    'pending_approval',
    'approved',
    'approved',
    'approved',
    'ordered',
    'ordered',
    'ordered',
    'ordered',
    'delivered',
    'delivered',
    'delivered',
  ]

  const urgencies: OrderUrgency[] = [
    'low',
    'low',
    'low',
    'low',
    'normal',
    'normal',
    'normal',
    'normal',
    'normal',
    'normal',
    'high',
    'high',
    'high',
    'critical',
    'critical',
  ]

  const inventoryAdmins = admins.filter(a =>
    ['inventory_manager', 'admin', 'superadmin', 'assistant'].includes(a.role)
  )
  const approverAdmins = admins.filter(a =>
    ['admin', 'superadmin'].includes(a.role)
  )

  let count = 0
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i]
    const urgency = urgencies[i]
    const creator = faker.helpers.arrayElement(
      inventoryAdmins.length ? inventoryAdmins : admins
    )
    const approver =
      status !== 'draft' && status !== 'pending_approval'
        ? faker.helpers.arrayElement(
            approverAdmins.length ? approverAdmins : admins
          )
        : null

    const createdAt = faker.date.recent({ days: 30 }).toISOString()

    const { data: order, error: oErr } = await supabase
      .from('material_orders')
      .insert({
        status,
        urgency,
        notes: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
        created_by: creator.id,
        approved_by: approver?.id ?? null,
        approved_at: approver
          ? faker.date.recent({ days: 20 }).toISOString()
          : null,
        ordered_at: ['ordered', 'delivered'].includes(status)
          ? faker.date.recent({ days: 15 }).toISOString()
          : null,
        delivered_at:
          status === 'delivered'
            ? faker.date.recent({ days: 5 }).toISOString()
            : null,
        created_at: createdAt,
      })
      .select('id')
      .single()

    if (oErr) {
      console.warn(`   ⚠️  order: ${oErr.message}`)
      continue
    }

    // 1–5 items per order
    const itemMaterials = faker.helpers
      .shuffle(materials)
      .slice(0, faker.number.int({ min: 1, max: 5 }))
    const items = itemMaterials.map(m => ({
      order_id: order.id,
      material_id: m.id,
      quantity_ordered: faker.number.int({ min: 2, max: 20 }),
      unit_price: m.unit_price,
      notes: null,
    }))

    const { error: iErr } = await supabase
      .from('material_order_items')
      .insert(items)
    if (iErr) console.warn(`   ⚠️  order items: ${iErr.message}`)

    count++
    process.stdout.write('.')
  }

  console.log(`\n   ✅  ${count} material orders`)
}
