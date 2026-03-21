import { NextRequest, NextResponse } from 'next/server'
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
  CliniCardsError,
} from '@/lib/clinicards-client'
import { getAdminAccess } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

function errorResponse(error: unknown) {
  if (error instanceof CliniCardsError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }
  console.error('[appointments/[id]] unexpected error:', error)
  return NextResponse.json(
    { success: false, error: 'Внутрішня помилка сервера' },
    { status: 500 }
  )
}

async function requireAdmin() {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  const adminAccess = await getAdminAccess(supabase, user.id)
  if (!adminAccess) {
    return NextResponse.json(
      { success: false, error: 'Недостатньо прав доступу' },
      { status: 403 }
    )
  }

  return null
}

/** GET /api/appointments/:id */
export async function GET(request: NextRequest, { params }: Params) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const authResponse = await requireAdmin()
  if (authResponse) return authResponse

  const { id } = await params
  try {
    const data = await getAppointment(id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** PATCH /api/appointments/:id */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const authResponse = await requireAdmin()
  if (authResponse) return authResponse

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

  try {
    const data = await updateAppointment(id, body)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** DELETE /api/appointments/:id */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const authResponse = await requireAdmin()
  if (authResponse) return authResponse

  const { id } = await params
  try {
    await deleteAppointment(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
