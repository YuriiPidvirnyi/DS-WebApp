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

/**
 * POST /api/stock/audits/:id/autofill
 * Sets qty_actual := qty_before for every NULL row in this audit.
 * Matches CliniCards "Заповнити автоматично" button.
 */
export async function POST(
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
      { success: false, error: 'Інвентаризацію вже проведено або анульовано' },
      { status: 409 }
    )
  }

  // Fetch all items that have no qty_actual yet
  const { data: items, error: fetchErr } = await auth.supabase
    .from('inventory_audit_items')
    .select('id, qty_before')
    .eq('audit_id', id)
    .is('qty_actual', null)

  if (fetchErr) {
    logger.error('[stock/audits/autofill] fetch error', {
      message: fetchErr.message,
    })
    captureException(new Error('[stock/audits/autofill] fetch failed'), {
      supabaseError: fetchErr,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося отримати рядки' },
      { status: 500 }
    )
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ success: true, rowsUpdated: 0 })
  }

  // Batch update: group by qty_before value to minimise round-trips
  const byQty = new Map<number, string[]>()
  for (const item of items) {
    const qty = item.qty_before as number
    if (!byQty.has(qty)) byQty.set(qty, [])
    byQty.get(qty)!.push(item.id as string)
  }

  for (const [qty, ids] of byQty) {
    const { error: updErr } = await auth.supabase
      .from('inventory_audit_items')
      .update({ qty_actual: qty })
      .in('id', ids)

    if (updErr) {
      logger.error('[stock/audits/autofill] update error', {
        message: updErr.message,
      })
      captureException(new Error('[stock/audits/autofill] update failed'), {
        supabaseError: updErr,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося оновити рядки' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true, rowsUpdated: items.length })
}
