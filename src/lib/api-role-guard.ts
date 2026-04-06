/**
 * Server-side RBAC helpers for API routes.
 *
 * Usage:
 *   const guard = await requireRole(request, ['admin', 'superadmin'])
 *   if (!guard.ok) return guard.response
 *   // guard.identity is typed AdminIdentity
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import {
  hasPermission,
  type AdminRole,
  type Permission,
} from '@/lib/permissions'

export interface GuardOk {
  ok: true
  userId: string
  role: AdminRole
  doctorId: string | null
}
export interface GuardFail {
  ok: false
  response: NextResponse
}
export type GuardResult = GuardOk | GuardFail

/** Require the caller to be authenticated as an admin_users member with one of the given roles. */
export async function requireRole(
  _request: NextRequest,
  allowedRoles: AdminRole[]
): Promise<GuardResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Service temporarily unavailable' },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  const access = await getAdminAccess(supabase, user.id)
  if (!access) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
    }
  }

  if (!allowedRoles.includes(access.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    userId: user.id,
    role: access.role,
    doctorId: access.doctorId,
  }
}

/** Require the caller to have a specific permission. */
export async function requirePermission(
  _request: NextRequest,
  permission: Permission
): Promise<GuardResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Service temporarily unavailable' },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  const access = await getAdminAccess(supabase, user.id)
  if (!access) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
    }
  }

  if (!hasPermission(access.role, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    userId: user.id,
    role: access.role,
    doctorId: access.doctorId,
  }
}
