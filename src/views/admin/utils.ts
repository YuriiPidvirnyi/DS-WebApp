import i18n from '@/i18n/config'

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 5)
}

export function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${value.toLocaleString()} ${i18n.t('cabinet.currency')}`
}

type JoinedRow = Record<string, unknown>
export type JoinedField = JoinedRow | JoinedRow[] | null | undefined

export function getJoinedFieldValue(
  joined: JoinedField,
  key: string,
  fallback = '—'
): string {
  if (!joined) return fallback
  if (Array.isArray(joined)) {
    const first = joined[0]
    if (!first || typeof first !== 'object') return fallback
    const value = first[key]
    return typeof value === 'string' && value.trim() ? value : fallback
  }

  const value = joined[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function getStatusTone(status: string): string {
  switch (status) {
    case 'approved':
    case 'confirmed':
    case 'completed':
    case 'resolved':
    case 'active':
      return 'bg-status-success-100 text-status-success-700'
    case 'pending':
    case 'new':
    case 'in_progress':
      return 'bg-status-warning-100 text-status-warning-700'
    case 'rejected':
    case 'cancelled':
    case 'closed':
    case 'no_show':
    case 'inactive':
      return 'bg-status-error-100 text-status-error-700'
    default:
      return 'bg-status-neutral-100 text-status-neutral-700'
  }
}
