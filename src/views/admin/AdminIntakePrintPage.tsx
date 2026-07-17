'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button, ErrorState } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import {
  INTAKE_FORMS,
  type IntakeField,
} from '@/content/intake-form-definitions'
import PrintButton from '@/views/promo/PrintButton'

interface IntakeRecord {
  id: string
  form_type: string | null
  first_name: string
  last_name: string
  patronymic: string | null
  phone: string
  email: string | null
  date_of_birth: string | null
  allergies: string | null
  medications: string | null
  chronic_conditions: string | null
  is_pregnant: boolean | null
  complaints: string | null
  data_consent: boolean
  answers: Record<string, string | number | null> | null
  created_at: string
}

/**
 * Print view of a submitted анкета in the official paper-blank layout.
 * Texts are intentionally Ukrainian-only: the printout is a clinical
 * document for the patient's paper file, not localized web UI.
 */
export default function AdminIntakePrintPage({
  intakeId,
}: {
  intakeId: string
}) {
  const { t } = useTranslation()
  const [row, setRow] = useState<IntakeRecord | null>(null)
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
          .from('patient_intake_forms')
          .select(
            'id, form_type, first_name, last_name, patronymic, phone, email, date_of_birth, allergies, medications, chronic_conditions, is_pregnant, complaints, data_consent, answers, created_at'
          )
          .eq('id', intakeId)
          .maybeSingle()
        if (error) throw error
        if (!data) {
          setStatus('error')
          return
        }
        setRow(data as IntakeRecord)
        setStatus('ready')
      } catch (error) {
        captureException(
          error instanceof Error ? error : new Error(String(error))
        )
        setStatus('error')
      }
    }
    void load()
  }, [intakeId])

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-dental-text-light">
        {t('admin.intakePage.loading')}
      </div>
    )
  }

  if (status === 'error' || !row) {
    return <ErrorState title={t('admin.intakePage.errors.loadFailed')} />
  }

  const formType =
    row.form_type === 'adult' || row.form_type === 'child'
      ? row.form_type
      : 'basic'
  const sections = formType === 'basic' ? [] : INTAKE_FORMS[formType]
  const answers = row.answers ?? {}
  const submittedDate = new Date(row.created_at).toLocaleDateString('uk-UA')
  const fullName = [row.last_name, row.first_name, row.patronymic]
    .filter(Boolean)
    .join(' ')

  const renderAnswer = (field: IntakeField) => {
    const value = answers[field.id]
    if (field.kind === 'yesno') {
      return (
        <div
          key={field.id}
          className="flex items-center justify-between gap-2 border-b border-dotted border-gray-300 py-1"
        >
          <span className="text-[11px] leading-snug">{field.label.uk}</span>
          <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold">
            <MarkBox checked={value === 'yes'} /> ТАК{' '}
            <MarkBox checked={value === 'no'} /> НІ
          </span>
        </div>
      )
    }
    if (field.kind === 'scale') {
      return (
        <div
          key={field.id}
          className="flex items-center justify-between gap-2 border-b border-dotted border-gray-300 py-1"
        >
          <span className="text-[11px] leading-snug">{field.label.uk}</span>
          <span className="shrink-0 text-[11px] font-semibold">
            {value === null || value === undefined || value === ''
              ? '—'
              : String(value)}{' '}
            / {field.max}
          </span>
        </div>
      )
    }
    const text = typeof value === 'string' ? value.trim() : ''
    return (
      <div
        key={field.id}
        className="border-b border-dotted border-gray-300 py-1"
      >
        <span className="text-[11px] leading-snug">
          {field.label.uk}: <span className="font-semibold">{text || '—'}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style
        // Isolate #print-area during printing: admin chrome (sidebar, header)
        // stays on screen but never on paper — same pattern as the promo flyer.
        dangerouslySetInnerHTML={{
          __html: `
@page { size: A4 portrait; margin: 12mm; }
@media print {
  /* !important beats inline styles / utility classes on floating widgets */
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; }
}
`,
        }}
      />

      {/* Screen-only toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/intake">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('admin.intakePage.title')}
          </Button>
        </Link>
        <PrintButton label="Друкувати / зберегти як PDF" />
      </div>

      <div
        id="print-area"
        className="mx-auto max-w-3xl rounded-xl border border-dental-secondary-200 bg-white p-8 text-gray-900 print:rounded-none print:border-0 print:p-0"
      >
        {/* Blank header */}
        <div className="border-b-2 border-gray-800 pb-3 text-center">
          <p className="text-lg font-bold tracking-tight">Dental Story</p>
          <h1 className="mt-1 text-base font-extrabold uppercase tracking-wide">
            {formType === 'child'
              ? 'Анкета пацієнта (дитяча)'
              : 'Анкета пацієнта'}
          </h1>
          <p className="mt-1 text-[11px] text-gray-600">
            Заповнено онлайн у кабінеті пацієнта • {submittedDate}
          </p>
        </div>

        {/* Personal data */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
          <BlankLine
            label={formType === 'child' ? 'ПІБ дитини' : 'ПІБ пацієнта'}
            value={fullName}
            wide
          />
          <BlankLine label="Дата народження" value={row.date_of_birth} />
          <BlankLine label="Телефон" value={row.phone} />
          <BlankLine label="Email" value={row.email} wide />
        </div>

        {/* Digitized questionnaire sections */}
        {sections.map(section => (
          <div key={section.id} className="mt-4">
            <h2 className="border-b border-gray-800 pb-1 text-[12px] font-bold uppercase tracking-wide">
              {section.title.uk}
            </h2>
            <div className="mt-1">{section.fields.map(renderAnswer)}</div>
          </div>
        ))}

        {/* Short (basic) form — the pre-visit promo анкета fields */}
        {formType === 'basic' && (
          <div className="mt-4">
            <h2 className="border-b border-gray-800 pb-1 text-[12px] font-bold uppercase tracking-wide">
              Медична інформація
            </h2>
            <div className="mt-1 space-y-1 text-[11px]">
              <p>
                Алергії:{' '}
                <span className="font-semibold">{row.allergies || '—'}</span>
              </p>
              <p>
                Постійні ліки:{' '}
                <span className="font-semibold">{row.medications || '—'}</span>
              </p>
              <p>
                Хронічні захворювання:{' '}
                <span className="font-semibold">
                  {row.chronic_conditions || '—'}
                </span>
              </p>
              <p>
                Вагітність:{' '}
                <span className="font-semibold">
                  {row.is_pregnant === null
                    ? '—'
                    : row.is_pregnant
                      ? 'Так'
                      : 'Ні'}
                </span>
              </p>
              <p>
                Скарги:{' '}
                <span className="font-semibold">{row.complaints || '—'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Consent + signature block */}
        <div className="mt-6 text-[11px] leading-relaxed">
          <p>
            {formType === 'child'
              ? 'Я, законний представник дитини, підтверджую достовірність наданих даних і даю згоду на обробку персональних даних відповідно до Закону України «Про захист персональних даних».'
              : 'Підтверджую достовірність наданих даних і даю згоду на обробку персональних даних відповідно до Закону України «Про захист персональних даних».'}{' '}
            Згоду надано онлайн: {row.data_consent ? 'ТАК' : 'НІ'} (
            {submittedDate}).
          </p>
          <div className="mt-6 grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-gray-800" />
              <p className="mt-1 text-[10px] text-gray-600">
                {formType === 'child'
                  ? 'Підпис законного представника'
                  : 'Підпис пацієнта'}
              </p>
            </div>
            <div>
              <div className="border-b border-gray-800" />
              <p className="mt-1 text-[10px] text-gray-600">
                Дата, підпис лікаря
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkBox({ checked }: { checked: boolean }) {
  return (
    <span className="mr-0.5 inline-flex h-3.5 w-3.5 items-center justify-center border border-gray-800 align-[-2px] text-[10px] font-bold leading-none">
      {checked ? '✕' : ' '}
    </span>
  )
}

function BlankLine({
  label,
  value,
  wide,
}: {
  label: string
  value: string | null
  wide?: boolean
}) {
  return (
    <p className={wide ? 'col-span-2' : ''}>
      {label}:{' '}
      <span className="font-semibold underline decoration-dotted underline-offset-2">
        {value || '          '}
      </span>
    </p>
  )
}
