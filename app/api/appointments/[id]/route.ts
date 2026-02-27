import { NextRequest, NextResponse } from 'next/server'
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
  CliniCardsError,
} from '@/lib/clinicards-client'

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

/** GET /api/appointments/:id */
export async function GET(_request: NextRequest, { params }: Params) {
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
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    await deleteAppointment(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
