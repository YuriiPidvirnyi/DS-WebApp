import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',')
  const body = rows
    .map(row => columns.map(col => escapeCSV(row[col])).join(','))
    .join('\n')
  return `${header}\n${body}`
}

export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

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

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const admin = await getAdminAccess(supabase, user.id)
  if (!admin || !hasPermission(admin.role, 'analytics:view')) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )
  }

  const { searchParams } = request.nextUrl
  const entity = searchParams.get('entity') || 'appointments'
  const format = searchParams.get('format') || 'csv'

  let data: Record<string, unknown>[]
  let columns: string[]
  let filename: string

  switch (entity) {
    case 'appointments': {
      const { data: rows } = await supabase
        .from('appointments')
        .select(
          'id, patient_name, guest_phone, guest_email, appointment_date, appointment_time, status, source, created_at'
        )
        .order('appointment_date', { ascending: false })
        .limit(5000)

      data = rows || []
      columns = [
        'id',
        'patient_name',
        'guest_phone',
        'guest_email',
        'appointment_date',
        'appointment_time',
        'status',
        'source',
        'created_at',
      ]
      filename = `appointments-${new Date().toISOString().slice(0, 10)}`
      break
    }
    case 'patients': {
      const { data: rows } = await supabase
        .from('patients')
        .select(
          'id, first_name, last_name, phone, email, total_visits, total_spent_uah, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(5000)

      data = rows || []
      columns = [
        'id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'total_visits',
        'total_spent_uah',
        'created_at',
      ]
      filename = `patients-${new Date().toISOString().slice(0, 10)}`
      break
    }
    case 'reviews': {
      const { data: rows } = await supabase
        .from('reviews')
        .select(
          'id, name, email, rating, service, doctor, comment, status, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(5000)

      data = rows || []
      columns = [
        'id',
        'name',
        'email',
        'rating',
        'service',
        'doctor',
        'comment',
        'status',
        'created_at',
      ]
      filename = `reviews-${new Date().toISOString().slice(0, 10)}`
      break
    }
    default:
      return NextResponse.json(
        { success: false, error: 'Unknown entity' },
        { status: 400 }
      )
  }

  if (format === 'json') {
    return NextResponse.json({ success: true, data })
  }

  const csv = toCSV(data, columns)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
