import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  cancelMonobankPayment,
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
 * POST /api/payments/refund
 * Refund a finalized (success) payment. Do NOT call this on hold payments —
 * held funds not yet finalized auto-expire after 9 days.
 *
 * Body: { invoiceId: string, amount?: number }
 *   amount — optional partial refund in kopecks; omit to refund the full amount
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
    .select('id, appointment_id, status')
    .eq('invoice_id', invoiceId)
    .single()

  if (findErr || !payment) {
    return NextResponse.json(
      { success: false, error: 'Платіж не знайдено' },
      { status: 404 }
    )
  }

  // Refund only applies to finalized payments.
  // For holds: do nothing — Monobank auto-cancels held funds after 9 days.
  if (payment.status !== 'success') {
    return NextResponse.json(
      {
        success: false,
        error: `Повернення можливе тільки для статусу success, поточний: ${payment.status}`,
        hint:
          payment.status === 'hold'
            ? 'Холд скасується автоматично через 9 днів. Щоб скасувати негайно — викличте /api/payments/invalidate.'
            : undefined,
      },
      { status: 409 }
    )
  }

  const ok = await cancelMonobankPayment(invoiceId, amount, items)

  if (!ok) {
    captureException(new Error('[payments/refund] Monobank cancel failed'), {
      invoiceId,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося провести повернення' },
      { status: 502 }
    )
  }

  const { error: updateErr } = await svc
    .from('payments')
    .update({ status: 'reversed' })
    .eq('id', payment.id)

  if (updateErr) {
    captureException(
      new Error('[payments/refund] DB update failed after refund'),
      {
        updateErr,
        invoiceId,
      }
    )
  }

  await svc
    .from('appointments')
    .update({ is_paid: false })
    .eq('id', payment.appointment_id)

  logger.info('[payments/refund] Payment refunded', { invoiceId, amount })

  return NextResponse.json({ success: true })
}
