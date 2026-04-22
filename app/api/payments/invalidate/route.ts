import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { invalidateMonobankInvoice, isMonobankConfigured } from '@/lib/monobank'
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
 * POST /api/payments/invalidate
 * Immediately cancel / remove a pending or held invoice at Monobank.
 * Use this to release a hold before the 9-day auto-expiry.
 * Do NOT call on already-finalized (success) payments — use /api/payments/refund instead.
 *
 * Body: { invoiceId: string }
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

  let body: { invoiceId?: string }
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

  const { invoiceId } = body

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

  if (payment.status === 'success') {
    return NextResponse.json(
      {
        success: false,
        error:
          'Не можна скасувати вже фіналізований платіж. Використайте /api/payments/refund.',
      },
      { status: 409 }
    )
  }

  if (payment.status === 'reversed' || payment.status === 'failure') {
    return NextResponse.json(
      {
        success: false,
        error: `Платіж вже у фінальному статусі: ${payment.status}`,
      },
      { status: 409 }
    )
  }

  const ok = await invalidateMonobankInvoice(invoiceId)

  if (!ok) {
    captureException(
      new Error('[payments/invalidate] Monobank invalidate failed'),
      { invoiceId }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося скасувати інвойс' },
      { status: 502 }
    )
  }

  const { error: updateErr } = await svc
    .from('payments')
    .update({ status: 'reversed' })
    .eq('id', payment.id)

  if (updateErr) {
    captureException(
      new Error('[payments/invalidate] DB update failed after invalidate'),
      { updateErr, invoiceId }
    )
  }

  logger.info('[payments/invalidate] Invoice invalidated', { invoiceId })

  return NextResponse.json({ success: true })
}
