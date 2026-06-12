import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { validateCSRF, csrfErrorResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

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

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    captureException(
      new Error('[cabinet/delete-account] SUPABASE_SERVICE_ROLE_KEY not set'),
      { userId: user.id }
    )
    return Response.json(
      { success: false, error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  const adminClient = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  try {
    // 1. Anonymize PII — soft-delete keeps the row for audit trail /
    //    treatment record integrity but strips all identifying information.
    const now = new Date().toISOString()
    const { error: softDeleteError } = await adminClient
      .from('patients')
      .update({
        deleted_at: now,
        first_name: 'Deleted',
        last_name: 'User',
        patronymic: null,
        email: null,
        phone: null,
        date_of_birth: null,
        address: null,
        medical_notes: null,
      })
      .eq('id', user.id)

    if (softDeleteError) {
      captureException(
        new Error('[cabinet/delete-account] Patient anonymization failed'),
        { supabaseError: softDeleteError, userId: user.id }
      )
      return Response.json(
        { success: false, error: 'Failed to delete account data' },
        { status: 500 }
      )
    }

    // 2. Cancel all future appointments for this patient.
    const { error: cancelError } = await adminClient
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('patient_id', user.id)
      .gte('appointment_date', now.slice(0, 10))
      .in('status', ['pending', 'confirmed'])

    if (cancelError) {
      // Non-fatal — log but continue with auth deletion so PII is removed
      captureException(
        new Error(
          '[cabinet/delete-account] Future appointment cancellation failed'
        ),
        { supabaseError: cancelError, userId: user.id }
      )
    }

    // 3. Delete the auth user — this revokes all sessions immediately.
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    )

    if (authDeleteError) {
      captureException(
        new Error('[cabinet/delete-account] Auth user deletion failed'),
        { supabaseError: authDeleteError, userId: user.id }
      )
      return Response.json(
        { success: false, error: 'Failed to delete auth account' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    captureException(new Error('[cabinet/delete-account] Unexpected error'), {
      cause: err,
      userId: user.id,
    })
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
