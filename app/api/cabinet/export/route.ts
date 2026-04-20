import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const supabase = await createClient()

  if (!supabase) {
    return Response.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    )
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Defense-in-depth: explicitly scope every query to the authenticated user.
    // RLS already enforces this at the DB layer; the app-layer filters ensure
    // a misconfigured policy can never leak another patient's data.
    const [
      { data: patients, error: patientsError },
      { data: appointments, error: appointmentsError },
      { data: reviews, error: reviewsError },
      { data: chatSessions, error: chatSessionsError },
    ] = await Promise.all([
      supabase.from('patients').select('*').eq('id', user.id),
      supabase.from('appointments').select('*').eq('patient_id', user.id),
      supabase.from('reviews').select('*').eq('patient_id', user.id),
      supabase.from('chat_sessions').select('*').eq('patient_id', user.id),
    ])

    if (
      patientsError ??
      appointmentsError ??
      reviewsError ??
      chatSessionsError
    ) {
      const err =
        patientsError ?? appointmentsError ?? reviewsError ?? chatSessionsError
      captureException(new Error('[cabinet/export] Supabase query error'), {
        supabaseError: err,
        userId: user.id,
      })
      return Response.json(
        { success: false, error: 'Failed to export data' },
        { status: 500 }
      )
    }

    // chat_messages have no direct patient_id — filter via session ownership
    const sessionIds = (chatSessions ?? []).map(s => s.id as string)
    const { data: chatMessages, error: chatMessagesError } =
      sessionIds.length > 0
        ? await supabase
            .from('chat_messages')
            .select('*')
            .in('session_id', sessionIds)
        : { data: [], error: null }

    if (chatMessagesError) {
      captureException(
        new Error('[cabinet/export] chat_messages query error'),
        { supabaseError: chatMessagesError, userId: user.id }
      )
      return Response.json(
        { success: false, error: 'Failed to export data' },
        { status: 500 }
      )
    }

    const payload = JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        patients: patients ?? [],
        appointments: appointments ?? [],
        reviews: reviews ?? [],
        chat_sessions: chatSessions ?? [],
        chat_messages: chatMessages ?? [],
      },
      null,
      2
    )

    return new Response(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="my-data.json"',
      },
    })
  } catch (err) {
    captureException(new Error('[cabinet/export] Unexpected error'), {
      cause: err,
      userId: user.id,
    })
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
