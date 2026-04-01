'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { FileText, Calendar, Activity, ChevronDown } from 'lucide-react'

type TreatmentRecord = {
  id: string
  diagnosis: string | null
  notes: string | null
  tooth_numbers: string[]
  status: string
  total_cost: number
  payment_status: string
  created_at: string
  doctors:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null
  treatment_record_items:
    | {
        service_id: string
        tooth_number: string | null
        quantity: number
        price_at_time: number
        services: { name_uk: string } | null
      }[]
    | null
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-dental-secondary-200 text-dental-dark',
  signed: 'bg-dental-primary-100 text-dental-primary-600',
  completed: 'bg-green-100 text-green-700',
}

const PAYMENT_STYLES: Record<string, string> = {
  unpaid: 'bg-amber-100 text-amber-700',
  partial: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  waived: 'bg-dental-secondary-100 text-dental-muted',
  refunded: 'bg-violet-100 text-violet-700',
}

function doctorName(d: TreatmentRecord['doctors']): string {
  const r = Array.isArray(d) ? d[0] : d
  return r ? `${r.last_name} ${r.first_name}`.trim() : '—'
}

function TreatmentsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-48 bg-dental-secondary-200 rounded-lg" />
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-dental-secondary-100 space-y-3"
        >
          <div className="flex justify-between">
            <div className="h-5 w-44 bg-dental-secondary-200 rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-dental-secondary-100 rounded-full" />
              <div className="h-5 w-20 bg-dental-secondary-100 rounded-full" />
            </div>
          </div>
          <div className="h-4 w-56 bg-dental-secondary-100 rounded" />
          <div className="h-4 w-40 bg-dental-secondary-100 rounded" />
          <div className="pt-3 border-t border-dental-secondary-100">
            <div className="h-5 w-24 bg-dental-secondary-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TreatmentsHistoryPage() {
  const { t } = useTranslation()
  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecords = async () => {
      const supabase = createClient()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('treatment_records')
        .select(
          `id, diagnosis, notes, tooth_numbers, status, total_cost, payment_status, created_at,
          doctors(first_name, last_name),
          treatment_record_items(service_id, tooth_number, quantity, price_at_time, services(name_uk))`
        )
        .order('created_at', { ascending: false })

      setRecords((data as TreatmentRecord[]) || [])
      setLoading(false)
    }

    fetchRecords()
  }, [])

  if (loading) return <TreatmentsSkeleton />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dental-dark">
        {t('cabinet.treatments.title', { defaultValue: 'Історія лікування' })}
      </h1>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-dental-secondary-100">
          <div className="w-16 h-16 bg-dental-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-dental-primary-600" />
          </div>
          <p className="text-dental-dark font-medium">
            {t('cabinet.treatments.empty', {
              defaultValue: 'У вас поки немає записів про лікування',
            })}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {records.map(rec => {
            const isExpanded = expandedId === rec.id
            return (
              <li
                key={rec.id}
                className="bg-white rounded-2xl shadow-sm border border-dental-secondary-100 overflow-hidden transition-colors hover:border-dental-primary-200"
              >
                {/* Clickable header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  className="w-full text-left p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-dental-dark">
                      <Calendar className="w-4 h-4 text-dental-primary-600 shrink-0" />
                      <span className="font-semibold text-sm">
                        {new Date(rec.created_at).toLocaleDateString('uk-UA', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLES[rec.status] || 'bg-dental-secondary-100 text-dental-muted'}`}
                      >
                        {t(`cabinet.treatments.status.${rec.status}`, {
                          defaultValue: rec.status,
                        })}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${PAYMENT_STYLES[rec.payment_status] || 'bg-dental-secondary-100 text-dental-muted'}`}
                      >
                        {t(`cabinet.treatments.payment.${rec.payment_status}`, {
                          defaultValue: rec.payment_status,
                        })}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-dental-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-dental-muted">
                    <span className="font-medium text-dental-dark">
                      {t('cabinet.treatments.doctor', {
                        defaultValue: 'Лікар',
                      })}
                      :
                    </span>{' '}
                    {doctorName(rec.doctors)}
                  </p>

                  <p className="mt-2 text-dental-dark font-semibold text-sm">
                    {Number(rec.total_cost).toLocaleString('uk-UA')}{' '}
                    {t('cabinet.currency')}
                  </p>
                </button>

                {/* Expandable detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 space-y-3 border-t border-dental-secondary-100">
                    {rec.diagnosis && (
                      <p className="text-sm text-dental-dark pt-3">
                        <span className="font-medium">
                          {t('cabinet.treatments.diagnosis', {
                            defaultValue: 'Діагноз',
                          })}
                          :
                        </span>{' '}
                        {rec.diagnosis}
                      </p>
                    )}

                    {rec.treatment_record_items &&
                      rec.treatment_record_items.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center gap-2 text-dental-primary-600 text-sm font-medium mb-2">
                            <Activity className="w-4 h-4" />
                            {t('cabinet.treatments.procedures', {
                              defaultValue: 'Процедури',
                            })}
                          </div>
                          <div className="bg-dental-secondary-50 rounded-xl p-3">
                            <ul className="text-sm text-dental-text space-y-1.5">
                              {rec.treatment_record_items.map((it, i) => (
                                <li
                                  key={`${rec.id}-${i}`}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-dental-primary-600 mt-0.5">
                                    •
                                  </span>
                                  <span className="flex-1">
                                    {it.services?.name_uk ??
                                      t('cabinet.consultation')}
                                    {it.quantity > 1 ? ` ×${it.quantity}` : ''}
                                    {it.tooth_number
                                      ? ` (${t('cabinet.treatments.tooth', { defaultValue: 'зуб' })} ${it.tooth_number})`
                                      : ''}
                                  </span>
                                  {it.price_at_time > 0 && (
                                    <span className="text-dental-muted text-xs whitespace-nowrap">
                                      {Number(
                                        it.price_at_time * (it.quantity || 1)
                                      ).toLocaleString('uk-UA')}{' '}
                                      {t('cabinet.currency')}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                    {rec.tooth_numbers?.length > 0 && (
                      <p className="text-sm text-dental-muted">
                        <span className="font-medium text-dental-dark">
                          {t('cabinet.treatments.teeth', {
                            defaultValue: 'Зуби',
                          })}
                          :
                        </span>{' '}
                        {rec.tooth_numbers.join(', ')}
                      </p>
                    )}

                    {rec.notes && (
                      <p className="text-sm text-dental-muted italic">
                        {rec.notes}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
