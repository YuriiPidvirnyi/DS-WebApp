import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { createMonobankInvoice, isMonobankConfigured } from '@/lib/monobank'
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

  let body: {
    appointmentId?: string
    amountKopecks?: number
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

  if (!body.appointmentId || !body.amountKopecks || body.amountKopecks <= 0) {
    return NextResponse.json(
      { success: false, error: 'Необхідно вказати ID запису та суму' },
      { status: 400 }
    )
  }

  const { appointmentId, amountKopecks, description } = body

  // Try to get the authenticated user for card tokenization
  let authenticatedUserId: string | null = null
  try {
    const userClient = await createUserClient()
    if (userClient) {
      const {
        data: { user },
      } = await userClient.auth.getUser()
      authenticatedUserId = user?.id ?? null
    }
  } catch {
    // Non-fatal — booking can proceed without card saving
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  try {
    // Verify appointment exists
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select('id')
      .eq('id', appointmentId)
      .single()

    if (apptError || !appointment) {
      return NextResponse.json(
        { success: false, error: 'Запис не знайдено' },
        { status: 404 }
      )
    }

    // Check for existing active payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('appointment_id', appointmentId)
      .not('status', 'in', '("failure","expired","reversed")')
      .maybeSingle()

    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Платіж вже існує для цього запису' },
        { status: 409 }
      )
    }

    // Create Monobank invoice — save card when user is authenticated
    const result = await createMonobankInvoice({
      appointmentId,
      amountKopecks,
      description: description || 'Оплата стоматологічних послуг - DentalStory',
      redirectUrl: `${SITE_URL}/booking/payment-result`,
      webHookUrl: `${SITE_URL}/api/payments/monobank-webhook`,
      ...(authenticatedUserId
        ? { saveCardData: { saveCard: true, walletId: authenticatedUserId } }
        : {}),
    })

    // Persist payment record
    const { error: insertError } = await supabase.from('payments').insert({
      appointment_id: appointmentId,
      invoice_id: result.invoiceId,
      amount_kopecks: amountKopecks,
      payment_mode: 'full',
      status: 'created',
    })

    if (insertError) {
      captureException(
        new Error('[payments/create] Failed to insert payment'),
        {
          insertError,
          invoiceId: result.invoiceId,
        }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося зберегти платіж' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: result.invoiceId,
        pageUrl: result.pageUrl,
      },
    })
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { appointmentId, amountKopecks }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити платіж' },
      { status: 500 }
    )
  }
}
