import { NextRequest, NextResponse } from 'next/server'
import {
  requireStockAdmin,
  isV2On,
  flagOff,
  stockNotFound,
} from '@/lib/stock-helpers'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  const { data, error } = await auth.supabase
    .from('inventory_audits')
    .select(
      `*, items:inventory_audit_items(
        id, audit_id, material_id, warehouse_id, qty_before, qty_actual,
        material:materials(id, name_uk, unit),
        warehouse:stock_warehouses(id, name_uk)
      )`
    )
    .eq('id', id)
    .single()

  if (error || !data) return stockNotFound()

  // Attach delta to each item
  type AuditItemRaw = {
    id: string
    qty_actual: number | null
    qty_before: number
    [key: string]: unknown
  }
  const typedData = data as typeof data & { items: AuditItemRaw[] }
  const auditWithDelta = {
    ...typedData,
    items: typedData.items.map((item: AuditItemRaw) => ({
      ...item,
      delta: item.qty_actual != null ? item.qty_actual - item.qty_before : null,
    })),
  }

  return NextResponse.json({ success: true, data: auditWithDelta })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  // Check audit exists and is draft
  const { data: audit } = await auth.supabase
    .from('inventory_audits')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (!audit) return stockNotFound()

  if (audit.status !== 'draft') {
    return NextResponse.json(
      { success: false, error: 'Інвентаризацію вже проведено або анульовано' },
      { status: 409 }
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

  // Body may contain top-level audit field updates (comment, auditDate)
  // OR itemUpdates: Array<{ itemId, qtyActual }>
  const itemUpdates = body.itemUpdates as
    | Array<{ itemId: string; qtyActual: number | null }>
    | undefined

  if (itemUpdates && itemUpdates.length > 0) {
    for (const upd of itemUpdates) {
      const { error: itemErr } = await auth.supabase
        .from('inventory_audit_items')
        .update({ qty_actual: upd.qtyActual })
        .eq('id', upd.itemId)
        .eq('audit_id', id)

      if (itemErr) {
        logger.error('[stock/audits/[id]] PATCH item error', {
          message: itemErr.message,
        })
        captureException(new Error('[stock/audits/[id]] PATCH item failed'), {
          supabaseError: itemErr,
        })
        return NextResponse.json(
          { success: false, error: 'Не вдалося оновити рядок' },
          { status: 500 }
        )
      }
    }
  }

  // Audit-level fields
  const auditUpdates: Record<string, unknown> = {}
  if (body.comment !== undefined) auditUpdates.comment = body.comment
  if (body.auditDate !== undefined) auditUpdates.audit_date = body.auditDate

  if (Object.keys(auditUpdates).length > 0) {
    const { error: auditErr } = await auth.supabase
      .from('inventory_audits')
      .update(auditUpdates)
      .eq('id', id)

    if (auditErr) {
      logger.error('[stock/audits/[id]] PATCH audit error', {
        message: auditErr.message,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося оновити інвентаризацію' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  if (!hasPermission(auth.access.role, 'inventory:edit')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { id } = await params

  const { data: audit } = await auth.supabase
    .from('inventory_audits')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (!audit) return stockNotFound()

  if (audit.status !== 'draft') {
    return NextResponse.json(
      { success: false, error: 'Можна видалити лише чернетку' },
      { status: 409 }
    )
  }

  const { error } = await auth.supabase
    .from('inventory_audits')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('[stock/audits/[id]] DELETE error', { message: error.message })
    captureException(new Error('[stock/audits/[id]] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити інвентаризацію' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
