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
import { parsePagination, paginationMeta } from '@/lib/pagination'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

const MATERIAL_SELECT = `
  id,
  name_uk,
  name_en,
  name_pl,
  category,
  unit,
  sku,
  min_stock_level,
  is_active,
  supplier_name,
  supplier_contact,
  supplier_email,
  created_at,
  material_inventory ( current_quantity, storage_location )
`

function sumInventoryQuantity(
  rows: { current_quantity: number | string | null }[] | null | undefined
): number {
  if (!rows?.length) return 0
  return rows.reduce((acc, row) => acc + Number(row.current_quantity || 0), 0)
}

/** GET /api/materials */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { searchParams } = request.nextUrl
  const { page, pageSize, from, to } = parsePagination(searchParams)

  const category = searchParams.get('category')
  const isActiveParam = searchParams.get('isActive')

  let query = supabase
    .from('materials')
    .select(MATERIAL_SELECT, { count: 'exact' })
    .order('name_uk', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }
  if (isActiveParam === 'true' || isActiveParam === 'false') {
    query = query.eq('is_active', isActiveParam === 'true')
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    captureException(new Error('[materials] Supabase GET error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити матеріали' },
      { status: 500 }
    )
  }

  const rows = (data ?? []).map(row => {
    const inv = row.material_inventory as
      | { current_quantity: number | string }[]
      | null
      | undefined
    const { material_inventory: _m, ...rest } = row as Record<string, unknown>
    return {
      ...rest,
      current_quantity: sumInventoryQuantity(inv ?? []),
    }
  })

  return NextResponse.json({
    success: true,
    data: rows,
    meta: paginationMeta(page, pageSize, count),
  })
}

/** POST /api/materials */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const nameUk = typeof body.nameUk === 'string' ? body.nameUk.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const unit = typeof body.unit === 'string' ? body.unit.trim() : ''

  if (!nameUk || !category || !unit) {
    return NextResponse.json(
      {
        success: false,
        error: 'Поля nameUk, category та unit обовʼязкові',
      },
      { status: 400 }
    )
  }

  const nameEn =
    typeof body.nameEn === 'string' ? body.nameEn.trim() || null : null
  const namePl =
    typeof body.namePl === 'string' ? body.namePl.trim() || null : null
  const sku = typeof body.sku === 'string' ? body.sku.trim() || null : null
  const minStockLevel =
    body.minStockLevel !== undefined && body.minStockLevel !== null
      ? Number(body.minStockLevel)
      : 0
  const supplierName =
    typeof body.supplierName === 'string'
      ? body.supplierName.trim() || null
      : null
  const supplierContact =
    typeof body.supplierContact === 'string'
      ? body.supplierContact.trim() || null
      : null
  const supplierEmail =
    typeof body.supplierEmail === 'string'
      ? body.supplierEmail.trim() || null
      : null

  if (Number.isNaN(minStockLevel) || minStockLevel < 0) {
    return NextResponse.json(
      { success: false, error: 'Невалідний minStockLevel' },
      { status: 400 }
    )
  }

  const { data: material, error: insertError } = await supabase
    .from('materials')
    .insert({
      name_uk: nameUk,
      name_en: nameEn,
      name_pl: namePl,
      category,
      unit,
      sku,
      min_stock_level: minStockLevel,
      supplier_name: supplierName,
      supplier_contact: supplierContact,
      supplier_email: supplierEmail,
    })
    .select(
      'id, name_uk, name_en, name_pl, category, unit, sku, min_stock_level, is_active, supplier_name, created_at'
    )
    .single()

  if (insertError || !material) {
    captureException(new Error('[materials] Supabase POST material error'), {
      supabaseError: insertError,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити матеріал' },
      { status: 500 }
    )
  }

  const { error: invError } = await supabase.from('material_inventory').insert({
    material_id: material.id,
    current_quantity: 0,
    storage_location: '',
  })

  if (invError) {
    captureException(new Error('[materials] Supabase POST inventory error'), {
      supabaseError: invError,
    })
    await supabase.from('materials').delete().eq('id', material.id)
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити запис залишків' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { ...material, current_quantity: 0 },
  })
}
