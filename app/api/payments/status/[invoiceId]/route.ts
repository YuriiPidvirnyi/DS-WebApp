import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import {
  checkMonobankInvoiceStatus,
  type MonobankInvoiceStatus,
} from '@/lib/monobank'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TERMINAL_STATUSES: MonobankInvoiceStatus[] = [
  'success',
  'failure',
  'reversed',
  'expired',
]

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const { invoiceId } = await params

  const supabase = getServiceClient()
  if (!supabase) {
    captureException(
      new Error(
        '[payments/status] Service client unavailable — missing env vars'
      )
    )
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, status')
    .eq('invoice_id', invoiceId)
    .single()

  if (error || !payment) {
    logger.warn('[payments/status] Payment not found for invoiceId:', {
      invoiceId,
    })
    return NextResponse.json(
      { success: false, error: 'Платіж не знайдено' },
      { status: 404 }
    )
  }

  // Already terminal — return immediately without calling Monobank
  if (TERMINAL_STATUSES.includes(payment.status as MonobankInvoiceStatus)) {
    return NextResponse.json({
      success: true,
      data: { status: payment.status },
    })
  }

  // Non-terminal: sync from Monobank to catch expired (no webhook for expired)
  const mono = await checkMonobankInvoiceStatus(invoiceId)
  if (mono && mono.status !== payment.status) {
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: mono.status, monobank_data: mono })
      .eq('id', payment.id)

    if (updateError) {
      captureException(
        new Error('[payments/status] Failed to sync status from Monobank'),
        { updateError, invoiceId, newStatus: mono.status }
      )
    } else {
      logger.info('[payments/status] Synced status from Monobank', {
        invoiceId,
        from: payment.status,
        to: mono.status,
      })
    }

    return NextResponse.json({ success: true, data: { status: mono.status } })
  }

  return NextResponse.json({ success: true, data: { status: payment.status } })
}
