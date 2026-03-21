import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listAdminAuditLogs, restoreFromAuditLog } from './audit'

function createQueryBuilder<T>(result: T) {
  const builder: Record<string, unknown> = {
    select: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    then: (resolve: (value: T) => unknown) =>
      Promise.resolve(result).then(resolve),
  }

  ;(['select', 'order', 'limit', 'eq', 'is', 'gte', 'lte'] as const).forEach(
    method => {
      ;(builder[method] as ReturnType<typeof vi.fn>).mockReturnValue(builder)
    }
  )

  return builder as {
    select: ReturnType<typeof vi.fn>
    order: ReturnType<typeof vi.fn>
    limit: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    is: ReturnType<typeof vi.fn>
    gte: ReturnType<typeof vi.fn>
    lte: ReturnType<typeof vi.fn>
  }
}

describe('audit supabase service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds filtered audit logs query with all supported filters', async () => {
    const data = [
      {
        id: '1',
        table_name: 'doctors',
        record_id: 'r1',
        action: 'UPDATE',
        before_data: { is_active: true },
        after_data: { is_active: false },
        changed_by: 'u1',
        changed_at: '2026-03-21T00:00:00.000Z',
      },
    ]

    const queryBuilder = createQueryBuilder({ data, error: null })
    const from = vi.fn().mockReturnValue(queryBuilder)

    const supabase = { from } as unknown as Parameters<
      typeof listAdminAuditLogs
    >[0]

    const result = await listAdminAuditLogs(supabase, {
      tableName: 'doctors',
      action: 'UPDATE',
      changedBy: 'u1',
      since: '2026-03-20T00:00:00.000Z',
      until: '2026-03-22T00:00:00.000Z',
      limit: 10,
    })

    expect(from).toHaveBeenCalledWith('admin_audit_logs')
    expect(queryBuilder.eq).toHaveBeenCalledWith('table_name', 'doctors')
    expect(queryBuilder.eq).toHaveBeenCalledWith('action', 'UPDATE')
    expect(queryBuilder.eq).toHaveBeenCalledWith('changed_by', 'u1')
    expect(queryBuilder.gte).toHaveBeenCalledWith(
      'changed_at',
      '2026-03-20T00:00:00.000Z'
    )
    expect(queryBuilder.lte).toHaveBeenCalledWith(
      'changed_at',
      '2026-03-22T00:00:00.000Z'
    )
    expect(queryBuilder.limit).toHaveBeenCalledWith(10)
    expect(result).toEqual(data)
  })

  it('uses IS NULL filter for unassigned actor mode', async () => {
    const queryBuilder = createQueryBuilder({ data: [], error: null })
    const from = vi.fn().mockReturnValue(queryBuilder)
    const supabase = { from } as unknown as Parameters<
      typeof listAdminAuditLogs
    >[0]

    await listAdminAuditLogs(supabase, {
      changedByIsNull: true,
      changedBy: 'should-not-be-used',
    })

    expect(queryBuilder.is).toHaveBeenCalledWith('changed_by', null)
    expect(queryBuilder.eq).not.toHaveBeenCalledWith(
      'changed_by',
      expect.anything()
    )
  })

  it('passes rollback reason/comment into rpc call', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        restored: true,
        table: 'doctors',
        record_id: 'r1',
        reverted_action: 'UPDATE',
      },
      error: null,
    })
    const supabase = { rpc } as unknown as Parameters<
      typeof restoreFromAuditLog
    >[0]

    const result = await restoreFromAuditLog(supabase, 'log-1', {
      reason: 'Wrong moderation decision',
      comment: 'Confirmed by lead admin',
    })

    expect(rpc).toHaveBeenCalledWith('admin_restore_audit_log', {
      p_log_id: 'log-1',
      p_reason: 'Wrong moderation decision',
      p_comment: 'Confirmed by lead admin',
    })
    expect(result.restored).toBe(true)
  })
})
