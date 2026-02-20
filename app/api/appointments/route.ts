import { NextRequest, NextResponse } from 'next/server'
import {
  getAppointments,
  createAppointment,
  CliniCardsError,
  type AppointmentPayload,
} from '@/lib/clinicards-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  if (error instanceof CliniCardsError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }
  console.error('[appointments] unexpected error:', error)
  return NextResponse.json(
    { success: false, error: 'Внутрішня помилка сервера' },
    { status: 500 }
  )
}

/** GET /api/appointments?date=&doctorId=&patientId= */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const params: Record<string, string> = {}
  searchParams.forEach((v, k) => { params[k] = v })

  try {
    const data = await getAppointments(Object.keys(params).length ? params : undefined)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** POST /api/appointments */
export async function POST(request: NextRequest) {
  let body: Partial<AppointmentPayload>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  // Basic validation
  const required: (keyof AppointmentPayload)[] = [
    'patientId',
    'doctorId',
    'date',
    'time',
    'duration',
  ]
  const missing = required.filter(f => !body[f])
  if (missing.length) {
    return NextResponse.json(
      { success: false, error: `Відсутні поля: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const data = await createAppointment(body as AppointmentPayload)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
