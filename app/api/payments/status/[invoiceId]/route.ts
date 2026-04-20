import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    .select('status')
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

  return NextResponse.json({ success: true, data: { status: payment.status } })
}
