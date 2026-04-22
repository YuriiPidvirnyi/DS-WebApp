import { NextRequest, NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/lib/supabase/server'
import {
  generateMonoPayPayload,
  isMonoPayConfigured,
  isMonobankConfigured,
  type BasketOrder,
} from '@/lib/monobank'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua'

/**
 * GET /api/payments/monopay-init
 *
 * Returns a signed MonoPay button payload for the JS widget.
 * Requires auth — only authenticated patients can initiate payments.
 *
 * Query params:
 *   appointmentId  — required
 *   amountKopecks  — required (integer)
 *   description    — optional
 *   paymentType    — optional: 'debit' | 'hold' (default: 'debit')
 */
export async function GET(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  if (!isMonobankConfigured() || !isMonoPayConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Платіжна система не налаштована' },
      { status: 503 }
    )
  }

  // Require authenticated user
  let userId: string | null = null
  try {
    const userClient = await createUserClient()
    if (userClient) {
      const {
        data: { user },
      } = await userClient.auth.getUser()
      userId = user?.id ?? null
    }
  } catch {
    // fall through to 401 below
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Необхідна авторизація' },
      { status: 401 }
    )
  }

  const { searchParams } = request.nextUrl
  const appointmentId = searchParams.get('appointmentId')
  const amountParam = searchParams.get('amountKopecks')
  const description =
    searchParams.get('description') ||
    'Оплата стоматологічних послуг - DentalStory'
  const paymentType =
    searchParams.get('paymentType') === 'hold' ? 'hold' : 'debit'

  if (!appointmentId || !amountParam) {
    return NextResponse.json(
      { success: false, error: 'appointmentId та amountKopecks обовʼязкові' },
      { status: 400 }
    )
  }

  const amountKopecks = parseInt(amountParam, 10)
  if (!Number.isInteger(amountKopecks) || amountKopecks <= 0) {
    return NextResponse.json(
      { success: false, error: 'amountKopecks має бути цілим числом > 0' },
      { status: 400 }
    )
  }

  try {
    const result = await generateMonoPayPayload({
      appointmentId,
      amountKopecks,
      description,
      redirectUrl: `${SITE_URL}/booking/payment-result`,
      webHookUrl: `${SITE_URL}/api/payments/monobank-webhook`,
      paymentType,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Не вдалося ініціалізувати платіж',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payments/monopay-init
 *
 * Same as GET but accepts a `basket` body for fiscalized payments.
 *
 * Body: { appointmentId, amountKopecks, description?, paymentType?, basket? }
 */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  if (!isMonobankConfigured() || !isMonoPayConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Платіжна система не налаштована' },
      { status: 503 }
    )
  }

  let userId: string | null = null
  try {
    const userClient = await createUserClient()
    if (userClient) {
      const {
        data: { user },
      } = await userClient.auth.getUser()
      userId = user?.id ?? null
    }
  } catch {
    // fall through
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Необхідна авторизація' },
      { status: 401 }
    )
  }

  let body: {
    appointmentId?: string
    amountKopecks?: number
    description?: string
    paymentType?: 'debit' | 'hold'
    basket?: BasketOrder
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  const { appointmentId, amountKopecks, basket } = body
  const description =
    body.description || 'Оплата стоматологічних послуг - DentalStory'
  const paymentType = body.paymentType === 'hold' ? 'hold' : 'debit'

  if (!appointmentId || !amountKopecks) {
    return NextResponse.json(
      { success: false, error: 'appointmentId та amountKopecks обовʼязкові' },
      { status: 400 }
    )
  }

  if (!Number.isInteger(amountKopecks) || amountKopecks <= 0) {
    return NextResponse.json(
      { success: false, error: 'amountKopecks має бути цілим числом > 0' },
      { status: 400 }
    )
  }

  try {
    const result = await generateMonoPayPayload({
      appointmentId,
      amountKopecks,
      description,
      redirectUrl: `${SITE_URL}/booking/payment-result`,
      webHookUrl: `${SITE_URL}/api/payments/monobank-webhook`,
      paymentType,
      basket,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Не вдалося ініціалізувати платіж',
      },
      { status: 500 }
    )
  }
}
