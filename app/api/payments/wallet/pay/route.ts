import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { payWithCardToken, isMonobankConfigured } from '@/lib/monobank'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  if (!isMonobankConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Платіжна система не налаштована' },
      { status: 503 }
    )
  }

  const userClient = await createUserClient()
  if (!userClient) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  let body: {
    appointmentId?: string
    amountKopecks?: number
    cardToken?: string
    description?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  if (!body.appointmentId || !body.amountKopecks || !body.cardToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'Необхідно вказати appointmentId, amountKopecks та cardToken',
      },
      { status: 400 }
    )
  }

  const { appointmentId, amountKopecks, cardToken, description } = body

  const svc = getServiceClient()
  if (!svc) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  // Verify appointment belongs to this user
  const { data: appointment, error: apptErr } = await svc
    .from('appointments')
    .select('id, patient_id')
    .eq('id', appointmentId)
    .single()

  if (apptErr || !appointment || appointment.patient_id !== user.id) {
    return NextResponse.json(
      { success: false, error: 'Запис не знайдено' },
      { status: 404 }
    )
  }

  // Verify the card belongs to this user
  const { data: card, error: cardErr } = await svc
    .from('patient_wallet_cards')
    .select('id')
    .eq('user_id', user.id)
    .eq('card_token', cardToken)
    .single()

  if (cardErr || !card) {
    return NextResponse.json(
      { success: false, error: 'Картку не знайдено' },
      { status: 404 }
    )
  }

  // Check for existing active payment
  const { data: existingPayment } = await svc
    .from('payments')
    .select('id, status')
    .eq('appointment_id', appointmentId)
    .not('status', 'in', '("failure","expired","reversed","cancelled")')
    .maybeSingle()

  if (existingPayment) {
    return NextResponse.json(
      { success: false, error: 'Платіж вже існує для цього запису' },
      { status: 409 }
    )
  }

  try {
    const result = await payWithCardToken({
      cardToken,
      appointmentId,
      amountKopecks,
      description: description || 'Оплата стоматологічних послуг - DentalStory',
      redirectUrl: `${SITE_URL}/booking/payment-result`,
      webHookUrl: `${SITE_URL}/api/payments/monobank-webhook`,
    })

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Не вдалося ініціювати платіж' },
        { status: 502 }
      )
    }

    // Persist payment record
    await svc.from('payments').insert({
      appointment_id: appointmentId,
      invoice_id: result.invoiceId,
      amount_kopecks: amountKopecks,
      payment_mode: 'full',
      status: result.status,
    })

    // Update last_used_at on the card
    await svc
      .from('patient_wallet_cards')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', card.id)

    // Immediately mark appointment paid on synchronous success
    if (result.status === 'success') {
      await svc
        .from('appointments')
        .update({ is_paid: true })
        .eq('id', appointmentId)
    }

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: result.invoiceId,
        status: result.status,
        // tdsUrl present means 3DS is required — client must redirect user
        tdsUrl: result.tdsUrl ?? null,
      },
    })
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { appointmentId, cardToken }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося провести платіж' },
      { status: 500 }
    )
  }
}
