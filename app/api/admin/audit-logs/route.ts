import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// CSRF validation is not required for GET — idempotent read, no state mutation.
/** GET /api/admin/audit-logs?table=...&recordId=... */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
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

  if (
    !hasPermission(adminAccess.role, 'orders:view') &&
    !hasPermission(adminAccess.role, 'settings:view')
  ) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { searchParams } = request.nextUrl
  const table = searchParams.get('table')
  const recordId = searchParams.get('recordId')

  if (!table || !recordId) {
    return NextResponse.json(
      { success: false, error: 'Параметри table та recordId обовʼязкові' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select(
      'id, action, before_data, after_data, changed_at, admin_users:changed_by ( display_name )'
    )
    .eq('table_name', table)
    .eq('record_id', recordId)
    .order('changed_at', { ascending: true })
    .limit(50)

  if (error) {
    captureException(new Error('[audit-logs] Supabase GET error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити журнал' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}
