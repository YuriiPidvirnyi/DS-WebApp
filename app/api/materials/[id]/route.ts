import type { SupabaseClient, User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

type AdminResult =
  | { supabase: SupabaseClient; user: User }
  | { error: NextResponse }

async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Потрібна авторизація' },
        { status: 401 }
      ),
    }
  }

  const adminAccess = await getAdminAccess(supabase, user.id)
  if (!adminAccess) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      ),
    }
  }

  return { supabase, user }
}

const PATCHABLE = new Set([
  'nameUk',
  'nameEn',
  'namePl',
  'category',
  'unit',
  'sku',
  'minStockLevel',
  'supplierName',
  'supplierContact',
  'supplierEmail',
  'isActive',
  'currentQuantity',
])

async function setMaterialInventoryTotal(
  supabase: SupabaseClient,
  materialId: string,
  total: number
) {
  const { data: rows, error: selErr } = await supabase
    .from('material_inventory')
    .select('id')
    .eq('material_id', materialId)
    .order('created_at', { ascending: true })

  if (selErr) throw selErr

  if (!rows?.length) {
    const { error } = await supabase.from('material_inventory').insert({
      material_id: materialId,
      current_quantity: total,
      storage_location: '',
    })
    if (error) throw error
    return
  }

  const [first, ...rest] = rows
  const { error: u0 } = await supabase
    .from('material_inventory')
    .update({ current_quantity: total })
    .eq('id', first.id)
  if (u0) throw u0

  for (const r of rest) {
    const { error: uz } = await supabase
      .from('material_inventory')
      .update({ current_quantity: 0 })
      .eq('id', r.id)
    if (uz) throw uz
  }
}

/** PATCH /api/materials/:id */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const update: Record<string, unknown> = {}

  if (typeof body.nameUk === 'string') {
    const v = body.nameUk.trim()
    if (v) update.name_uk = v
  }
  if (typeof body.nameEn === 'string')
    update.name_en = body.nameEn.trim() || null
  if (typeof body.namePl === 'string')
    update.name_pl = body.namePl.trim() || null
  if (typeof body.category === 'string') {
    const v = body.category.trim()
    if (v) update.category = v
  }
  if (typeof body.unit === 'string') {
    const v = body.unit.trim()
    if (v) update.unit = v
  }
  if (typeof body.sku === 'string') update.sku = body.sku.trim() || null
  if (body.minStockLevel !== undefined) {
    const n = Number(body.minStockLevel)
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json(
        { success: false, error: 'Невалідний minStockLevel' },
        { status: 400 }
      )
    }
    update.min_stock_level = n
  }
  if (typeof body.supplierName === 'string')
    update.supplier_name = body.supplierName.trim() || null
  if (typeof body.supplierContact === 'string')
    update.supplier_contact = body.supplierContact.trim() || null
  if (typeof body.supplierEmail === 'string')
    update.supplier_email = body.supplierEmail.trim() || null
  if (typeof body.isActive === 'boolean') update.is_active = body.isActive

  let inventoryTotal: number | undefined
  if (body.currentQuantity !== undefined && body.currentQuantity !== null) {
    const n = Number(body.currentQuantity)
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json(
        { success: false, error: 'Невалідний залишок на складі' },
        { status: 400 }
      )
    }
    inventoryTotal = n
  }

  const unknownKeys = Object.keys(body).filter(k => !PATCHABLE.has(k))
  if (unknownKeys.length) {
    return NextResponse.json(
      { success: false, error: 'Недозволені поля в тілі запиту' },
      { status: 400 }
    )
  }

  if (Object.keys(update).length === 0 && inventoryTotal === undefined) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  if (Object.keys(update).length > 0) {
    const { data, error } = await supabase
      .from('materials')
      .update(update)
      .eq('id', id)
      .select(
        'id, name_uk, name_en, name_pl, category, unit, sku, min_stock_level, is_active, supplier_name, supplier_contact, supplier_email, created_at'
      )
      .maybeSingle()

    if (error) {
      captureException(new Error('[materials/[id]] Supabase PATCH error'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося оновити матеріал' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Матеріал не знайдено' },
        { status: 404 }
      )
    }
  }

  if (inventoryTotal !== undefined) {
    try {
      await setMaterialInventoryTotal(supabase, id, inventoryTotal)
    } catch (invErr) {
      captureException(
        invErr instanceof Error ? invErr : new Error(String(invErr)),
        { context: 'materials/[id] inventory PATCH' }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося оновити залишок' },
        { status: 500 }
      )
    }
  }

  const { data: refreshed, error: refErr } = await supabase
    .from('materials')
    .select(
      `id, name_uk, name_en, name_pl, category, unit, sku, min_stock_level, is_active, supplier_name, supplier_contact, supplier_email, created_at,
       material_inventory ( current_quantity )`
    )
    .eq('id', id)
    .maybeSingle()

  if (refErr || !refreshed) {
    return NextResponse.json(
      { success: false, error: 'Матеріал не знайдено' },
      { status: 404 }
    )
  }

  const inv = refreshed.material_inventory as
    | { current_quantity: number | string }[]
    | null
    | undefined
  const { material_inventory: _m, ...rest } = refreshed as Record<
    string,
    unknown
  >
  const sumQty = (inv ?? []).reduce(
    (acc, row) => acc + Number(row.current_quantity || 0),
    0
  )

  return NextResponse.json({
    success: true,
    data: { ...rest, current_quantity: sumQty },
  })
}

/** DELETE /api/materials/:id — soft-delete */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { id } = await params

  const { data, error } = await supabase
    .from('materials')
    .update({ is_active: false })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    captureException(new Error('[materials/[id]] Supabase DELETE error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося деактивувати матеріал' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Матеріал не знайдено' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: { id: data.id } })
}
