import { NextRequest, NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  hasPermission,
  hasAnyPermission,
  hasDoctorScope,
} from '@/lib/permissions'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Valid forward status transitions. Absent key = terminal state (no transitions allowed).
const ALLOWED_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  pending: new Set(['confirmed', 'cancelled', 'no_show']),
  confirmed: new Set(['completed', 'cancelled', 'no_show']),
  completed: new Set([]), // terminal
  cancelled: new Set([]), // terminal
  no_show: new Set(['pending']), // allow re-scheduling
}

type Params = { params: Promise<{ id: string }> }

const APPOINTMENT_SELECT =
  'id, patient_id, patient_name, guest_name, guest_phone, guest_email, appointment_date, appointment_time, duration_minutes, status, source, notes, created_at, services(name_uk), doctors(first_name,last_name)'

async function requireAdmin() {
  const supabase = await createClient()
  if (!supabase) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Потрібна авторизація' },
        { status: 401 }
      ),
    }
  }

  const adminAccess = await getAdminAccess(supabase, user.id)
  if (!adminAccess) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      ),
    }
  }

  return { supabase, access: adminAccess }
}

/** GET /api/appointments/:id */
export async function GET(request: NextRequest, { params }: Params) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  if (
    !hasAnyPermission(auth.access!.role, [
      'appointments:view_all',
      'appointments:view_own',
    ])
  ) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { id } = await params
  const { data, error } = await auth
    .supabase!.from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    captureException(new Error('[appointments/[id]] Supabase GET error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити запис' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Запис не знайдено' },
      { status: 404 }
    )
  }

  // Doctor scope: can only view own appointments
  if (
    hasDoctorScope(auth.access!.role) &&
    (data as Record<string, unknown>).doctor_id !== auth.access!.doctorId
  ) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return NextResponse.json({ success: true, data })
}

const PATCHABLE_FIELDS = new Set([
  'status',
  'appointment_date',
  'appointment_time',
  'duration_minutes',
  'notes',
  'doctor_id',
  'service_id',
])

/** PATCH /api/appointments/:id */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  if (!hasPermission(auth.access!.role, 'appointments:edit')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (PATCHABLE_FIELDS.has(key)) {
      updates[key] = value
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  const { data: currentRow } = updates.status
    ? await auth
        .supabase!.from('appointments')
        .select('status, guest_email')
        .eq('id', id)
        .maybeSingle()
    : { data: null }

  if (updates.status) {
    if (!currentRow) {
      return NextResponse.json(
        { success: false, error: 'Запис не знайдено' },
        { status: 404 }
      )
    }
    if (updates.status !== currentRow.status) {
      const allowed = ALLOWED_TRANSITIONS[currentRow.status ?? '']
      if (!allowed || !allowed.has(updates.status as string)) {
        return NextResponse.json(
          {
            success: false,
            error: `Перехід зі статусу '${currentRow.status}' у '${updates.status}' не дозволений`,
          },
          { status: 422 }
        )
      }
    }
  }

  const { data, error } = await auth
    .supabase!.from('appointments')
    .update(updates)
    .eq('id', id)
    .select(APPOINTMENT_SELECT)
    .maybeSingle()

  if (error) {
    captureException(new Error('[appointments/[id]] Supabase update error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити запис' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Запис не знайдено' },
      { status: 404 }
    )
  }

  if (
    updates.status === 'cancelled' &&
    currentRow?.status !== 'cancelled' &&
    currentRow?.guest_email
  ) {
    await auth
      .supabase!.from('notification_events')
      .insert({
        type: 'appointment_cancellation',
        appointment_id: id,
        recipient_email: currentRow.guest_email,
        status: 'queued',
        details: { cancelledBy: 'admin' },
      })
      .then(({ error: notifErr }) => {
        if (notifErr) {
          logger.warn(
            '[appointments/[id]] Failed to queue cancellation email:',
            { data: notifErr.message }
          )
        }
      })
  }

  return NextResponse.json({ success: true, data })
}

/** DELETE /api/appointments/:id */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  if (!hasPermission(auth.access!.role, 'appointments:cancel')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { id } = await params

  const { error } = await auth
    .supabase!.from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    captureException(new Error('[appointments/[id]] Supabase delete error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити запис' },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
