import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { requirePermission } from '@/lib/api-role-guard'
import { ADMIN_ROLES, type AdminRole } from '@/lib/permissions'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

/** PATCH /api/admin/users/[id] — update role/profile (users:manage) */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const guard = await requirePermission(request, 'users:manage')
  if (!guard.ok) return guard.response

  const { id } = await params

  let body: {
    display_name?: string
    role?: string
    phone?: string
    specialization?: string
    doctor_id?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }

  if (
    body.role !== undefined &&
    !(ADMIN_ROLES as readonly string[]).includes(body.role)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `role must be one of: ${ADMIN_ROLES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  // Prevent non-superadmin from granting superadmin role
  if (body.role === 'superadmin' && guard.role !== 'superadmin') {
    return NextResponse.json(
      { success: false, error: 'Only superadmin can assign superadmin role' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.display_name !== undefined)
    updates.display_name = body.display_name?.trim() || null
  if (body.role !== undefined) updates.role = body.role as AdminRole
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null
  if (body.specialization !== undefined)
    updates.specialization = body.specialization?.trim() || null
  if ('doctor_id' in body) updates.doctor_id = body.doctor_id || null

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select('id, display_name, role, phone, specialization, doctor_id')
    .single()

  if (error) {
    captureException(new Error('[admin/users/id] Update error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

/** DELETE /api/admin/users/[id] — remove from admin_users (users:manage, superadmin only) */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const guard = await requirePermission(request, 'users:manage')
  if (!guard.ok) return guard.response

  // Only superadmin can fully revoke access
  if (guard.role !== 'superadmin') {
    return NextResponse.json(
      { success: false, error: 'Only superadmin can remove admin access' },
      { status: 403 }
    )
  }

  const { id } = await params

  // Prevent self-deletion
  if (id === guard.userId) {
    return NextResponse.json(
      { success: false, error: 'Cannot remove your own admin access' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    )
  }

  const { error } = await supabase.from('admin_users').delete().eq('id', id)

  if (error) {
    captureException(new Error('[admin/users/id] Delete error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to remove user' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
