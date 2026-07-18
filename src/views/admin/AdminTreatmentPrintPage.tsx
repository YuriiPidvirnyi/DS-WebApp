'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ErrorState } from '@/components/ui'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import PrintButton from '@/views/promo/PrintButton'

interface TreatmentItem {
  id: string
  tooth_number: string | null
  quantity: number
  price_at_time: number
  services: { name_uk: string } | { name_uk: string }[] | null
}

interface TreatmentRecord {
  id: string
  diagnosis: string | null
  tooth_numbers: string | null
  status: 'draft' | 'signed' | 'completed'
  payment_status: 'unpaid' | 'partial' | 'paid' | 'waived' | 'refunded'
  total_cost: number | null
  created_at: string
  patients: { first_name: string; last_name: string } | null
  doctors: { first_name: string; last_name: string } | null
  treatment_record_items: TreatmentItem[]
}

/**
 * Друкований акт виконаних робіт (макет 2c): та сама структура даних, що в
 * адмінці (діагноз, зуби, процедури з к-стю й ціною) — у брендовій шапці.
 * Реквізити тягнуться з CONTACT_INFO, не набираються вручну (запобігає Л1).
 *
 * Тексти навмисно україномовні (не i18n): це клінічний паперовий документ
 * для картки пацієнта — та сама логіка, що в AdminIntakePrintPage.
 */
const PAYMENT_LABELS: Record<TreatmentRecord['payment_status'], string> = {
  unpaid: 'Не оплачено',
  partial: 'Часткова оплата',
  paid: 'Оплачено',
  waived: 'Без оплати',
  refunded: 'Повернено',
}

const PAYMENT_CHIP: Record<TreatmentRecord['payment_status'], string> = {
  unpaid: 'bg-status-error-100 text-status-error-700',
  partial: 'bg-status-warning-100 text-status-warning-700',
  paid: 'bg-status-success-100 text-status-success-700',
  waived: 'bg-status-neutral-200 text-status-neutral-700',
  refunded: 'bg-status-neutral-200 text-status-neutral-700',
}

const serviceName = (item: TreatmentItem): string => {
  const svc = Array.isArray(item.services) ? item.services[0] : item.services
  return svc?.name_uk ?? '—'
}

const money = (value: number): string =>
  value.toLocaleString('uk-UA', { maximumFractionDigits: 2 })

export default function AdminTreatmentPrintPage({
  recordId,
}: {
  recordId: string
}) {
  const { t } = useTranslation()
  const [row, setRow] = useState<TreatmentRecord | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      if (!supabase) {
        setStatus('error')
        return
      }
      try {
        const { data, error } = await supabase
          .from('treatment_records')
          .select(
            'id, diagnosis, tooth_numbers, status, payment_status, total_cost, created_at, patients(first_name,last_name), doctors(first_name,last_name), treatment_record_items(id, tooth_number, quantity, price_at_time, services(name_uk))'
          )
          .eq('id', recordId)
          .maybeSingle()
        if (error) throw error
        if (!data) {
          setStatus('error')
          return
        }
        setRow(data as unknown as TreatmentRecord)
        setStatus('ready')
      } catch (error) {
        captureException(
          error instanceof Error ? error : new Error(String(error))
        )
        setStatus('error')
      }
    }
    void load()
  }, [recordId])

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-dental-muted">
        {t('common.loading')}...
      </div>
    )
  }

  if (status === 'error' || !row) {
    return <ErrorState title={t('admin.treatmentsPage.loadError')} />
  }

  const actNumber = `ДС-${row.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
  const actDate = new Date(row.created_at).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const patientName = row.patients
    ? `${row.patients.last_name} ${row.patients.first_name}`
    : '—'
  const doctorName = row.doctors
    ? `${row.doctors.last_name} ${row.doctors.first_name}`
    : '—'
  const items = row.treatment_record_items ?? []
  const total =
    row.total_cost ??
    items.reduce((sum, i) => sum + i.quantity * i.price_at_time, 0)
  const printable = row.status !== 'draft'

  return (
    <div className="space-y-6">
      <style
        // Isolate #print-area during printing: admin chrome (sidebar, header)
        // stays on screen but never on paper — same pattern as the intake form.
        dangerouslySetInnerHTML={{
          __html: `
