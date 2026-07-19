'use client'

import { useTranslation } from 'react-i18next'
import { CreditCard } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge'
import { WalletCards, type WalletCard } from '@/components/cabinet/WalletCards'

export type PaymentStatus =
  | 'created'
  | 'processing'
  | 'success'
  | 'failure'
  | 'expired'
  | 'reversed'
export type PaymentMode = 'full' | 'deposit'

export interface Payment {
  id: string
  invoice_id: string | null
  amount_kopecks: number
  payment_mode: PaymentMode
  status: PaymentStatus
  created_at: string
  paid_at: string | null
  // Supabase returns arrays for relations even when foreign-key is singular
  appointments:
    | {
        appointment_date: string
        appointment_time: string
        services: { name_uk: string }[] | null
      }[]
    | null
}

// Payment status → semantic tone (Ф-3 scale). Text label comes from i18n.
const STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  created: 'warning',
  processing: 'warning',
  success: 'success',
  failure: 'error',
  expired: 'error',
  reversed: 'neutral',
}

export default function CabinetPaymentsPage({
  payments,
  cards,
}: {
  payments: Payment[]
  cards: WalletCard[]
}) {
  const { t, i18n } = useTranslation()

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const amount = (kopecks: number) =>
    `${(kopecks / 100).toFixed(2)} ${t('cabinet.currency')}`
  const statusLabel = (s: PaymentStatus) =>
    t(`cabinet.payments.statuses.${s}`, { defaultValue: s })
  const modeLabel = (m: PaymentMode) =>
    t(`cabinet.payments.modes.${m}`, { defaultValue: m })
  const serviceName = (p: Payment) =>
    p.appointments?.[0]?.services?.[0]?.name_uk ?? '—'

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-dental-dark mb-6">
        {t('cabinet.payments.title')}
      </h1>

      <WalletCards initialCards={cards} />

      {payments.length === 0 ? (
        <EmptyState
          icon={
            <div className="w-20 h-20 bg-dental-primary-50 rounded-full flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-dental-primary-ink" />
            </div>
          }
          title={t('cabinet.payments.empty.title')}
          description={t('cabinet.payments.empty.description')}
          action={{
            href: '/booking',
            label: t('cabinet.payments.empty.action'),
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-100 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dental-secondary-100 bg-dental-primary-50">
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    {t('cabinet.payments.columns.date')}
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    {t('cabinet.payments.columns.service')}
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    {t('cabinet.payments.columns.amount')}
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    {t('cabinet.payments.columns.type')}
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    {t('cabinet.payments.columns.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dental-secondary-100">
                {payments.map(payment => (
                  <tr
                    key={payment.id}
                    className="hover:bg-dental-primary-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-dental-text whitespace-nowrap">
                      {formatDate(
                        payment.appointments?.[0]?.appointment_date ??
                          payment.created_at
                      )}
                    </td>
                    <td className="px-6 py-4 text-dental-text">
                      {serviceName(payment)}
                    </td>
                    <td className="px-6 py-4 text-dental-dark font-medium whitespace-nowrap">
                      {amount(payment.amount_kopecks)}
                    </td>
                    <td className="px-6 py-4 text-dental-text whitespace-nowrap">
                      {modeLabel(payment.payment_mode)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        tone={STATUS_TONES[payment.status] ?? 'neutral'}
                      >
                        {statusLabel(payment.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <ul className="sm:hidden divide-y divide-dental-secondary-100">
            {payments.map(payment => (
              <li key={payment.id} className="px-4 py-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-dental-dark text-sm">
                    {serviceName(payment)}
                  </span>
                  <StatusBadge
                    tone={STATUS_TONES[payment.status] ?? 'neutral'}
                    className="shrink-0"
                  >
                    {statusLabel(payment.status)}
                  </StatusBadge>
                </div>
                <div className="flex items-center justify-between text-sm text-dental-muted">
                  <span>
                    {formatDate(
                      payment.appointments?.[0]?.appointment_date ??
                        payment.created_at
                    )}
                  </span>
                  <span className="font-medium text-dental-dark">
                    {amount(payment.amount_kopecks)}
                  </span>
                </div>
                <p className="text-xs text-dental-muted">
                  {modeLabel(payment.payment_mode)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
