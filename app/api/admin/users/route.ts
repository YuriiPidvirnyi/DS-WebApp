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

/** GET /api/admin/users — list all admin_users (users:view) */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const guard = await requirePermission(request, 'users:view')
  if (!guard.ok) return guard.response

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    )
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select(
      'id, display_name, role, phone, specialization, doctor_id, last_login_at, created_at'
    )
    .order('created_at', { ascending: true })

  if (error) {
    captureException(new Error('[admin/users] Fetch error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to load users' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

/** POST /api/admin/users — create a new admin_user entry (users:manage) */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const guard = await requirePermission(request, 'users:manage')
  if (!guard.ok) return guard.response

  let body: {
    id?: string
    display_name?: string
    role?: string
    phone?: string
    specialization?: string
    doctor_id?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { id, display_name, role, phone, specialization, doctor_id } = body

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { success: false, error: 'id is required (Supabase auth user ID)' },
      { status: 400 }
    )
  }
  if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json(
      {
        success: false,
        error: `role must be one of: ${ADMIN_ROLES.join(', ')}`,
      },
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

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      id,
      display_name: display_name?.trim() || null,
      role: role as AdminRole,
      phone: phone?.trim() || null,
      specialization: specialization?.trim() || null,
      doctor_id: doctor_id || null,
    })
    .select(
      'id, display_name, role, phone, specialization, doctor_id, created_at'
    )
    .single()

  if (error) {
    captureException(new Error('[admin/users] Insert error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
