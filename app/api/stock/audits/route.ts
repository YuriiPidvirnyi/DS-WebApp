import { NextRequest, NextResponse } from 'next/server'
import { requireStockAdmin, isV2On, flagOff } from '@/lib/stock-helpers'
import { hasPermission } from '@/lib/permissions'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { logger } from '@/utils/logger'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  if (!hasPermission(auth.access.role, 'inventory:view')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const sp = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10))
  const status = sp.get('status') ?? null

  let query = auth.supabase
    .from('inventory_audits')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    logger.error('[stock/audits] GET error', { message: error.message })
    captureException(new Error('[stock/audits] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити інвентаризації' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data,
    meta: { total: count ?? 0, page, pageSize: PAGE_SIZE },
  })
}

export async function POST(request: NextRequest) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  if (!hasPermission(auth.access.role, 'inventory:edit')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const warehouseIds = body.warehouseIds as string[] | undefined
  if (
    !warehouseIds ||
    !Array.isArray(warehouseIds) ||
    warehouseIds.length === 0
  ) {
    return NextResponse.json(
      { success: false, error: 'warehouseIds є обовʼязковим' },
      { status: 400 }
    )
  }

  const responsibleUserId =
    (body.responsibleUserId as string | null) ?? auth.user.id

  // Generate audit_number: INV-YY-NNNNNNN
  const { data: countRow } = await auth.supabase
    .from('inventory_audits')
    .select('id', { count: 'exact', head: true })
    .like(
      'audit_number',
      `INV-${new Date().getFullYear().toString().slice(-2)}-%`
    )

  const seq = ((countRow as unknown as number | null) ?? 0) + 1
  const yr = new Date().getFullYear().toString().slice(-2)
  const auditNumber = `INV-${yr}-${String(seq).padStart(7, '0')}`

  const { data, error } = await auth.supabase
    .from('inventory_audits')
    .insert({
      audit_number: auditNumber,
      responsible_user_id: responsibleUserId,
      warehouse_ids: warehouseIds,
      category_ids: (body.categoryIds as string[]) ?? [],
      brand_ids: (body.brandIds as string[]) ?? [],
      material_ids: (body.materialIds as string[]) ?? [],
      audit_date:
        (body.auditDate as string) ?? new Date().toISOString().split('T')[0],
      comment: (body.comment as string) ?? null,
    })
    .select()
    .single()

  if (error) {
    logger.error('[stock/audits] POST error', { message: error.message })
    captureException(new Error('[stock/audits] POST failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити інвентаризацію' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
