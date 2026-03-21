import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminAuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
}

export async function listAdminAuditLogs(
  supabase: SupabaseClient,
  options?: {
    tableName?: string
    action?: 'all' | 'INSERT' | 'UPDATE' | 'DELETE'
    changedBy?: string
    changedByIsNull?: boolean
    since?: string
    until?: string
    limit?: number
  }
): Promise<AdminAuditLog[]> {
  const limit = options?.limit ?? 50
  let query = supabase
    .from('admin_audit_logs')
    .select(
      'id, table_name, record_id, action, before_data, after_data, changed_by, changed_at'
    )
    .order('changed_at', { ascending: false })
    .limit(limit)

  if (options?.tableName && options.tableName !== 'all') {
    query = query.eq('table_name', options.tableName)
  }
  if (options?.action && options.action !== 'all') {
    query = query.eq('action', options.action)
  }
  if (options?.changedByIsNull) {
    query = query.is('changed_by', null)
  } else if (options?.changedBy) {
    query = query.eq('changed_by', options.changedBy)
  }
  if (options?.since) {
    query = query.gte('changed_at', options.since)
  }
  if (options?.until) {
    query = query.lte('changed_at', options.until)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  return (data || []) as AdminAuditLog[]
}

export async function restoreFromAuditLog(
  supabase: SupabaseClient,
  logId: string,
  options?: {
    reason?: string
    comment?: string
  }
): Promise<{
  restored: boolean
  table: string
  record_id: string
  reverted_action: string
}> {
  const { data, error } = await supabase.rpc('admin_restore_audit_log', {
    p_log_id: logId,
    p_reason: options?.reason ?? null,
    p_comment: options?.comment ?? null,
  })

  if (error) throw error

  return data as {
    restored: boolean
    table: string
    record_id: string
    reverted_action: string
  }
}
