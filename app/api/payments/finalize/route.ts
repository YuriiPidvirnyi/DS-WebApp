import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  finalizeMonobankInvoice,
  isHoldExpiringSoon,
  isMonobankConfigured,
  type BasketOrderItem,
} from '@/lib/monobank'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  return Boolean(secret && auth === `Bearer ${secret}`)
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * POST /api/payments/finalize
 * Capture a held invoice after the service/order has been delivered.
 *
 * Body: { invoiceId: string, amount?: number }
 *   amount — optional partial capture in kopecks; omit to capture full held amount
 *
 * Auth: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isMonobankConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Платіжна система не налаштована' },
      { status: 503 }
    )
  }

  let body: { invoiceId?: string; amount?: number; items?: BasketOrderItem[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  if (!body.invoiceId) {
    return NextResponse.json(
      { success: false, error: 'invoiceId обовʼязковий' },
      { status: 400 }
    )
  }

  const { invoiceId, amount, items } = body

  const svc = getServiceClient()
  if (!svc) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const { data: payment, error: findErr } = await svc
    .from('payments')
    .select('id, appointment_id, status, hold_at, payment_type')
    .eq('invoice_id', invoiceId)
    .single()

  if (findErr || !payment) {
    return NextResponse.json(
      { success: false, error: 'Платіж не знайдено' },
      { status: 404 }
    )
  }

  if (payment.status !== 'hold') {
    return NextResponse.json(
      {
        success: false,
        error: `Фіналізація можлива тільки для статусу hold, поточний: ${payment.status}`,
      },
      { status: 409 }
    )
  }

  // Warn if the hold is approaching Monobank's 9-day auto-expiry
  if (payment.hold_at && isHoldExpiringSoon(payment.hold_at as string)) {
    logger.warn(
      '[payments/finalize] Hold is 8+ days old — risk of auto-expiry',
      {
        invoiceId,
        holdAt: payment.hold_at,
      }
    )
  }

  const ok = await finalizeMonobankInvoice(invoiceId, amount, items)

  if (!ok) {
    captureException(
      new Error('[payments/finalize] Monobank finalize failed'),
      { invoiceId }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося зафіналізувати платіж' },
      { status: 502 }
    )
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await svc
    .from('payments')
    .update({ status: 'success', paid_at: now, finalized_at: now })
    .eq('id', payment.id)

  if (updateErr) {
    captureException(
      new Error('[payments/finalize] DB update failed after finalize'),
      {
        updateErr,
        invoiceId,
      }
    )
  }

  await svc
    .from('appointments')
    .update({ is_paid: true })
    .eq('id', payment.appointment_id)

  logger.info('[payments/finalize] Invoice finalized', { invoiceId, amount })

  return NextResponse.json({ success: true })
}
