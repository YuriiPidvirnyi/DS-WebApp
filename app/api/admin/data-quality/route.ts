import { NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface DataQualityIssue {
  key: string
  label: string
  count: number
  severity: 'high' | 'medium' | 'low'
  hint: string
}

export interface DataQualityResponse {
  success: boolean
  issues?: DataQualityIssue[]
  totalIssues?: number
  checkedAt?: string
  error?: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminAccess = await getAdminAccess(supabase, user.id)
    if (!adminAccess || !hasPermission(adminAccess.role, 'analytics:view')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Run all checks in parallel — each returns a count
    const [
      apptNoService,
      apptNoDoctor,
      patientsNoEmail,
      treatmentNoDoctor,
      pendingTooLong,
    ] = await Promise.all([
      // Appointments without a service
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .is('service_id', null),
      // Appointments without a doctor
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .is('doctor_id', null),
      // Registered patients without an email address
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .is('email', null),
      // Treatment records not linked to a doctor
      supabase
        .from('treatment_records')
        .select('id', { count: 'exact', head: true })
        .is('doctor_id', null),
      // Appointments still in 'pending' for more than 7 days (likely forgotten)
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ])

    const raw: Array<Omit<DataQualityIssue, 'count'> & { count: number }> = [
      {
        key: 'appointments_no_service',
        label: 'Appointments without a service',
        count: apptNoService.count ?? 0,
        severity: 'high',
        hint: 'Go to Appointments and assign a service to each affected record.',
      },
      {
        key: 'appointments_no_doctor',
        label: 'Appointments without a doctor',
        count: apptNoDoctor.count ?? 0,
        severity: 'high',
        hint: 'Go to Appointments and assign a doctor to each affected record.',
      },
      {
        key: 'patients_no_email',
        label: 'Patients missing email address',
        count: patientsNoEmail.count ?? 0,
        severity: 'medium',
        hint: 'Email is required for reminders and confirmations. Ask the patient on their next visit.',
      },
      {
        key: 'treatment_records_no_doctor',
        label: 'Treatment records without a doctor',
        count: treatmentNoDoctor.count ?? 0,
        severity: 'medium',
        hint: 'Open each treatment record and assign the responsible doctor.',
      },
      {
        key: 'appointments_pending_stale',
        label: 'Pending appointments older than 7 days',
        count: pendingTooLong.count ?? 0,
        severity: 'low',
        hint: 'These were likely not followed up. Confirm, cancel, or contact the patient.',
      },
    ]

    const issues: DataQualityIssue[] = raw.filter(i => i.count > 0)
    const totalIssues = issues.reduce((s, i) => s + i.count, 0)

    return NextResponse.json({
      success: true,
      issues,
      totalIssues,
      checkedAt: new Date().toISOString(),
    } satisfies DataQualityResponse)
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
