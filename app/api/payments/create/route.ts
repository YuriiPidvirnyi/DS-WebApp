import { NextRequest, NextResponse } from 'next/server'
import { createPaymentData, isConfigured } from '@/lib/liqpay'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  if (!isConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Платіжна система не налаштована' },
      { status: 503 }
    )
  }

  let body: {
    appointmentId?: string
    amount?: number
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

  if (!body.appointmentId || !body.amount || body.amount <= 0) {
    return NextResponse.json(
      { success: false, error: 'Необхідно вказати ID запису та суму' },
      { status: 400 }
    )
  }

  const paymentData = createPaymentData({
    orderId: body.appointmentId,
    amount: body.amount,
    description:
      body.description || 'Оплата стоматологічних послуг - DentalStory',
    language: 'uk',
  })

  if (!paymentData) {
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити платіж' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: paymentData,
  })
}
