'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, FileText, Calendar, Activity } from 'lucide-react'
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
        services: { name_uk: string } | null
      }[]
    | null
}

const SC: Record<string, string> = {
  draft: 'bg-dental-secondary-200 text-dental-dark',
  signed: 'bg-dental-primary-100 text-dental-teal',
  completed: 'bg-dental-primary/30 text-dental-dark',
}
const SD: Record<string, string> = {
  draft: 'Чернетка',
  signed: 'Підписано',
  completed: 'Завершено',
}
const PC: Record<string, string> = {
  unpaid: 'bg-amber-100 text-amber-800',
  partial: 'bg-orange-100 text-orange-800',
  paid: 'bg-emerald-100 text-emerald-800',
  waived: 'bg-dental-secondary-100 text-dental-muted',
  refunded: 'bg-violet-100 text-violet-800',
}
const PD: Record<string, string> = {
  unpaid: 'Не сплачено',
  partial: 'Частково',
  paid: 'Сплачено',
  waived: 'Звільнено',
  refunded: 'Повернено',
}

function doctorName(d: TreatmentRecord['doctors']) {
  const r = Array.isArray(d) ? d[0] : d
  return r ? `${r.last_name} ${r.first_name}`.trim() : '—'
}

export default function TreatmentsHistoryPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      if (!supabase) return router.push('/auth/login')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')
      const { data } = await supabase
        .from('treatment_records')
        .select(
          `id, diagnosis, notes, tooth_numbers, status, total_cost, payment_status, created_at, doctors(first_name, last_name), treatment_record_items(service_id, tooth_number, quantity, price_at_time, services(name_uk))`
        )
        .order('created_at', { ascending: false })
      setRecords((data as TreatmentRecord[]) || [])
      setLoading(false)
    })()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-dental-secondary-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-dental-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dental-secondary-50">
      <header className="bg-white border-b border-dental-secondary-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/cabinet"
            className="text-dental-muted hover:text-dental-dark p-1 -ml-1"
            aria-label={t('common.back', { defaultValue: 'Назад' })}
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-dental-dark">
            {t('cabinet.treatments.title', {
              defaultValue: 'Історія лікування',
            })}
          </h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-soft border border-dental-secondary-100">
            <div className="w-16 h-16 bg-dental-primary/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-dental-teal" />
            </div>
            <p className="text-dental-dark font-medium">
              {t('cabinet.treatments.empty', {
                defaultValue: 'У вас поки немає записів про лікування',
              })}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {records.map(rec => (
              <li
                key={rec.id}
                className="bg-white rounded-2xl p-5 shadow-soft border border-dental-secondary-100"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-dental-dark">
                    <Calendar className="w-4 h-4 text-dental-teal shrink-0" />
                    <span className="font-semibold">
                      {new Date(rec.created_at).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${SC[rec.status] || 'bg-slate-100 text-slate-700'}`}
                    >
                      {t(`cabinet.treatments.status.${rec.status}`, {
                        defaultValue: SD[rec.status] ?? rec.status,
                      })}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${PC[rec.payment_status] || 'bg-slate-100 text-slate-700'}`}
                    >
                      {t(`cabinet.treatments.payment.${rec.payment_status}`, {
                        defaultValue:
                          PD[rec.payment_status] ?? rec.payment_status,
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-dental-muted mb-1">
                  <span className="font-medium text-dental-dark">
                    {t('cabinet.treatments.doctor', { defaultValue: 'Лікар' })}:
                  </span>{' '}
                  {doctorName(rec.doctors)}
                </p>
                {rec.diagnosis && (
                  <p className="text-sm text-dental-dark mb-3">
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
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-dental-teal text-sm font-medium mb-2">
                        <Activity className="w-4 h-4" />
                        {t('cabinet.treatments.procedures', {
                          defaultValue: 'Процедури',
                        })}
                      </div>
                      <ul className="text-sm text-dental-muted space-y-1 pl-1">
                        {rec.treatment_record_items.map((it, i) => (
                          <li key={`${rec.id}-${i}`}>
                            •{' '}
                            {it.services?.name_uk ?? t('cabinet.consultation')}
                            {it.quantity > 1 ? ` ×${it.quantity}` : ''}
                            {it.tooth_number
                              ? ` (${t('cabinet.treatments.tooth', { defaultValue: 'зуб' })} ${it.tooth_number})`
                              : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {rec.tooth_numbers?.length > 0 && (
                  <p className="text-sm text-dental-muted">
                    <span className="font-medium text-dental-dark">
                      {t('cabinet.treatments.teeth', { defaultValue: 'Зуби' })}:
                    </span>{' '}
                    {rec.tooth_numbers.join(', ')}
                  </p>
                )}
                <p className="mt-3 pt-3 border-t border-dental-secondary-100 text-dental-dark font-semibold">
                  {Number(rec.total_cost).toLocaleString('uk-UA')}{' '}
                  {t('cabinet.currency')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