@page { size: A4 portrait; margin: 12mm; }
@media print {
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; inset: 0; width: 100%; }
}
`,
        }}
      />

      {/* Screen-only toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin/treatments"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-dental-muted transition-colors hover:bg-dental-secondary-100 hover:text-dental-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>
        {printable ? (
          <PrintButton label="Друк" />
        ) : (
          <p className="text-sm text-dental-muted">
            Чернетки не друкуються — підпишіть акт, щоб роздрукувати.
          </p>
        )}
      </div>

      {/* Printable act */}
      <div
        id="print-area"
        className="mx-auto max-w-2xl rounded-md border border-dental-secondary-200 bg-white p-10 text-[13px] leading-relaxed text-dental-dark shadow-soft print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        {/* Брендова шапка — реквізити з CONTACT_INFO */}
        <div className="flex items-start justify-between border-b-2 border-dental-primary-600 pb-5">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <p className="font-heading text-lg font-extrabold">
                {SITE_INFO.name}
              </p>
              <p className="text-[11px] text-dental-muted">
                Стоматологічна клініка
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] leading-relaxed text-dental-muted">
            <p>dentalstory.ua · {CONTACT_INFO.email}</p>
            <p>
              {CONTACT_INFO.phone} · {CONTACT_INFO.address.city}
            </p>
          </div>
        </div>

        {/* Назва акта */}
        <div className="mt-6 flex items-baseline justify-between">
          <h1 className="font-heading text-xl font-extrabold">
            Акт виконаних робіт № {actNumber}
          </h1>
          <p className="text-xs text-dental-muted">{actDate}</p>
        </div>

        {/* Метадані */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
          <p>
            <span className="text-status-neutral-700">Пацієнт:</span>{' '}
            <span className="font-semibold">{patientName}</span>
          </p>
          <p>
            <span className="text-status-neutral-700">Лікар:</span>{' '}
            <span className="font-semibold">{doctorName}</span>
          </p>
          <p>
            <span className="text-status-neutral-700">Діагноз:</span>{' '}
            <span className="font-semibold">{row.diagnosis || '—'}</span>
          </p>
          <p>
            <span className="text-status-neutral-700">Зуби:</span>{' '}
            <span className="font-semibold">{row.tooth_numbers || '—'}</span>
          </p>
        </div>

        {/* Таблиця процедур */}
        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="border-b-[1.5px] border-dental-dark">
              <th className="py-2 pr-2 text-left font-heading text-xs">
                Процедура
              </th>
              <th className="w-14 py-2 text-center font-heading text-xs">
                Зуб
              </th>
              <th className="w-16 py-2 text-center font-heading text-xs">
                К-сть
              </th>
              <th className="w-24 py-2 text-right font-heading text-xs">
                Ціна, грн
              </th>
              <th className="w-24 py-2 text-right font-heading text-xs">
                Сума, грн
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr
                key={item.id}
                className="border-b border-status-neutral-200 break-inside-avoid"
              >
                <td className="py-2.5 pr-2">{serviceName(item)}</td>
                <td className="py-2.5 text-center">
                  {item.tooth_number || '—'}
                </td>
                <td className="py-2.5 text-center">{item.quantity}</td>
                <td className="py-2.5 text-right">
                  {money(item.price_at_time)}
                </td>
                <td className="py-2.5 text-right">
                  {money(item.quantity * item.price_at_time)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Разом + статус оплати зі шкали 1f */}
        <div className="mt-4 flex items-center justify-end gap-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_CHIP[row.payment_status]}`}
          >
            {PAYMENT_LABELS[row.payment_status]}
          </span>
          <p className="font-heading text-lg font-extrabold">
            Разом: {money(total)} грн
          </p>
        </div>

        {/* Підписи та печатка */}
        <div className="mt-10 grid grid-cols-[1fr_1fr_auto] items-end gap-8 break-inside-avoid">
          <div>
            <p className="mb-8 text-xs text-status-neutral-700">
              Роботи виконано в повному обсязі, пацієнт претензій не має.
            </p>
            <div className="border-b border-dental-dark" />
            <p className="mt-1 text-[11px] text-dental-muted">Підпис лікаря</p>
          </div>
          <div>
            <div className="border-b border-dental-dark" />
            <p className="mt-1 text-[11px] text-dental-muted">
              Підпис пацієнта
            </p>
          </div>
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-dental-primary-400 text-center text-[9px] uppercase tracking-wider text-dental-primary-500"
            aria-hidden="true"
          >
            Місце
            <br />
            печатки
          </div>
        </div>
      </div>
    </div>
  )
}
