import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

const reviewSchema = z.object({
  patientName: z.string().min(1, "Ім'я є обов'язковим").max(100),
  rating: z
    .number()
    .int('Рейтинг має бути цілим числом від 1 до 5')
    .min(1, 'Рейтинг має бути цілим числом від 1 до 5')
    .max(5, 'Рейтинг має бути цілим числом від 1 до 5'),
  visitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат дати (РРРР-ММ-ДД)')
    .refine(val => new Date(val) <= new Date(), {
      message: 'Дата візиту не може бути в майбутньому',
    }),
  comment: z.string().max(2000),
  email: z.string().email('Невірний формат email').optional(),
  service: z.string().max(200).optional(),
  doctor: z.string().max(100).optional(),
  wouldRecommend: z.boolean().default(true),
})

type ReviewInput = z.infer<typeof reviewSchema>

/** GET /api/reviews — list approved reviews */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      )
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        'id, name, rating, service, doctor, comment, visit_date, would_recommend, created_at'
      )
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      captureException(new Error('[reviews] Supabase GET error'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Помилка завантаження відгуків' },
        { status: 500 }
      )
    }

    // Map snake_case DB columns to camelCase for frontend
    const items = (reviews || []).map(r => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      service: r.service,
      doctor: r.doctor,
      comment: r.comment,
      visitDate: r.visit_date,
      wouldRecommend: r.would_recommend,
      createdAt: r.created_at,
    }))

    return NextResponse.json({ success: true, data: { items } })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

/** POST /api/reviews — submit a new review (pending moderation) */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  let rawBody: unknown

  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  const cfToken = (rawBody as Record<string, unknown>).cf_turnstile_response as
    string | undefined
  const { valid: botOk } = await verifyTurnstileServer(cfToken, request)
  if (!botOk) return turnstileInvalidResponse()

  const parseResult = reviewSchema.safeParse(rawBody)
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message ?? 'Невірний запит'
    return NextResponse.json(
      { success: false, error: firstError },
      { status: 400 }
    )
  }

  const body: ReviewInput = parseResult.data

  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      )
    }

    const reviewId = crypto.randomUUID()

    const { error } = await supabase.from('reviews').insert({
      id: reviewId,
      name: body.patientName.trim(),
      email: body.email?.trim() || null,
      rating: body.rating,
      service: body.service?.trim() || null,
      doctor: body.doctor?.trim() || null,
      comment: body.comment.trim(),
      visit_date: body.visitDate,
      would_recommend: body.wouldRecommend,
      status: 'pending', // Requires admin moderation
    })

    if (error) {
      captureException(new Error('[reviews] Supabase POST error'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Помилка збереження відгуку' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { created: true, id: reviewId },
      },
      { status: 201 }
    )
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
