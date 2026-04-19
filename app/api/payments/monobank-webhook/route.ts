import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  verifyMonobankWebhook,
  type MonobankWebhookPayload,
} from '@/lib/monobank'
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

export async function POST(request: NextRequest) {
  // Always return 200 to Monobank to prevent retries — log errors internally

  const xSign = request.headers.get('x-sign')
  if (!xSign) {
    logger.warn('[monobank-webhook] Missing x-sign header')
    return NextResponse.json(
      { ok: false, error: 'Missing signature' },
      { status: 401 }
    )
  }

  const body = Buffer.from(await request.arrayBuffer())

  if (!(await verifyMonobankWebhook(body, xSign))) {
    console.warn('[monobank-webhook] Invalid signature')
    return NextResponse.json(
      { ok: false, error: 'Invalid signature' },
      { status: 403 }
    )
  }

  let payload: MonobankWebhookPayload
  try {
    payload = JSON.parse(body.toString()) as MonobankWebhookPayload
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)), {
      context: 'monobank-webhook JSON parse',
    })
    return NextResponse.json({ ok: true })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    captureException(new Error('[monobank-webhook] Service client unavailable'))
    return NextResponse.json({ ok: true })
  }

  try {
    // Find the payment record
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('id, appointment_id, status')
      .eq('invoice_id', payload.invoiceId)
      .single()

    if (findError || !payment) {
      logger.warn('[monobank-webhook] Payment not found for invoiceId:', {
        invoiceId: payload.invoiceId,
      })
      // Return 200 to avoid Monobank retries — this is a data anomaly
      return NextResponse.json({ ok: true })
    }

    // Update payment record
    const updatePayload: Record<string, unknown> = {
      status: payload.status,
      monobank_data: payload,
    }
    if (payload.status === 'success') {
      updatePayload.paid_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', payment.id)

    if (updateError) {
      captureException(
        new Error('[monobank-webhook] Failed to update payment'),
        {
          updateError,
          paymentId: payment.id,
          invoiceId: payload.invoiceId,
        }
      )
    }

    // On success, mark appointment as paid
    if (payload.status === 'success') {
      const { error: apptError } = await supabase
        .from('appointments')
        .update({ is_paid: true })
        .eq('id', payment.appointment_id)

      if (apptError) {
        captureException(
          new Error('[monobank-webhook] Failed to mark appointment as paid'),
          { apptError, appointmentId: payment.appointment_id }
        )
      }
    }
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { invoiceId: payload.invoiceId }
    )
  }

  return NextResponse.json({ ok: true })
}
