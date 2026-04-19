import { createClient } from '@/lib/supabase/server'
import { captureException } from '@/utils/sentry'

export const dynamic = 'force-dynamic'

export async function GET() {
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
    const [
      { data: patients, error: patientsError },
      { data: appointments, error: appointmentsError },
      { data: reviews, error: reviewsError },
      { data: chatSessions, error: chatSessionsError },
      { data: chatMessages, error: chatMessagesError },
    ] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('chat_sessions').select('*'),
      supabase.from('chat_messages').select('*'),
    ])

    if (
      patientsError ||
      appointmentsError ||
      reviewsError ||
      chatSessionsError ||
      chatMessagesError
    ) {
      const err =
        patientsError ??
        appointmentsError ??
        reviewsError ??
        chatSessionsError ??
        chatMessagesError
      captureException(new Error('[cabinet/export] Supabase query error'), {
        supabaseError: err,
        userId: user.id,
      })
      return Response.json(
        { success: false, error: 'Failed to export data' },
        { status: 500 }
      )
    }

    const payload = JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        patients: patients!,
        appointments: appointments!,
        reviews: reviews!,
        chat_sessions: chatSessions!,
        chat_messages: chatMessages!,
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
