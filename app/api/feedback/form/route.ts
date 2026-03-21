import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type FeedbackBody = {
  form?: string
  rating?: 'up' | 'down'
  refId?: string
  comment?: string
}

function parseFeedbackBody(value: unknown): FeedbackBody | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as FeedbackBody
}

/** POST /api/feedback/form */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const parsed = parseFeedbackBody(await request.json().catch(() => null))
  if (!parsed) {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  const form = parsed.form?.trim()
  const rating = parsed.rating
  const refId = parsed.refId?.trim() || null
  const comment = parsed.comment?.trim() || null

  if (!form) {
    return NextResponse.json(
      { success: false, error: 'Поле form є обовʼязковим' },
      { status: 400 }
    )
  }

  if (rating !== 'up' && rating !== 'down') {
    return NextResponse.json(
      { success: false, error: 'Невалідний рейтинг' },
      { status: 400 }
    )
  }

  if (comment && comment.length > 2000) {
    return NextResponse.json(
      { success: false, error: 'Коментар занадто довгий' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    // The app can run without Supabase in some environments.
    return NextResponse.json({
      success: true,
      data: { recorded: false },
    })
  }

  const { error } = await supabase.from('form_feedback_events').insert({
    form,
    rating,
    ref_id: refId,
    comment,
    metadata: {
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    },
  })

  if (error) {
    // Keep user flow non-blocking if DB migration/policies are not yet applied.
    if (['42P01', 'PGRST205', '42501'].includes(error.code ?? '')) {
      return NextResponse.json({
        success: true,
        data: { recorded: false },
      })
    }

    console.error('[feedback/form] Supabase error:', error)
    return NextResponse.json(
      { success: false, error: 'Не вдалося зберегти відгук' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: { recorded: true },
    },
    { status: 201 }
  )
}
