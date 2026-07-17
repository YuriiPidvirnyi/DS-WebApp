'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button, ErrorState } from '@/components/ui'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import { CONTACT_INFO } from '@/utils/constants'
import {
  INTAKE_FORMS,
  type IntakeSection,
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
 * Layout map that reproduces the official paper анкети:
 * section 1 = personal data (fixed fields + the `merged` section's answers),
 * section 2 = two columns of question groups, section 3 = dental history,
 * then the consent box with date/signature lines.
 */
const PRINT_LAYOUT = {
  adult: {
    subtitle: 'Медична та стоматологічна історія',
    intro:
      'Дякуємо, що обрали нашу клініку. Просимо уважно заповнити бланк: багато захворювань можуть впливати на хід лікування. Персональні дані становлять лікарську таємницю, не підлягають розголошенню та використовуються виключно для контролю за станом здоров’я під час лікування.',
    personalTitle: 'Персональні дані',
    merged: 'contact',
    section2Title: 'Перенесені та супутні захворювання · Алергічні реакції',
    columns: [['diseases'], ['allergies', 'women', 'additional']],
    groupTitleOverrides: { diseases: 'Захворювання' } as Record<string, string>,
    consentTitle: 'Згода пацієнта',
    consentText:
      'Ви, як пацієнт, ознайомлені з прейскурантом цін та переліком послуг, які надаються приватною стоматологічною клінікою, та зобов’язуєтеся оплатити вартість лікування. Підтверджую, що всі надані відомості є достовірними та повними.',
    signatureCaption: 'Підпис пацієнта',
    nameLabel: 'Прізвище, ім’я, по батькові',
  },
  child: {
    subtitle: 'Дитяча стоматологічна анкета',
    intro:
      'Шановні батьки! Багато захворювань та загальний стан організму можуть впливати на хід лікування вашої дитини. Просимо уважно заповнити цей бланк. Персональні дані є лікарською таємницею, не підлягають розголошенню та служать лише для контролю за станом здоров’я дитини під час лікування.',
    personalTitle: 'Дані дитини та законного представника',
    merged: 'representative',
    section2Title: 'Стан здоров’я дитини',
    columns: [['general', 'diseases'], ['additional']],
    groupTitleOverrides: {
      general: 'Загальний стан',
      additional: 'Додаткові відомості про дитину',
    } as Record<string, string>,
    consentTitle: 'Згода законного представника',
    consentText:
      'Я, як законний представник дитини (батько / мати / опікун), ознайомлений(-а) з прейскурантом цін та переліком послуг, які надаються приватною стоматологічною клінікою, та зобов’язуюся оплатити вартість лікування. Підтверджую, що всі надані відомості є достовірними та повними, і надаю згоду на проведення огляду й лікування дитини.',
    signatureCaption: 'Підпис законного представника',
    nameLabel: 'Прізвище, ім’я, по батькові дитини',
  },
} as const

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
  const answers = row.answers ?? {}
  const submittedDate = new Date(row.created_at).toLocaleDateString('uk-UA')
  const fullName = [row.last_name, row.first_name, row.patronymic]
    .filter(Boolean)
    .join(' ')

  const layout = formType === 'basic' ? null : PRINT_LAYOUT[formType]
  const sections = formType === 'basic' ? [] : INTAKE_FORMS[formType]
  const sectionById = new Map(sections.map(s => [s.id, s]))
  const mergedSection = layout ? sectionById.get(layout.merged) : undefined
  const dentalSection = sectionById.get('dental')

  const textAnswer = (id: string) => {
    const value = answers[id]
    return typeof value === 'string' ? value.trim() : ''
  }

  /** One question group (sub-block of the paper blank) with ТАК/НІ columns. */
  const renderGroup = (section: IntakeSection, titleOverride?: string) => {
    const hasYesNo = section.fields.some(f => f.kind === 'yesno')
    let num = 0
    return (
      <div key={section.id} className="break-inside-avoid">
        <div className="flex items-end justify-between border-b border-gray-700 pb-0.5">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wide">
            {titleOverride ?? section.title.uk}
          </h3>
          {hasYesNo ? (
            <span className="flex shrink-0 gap-1 text-[9px] font-bold text-gray-500">
              <span className="w-7 text-center">ТАК</span>
              <span className="w-7 text-center">НІ</span>
            </span>
          ) : null}
        </div>
        <div>
          {section.fields.map(field => {
            const numbered =
              section.numbered && field.kind !== 'scale' && !field.unnumbered
            const label = (
              <>
                {numbered ? (
                  <span className="mr-1 inline-block w-4 text-right text-gray-400">
                    {++num}
                  </span>
                ) : null}
                {field.label.uk}
              </>
            )

            if (field.kind === 'yesno') {
              const value = answers[field.id]
              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between gap-2 border-b border-dotted border-gray-300 py-[3px]"
                >
                  <span className="text-[10.5px] leading-tight">{label}</span>
                  <span className="flex shrink-0 gap-1">
                    <span className="flex w-7 justify-center">
                      <MarkBox checked={value === 'yes'} />
                    </span>
                    <span className="flex w-7 justify-center">
                      <MarkBox checked={value === 'no'} />
                    </span>
                  </span>
                </div>
              )
            }

            if (field.kind === 'scale') {
              const value = answers[field.id]
              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between gap-2 border-b border-dotted border-gray-300 py-[3px]"
                >
                  <span className="text-[10.5px] leading-tight">{label}</span>
                  <span className="shrink-0 text-[10.5px] font-bold">
                    {value === null || value === undefined || value === ''
                      ? '—'
                      : String(value)}{' '}
                    / {field.max}
                  </span>
                </div>
              )
            }

            const text = textAnswer(field.id)
            return (
              <div
                key={field.id}
                className="border-b border-dotted border-gray-300 py-[3px] text-[10.5px] leading-tight"
              >
                {label}: <span className="font-bold">{text || '—'}</span>
              </div>
            )
          })}
        </div>
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
@page { size: A4 portrait; margin: 10mm; }
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
        className="mx-auto max-w-[210mm] rounded-xl border border-dental-secondary-200 bg-white p-8 text-gray-900 print:rounded-none print:border-0 print:p-0"
      >
        {/* ── Blank header: logo | title | clinic contacts ─────────────── */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-dental-primary pb-3">
          <Logo size="sm" />
          <div className="text-center">
            <h1 className="text-lg font-extrabold uppercase tracking-wide">
              Анкета пацієнта
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              {layout ? layout.subtitle : 'Коротка анкета (промо)'}
            </p>
          </div>
          <div className="shrink-0 text-right text-[9.5px] leading-relaxed text-gray-600">
            <p className="font-bold text-gray-800">
              {CONTACT_INFO.address.city}, {CONTACT_INFO.address.street}
            </p>
            <p>{CONTACT_INFO.email}</p>
            <p>{CONTACT_INFO.phone}</p>
          </div>
        </div>

        {/* Intro note */}
        {layout ? (
          <div className="mt-3 rounded-md bg-gray-100 px-4 py-2.5 text-[9.5px] leading-relaxed text-gray-700 print:bg-gray-100">
            {layout.intro}
          </div>
        ) : null}

        {/* ── 1. Personal data ─────────────────────────────────────────── */}
        <SectionPill n={1}>
          {layout ? layout.personalTitle : 'Персональні дані'}
        </SectionPill>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <BlankLine
            label={layout ? layout.nameLabel : 'Прізвище, ім’я, по батькові'}
            value={fullName}
            wide
          />
          <BlankLine label="Дата народження" value={row.date_of_birth} />
          <BlankLine
            label={
              formType === 'child' ? 'Контактні телефони' : 'Мобільний телефон'
            }
            value={row.phone}
          />
          <BlankLine label="E-mail" value={row.email} wide />
          {mergedSection?.fields.map(field => (
            <BlankLine
              key={field.id}
              label={field.label.uk}
              value={textAnswer(field.id) || null}
              wide
            />
          ))}
        </div>

        {/* ── 2. Health / diseases in two columns ──────────────────────── */}
        {layout ? (
          <>
            <SectionPill n={2}>{layout.section2Title}</SectionPill>
            <div className="grid grid-cols-2 gap-x-8">
              {layout.columns.map((columnIds, i) => (
                <div key={i} className="space-y-3">
                  {columnIds.map(id => {
                    const section = sectionById.get(id)
                    return section
                      ? renderGroup(section, layout.groupTitleOverrides[id])
                      : null
                  })}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* Short (basic) promo-form fields */}
        {formType === 'basic' && (
          <>
            <SectionPill n={2}>Медична інформація</SectionPill>
            <div className="space-y-1 text-[10.5px]">
              <p>
                Алергії:{' '}
                <span className="font-bold">{row.allergies || '—'}</span>
              </p>
              <p>
                Постійні ліки:{' '}
                <span className="font-bold">{row.medications || '—'}</span>
              </p>
              <p>
                Хронічні захворювання:{' '}
                <span className="font-bold">
                  {row.chronic_conditions || '—'}
                </span>
              </p>
              <p>
                Вагітність:{' '}
                <span className="font-bold">
                  {row.is_pregnant === null
                    ? '—'
                    : row.is_pregnant
                      ? 'Так'
                      : 'Ні'}
                </span>
              </p>
              <p>
                Скарги:{' '}
                <span className="font-bold">{row.complaints || '—'}</span>
              </p>
            </div>
          </>
        )}

        {/* ── 3. Dental history (full width) ───────────────────────────── */}
        {dentalSection ? (
          <>
            <SectionPill n={3}>Стоматологічний анамнез</SectionPill>
            {renderGroup(dentalSection, ' ')}
          </>
        ) : null}

        {/* ── Consent + date/signature ─────────────────────────────────── */}
        {layout ? (
          <div className="mt-4 break-inside-avoid rounded-md border border-dental-primary bg-dental-primary/10 px-4 py-3 print:bg-dental-primary/10">
            <h3 className="text-[10.5px] font-bold uppercase tracking-wide">
              {layout.consentTitle}
            </h3>
            <p className="mt-1 text-[9.5px] leading-relaxed text-gray-700">
              {layout.consentText}
            </p>
          </div>
        ) : null}

        <p className="mt-3 text-[9px] text-gray-500">
          Анкету заповнено онлайн у кабінеті пацієнта {submittedDate}. Згоду з
          умовами підтверджено електронно: {row.data_consent ? 'так' : 'ні'}.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-12">
          <div>
            <p className="text-[11px]">«____» ____________________ 20____ р.</p>
            <p className="mt-1 border-t border-gray-400 pt-0.5 text-center text-[9px] text-gray-500">
              Дата
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <p className="mt-1 border-t border-gray-400 pt-0.5 text-center text-[9px] text-gray-500">
              {layout ? layout.signatureCaption : 'Підпис пацієнта'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionPill({
  n,
  children,
}: {
  n: number
  children: React.ReactNode
}) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2 rounded-full bg-dental-primary/40 px-3 py-1 print:bg-dental-primary/40">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-bold text-dental-dark">
        {n}
      </span>
      <h2 className="text-[11px] font-bold uppercase tracking-wide text-dental-dark">
        {children}
      </h2>
    </div>
  )
}

function MarkBox({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex h-3 w-3 items-center justify-center rounded-[2px] border border-gray-700 text-[9px] font-bold leading-none">
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
    <p className={`text-[10.5px] leading-relaxed ${wide ? 'col-span-2' : ''}`}>
      <span className="text-gray-600">{label}:</span>{' '}
      <span className="font-bold underline decoration-gray-400 decoration-dotted underline-offset-2">
        {value || '          '}
      </span>
    </p>
  )
}
