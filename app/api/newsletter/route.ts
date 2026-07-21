import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
  verifyTurnstileServer,
  turnstileInvalidResponse,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST /api/newsletter — subscribe email to newsletter */
export async function POST(request: NextRequest) {
  // CSRF validation
  if (!validateCSRF(request)) return csrfErrorResponse()

  // Rate limiting: 5 requests per minute (prevent abuse)
  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  let body: { email?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  const cfToken = (body as Record<string, unknown>).cf_turnstile_response as
    string | undefined
  const { valid: botOk } = await verifyTurnstileServer(cfToken, request)
  if (!botOk) return turnstileInvalidResponse()

  const email = body.email?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, error: 'Невалідний email' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      )
    }

    // Simple insert — handle duplicate gracefully
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })

    if (error) {
      // Duplicate email (unique constraint) — treat as success
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          data: { subscribed: true, alreadyExists: true },
        })
      }

      captureException(new Error('[newsletter] Supabase error'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Помилка збереження. Спробуйте пізніше.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { subscribed: true },
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
