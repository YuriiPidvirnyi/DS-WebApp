import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/appointments/[id]/summary
 * Returns minimal, non-sensitive appointment info for the success page.
 * Requires the caller to be authenticated as the appointment owner.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const { id } = await params

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('appointments')
      .select(
        'id, patient_name, guest_name, appointment_date, appointment_time, services(name_uk), patient_id'
      )
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      )
    }

    const isOwner = user && data.patient_id === user.id
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      )
    }

    const serviceName =
      (data.services as { name_uk?: string } | null)?.name_uk ?? ''

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        service: serviceName,
        date: data.appointment_date,
        time: data.appointment_time,
        name: data.patient_name || data.guest_name || '',
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
