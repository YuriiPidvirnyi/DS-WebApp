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
      {
        userId: user.id,
      }
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
    const { error: softDeleteError } = await adminClient
      .from('patients')
      .update({ status: 'deleted' })
      .eq('id', user.id)

    if (softDeleteError) {
      captureException(
        new Error('[cabinet/delete-account] Soft-delete failed'),
        {
          supabaseError: softDeleteError,
          userId: user.id,
        }
      )
      return Response.json(
        { success: false, error: 'Failed to delete account data' },
        { status: 500 }
      )
    }

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    )

    if (authDeleteError) {
      captureException(
        new Error('[cabinet/delete-account] Auth user deletion failed'),
        {
          supabaseError: authDeleteError,
          userId: user.id,
        }
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
