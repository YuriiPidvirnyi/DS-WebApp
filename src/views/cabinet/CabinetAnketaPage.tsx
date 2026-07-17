'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Download, FileText, Send } from 'lucide-react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { createIntake, type IntakeAnswerValue } from '@/services/intake'
import {
  INTAKE_FORMS,
  type IntakeField,
  type IntakeLocale,
} from '@/content/intake-form-definitions'
import { formatPhoneNumber } from '@/utils/validationSchemas'
import { withToast } from '@/utils/toast'
import { sanitizeUserInput } from '@/utils/security'
import { captureException } from '@/utils/sentry'

type FormType = 'adult' | 'child'

interface SubmittedIntake {
  id: string
  form_type: string
  first_name: string
  last_name: string
  status: string
  created_at: string
}

interface PersonalState {
  lastName: string
  firstName: string
  patronymic: string
  phone: string
  email: string
  dateOfBirth: string
}

const EMPTY_PERSONAL: PersonalState = {
  lastName: '',
  firstName: '',
  patronymic: '',
  phone: '',
  email: '',
  dateOfBirth: '',
}

export default function CabinetAnketaPage() {
  const { t, i18n } = useTranslation()
  const locale = (
    ['uk', 'en', 'pl'].includes(i18n.language) ? i18n.language : 'uk'
  ) as IntakeLocale

  const [submitted, setSubmitted] = useState<SubmittedIntake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formType, setFormType] = useState<FormType | null>(null)
  const [personal, setPersonal] = useState<PersonalState>(EMPTY_PERSONAL)
  const [profileDefaults, setProfileDefaults] =
    useState<PersonalState>(EMPTY_PERSONAL)
  const [answers, setAnswers] = useState<Record<string, IntakeAnswerValue>>({})
  const [dataConsent, setDataConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: forms }] = await Promise.all([
        supabase
          .from('patients')
          .select('first_name, last_name, patronymic, phone, date_of_birth')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('patient_intake_forms')
          .select('id, form_type, first_name, last_name, status, created_at')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      setProfileDefaults({
        lastName: profile?.last_name ?? '',
        firstName: profile?.first_name ?? '',
        patronymic: profile?.patronymic ?? '',
        phone: profile?.phone ?? '',
        email: user.email ?? '',
        dateOfBirth: profile?.date_of_birth ?? '',
      })
      setSubmitted((forms ?? []) as SubmittedIntake[])
    } catch (error) {
      captureException(
        error instanceof Error ? error : new Error(String(error))
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const startForm = (type: FormType) => {
    setFormType(type)
    setAnswers({})
    setDataConsent(false)
    // Adult form: the patient IS the subject — prefill everything.
    // Child form: the subject is the child — prefill only contacts.
    setPersonal(
      type === 'adult'
        ? profileDefaults
        : {
            ...EMPTY_PERSONAL,
            phone: profileDefaults.phone,
            email: profileDefaults.email,
          }
    )
  }

  const sections = useMemo(
    () => (formType ? INTAKE_FORMS[formType] : []),
    [formType]
  )

  const setAnswer = (id: string, value: IntakeAnswerValue) =>
    setAnswers(prev => ({ ...prev, [id]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formType || isSubmitting) return

    setIsSubmitting(true)
    try {
      const sanitizedAnswers: Record<string, IntakeAnswerValue> = {}
      for (const [key, value] of Object.entries(answers)) {
        sanitizedAnswers[key] =
          typeof value === 'string' && value !== 'yes' && value !== 'no'
            ? sanitizeUserInput(value)
            : value
      }

      // Child form: the representative (this account) fills for the child —
      // representative_name defaults to the profile name when not provided.
      if (formType === 'child' && !sanitizedAnswers.representative_name) {
        sanitizedAnswers.representative_name =
          `${profileDefaults.lastName} ${profileDefaults.firstName} ${profileDefaults.patronymic}`.trim()
      }

      await withToast(
        async () => {
          const res = await createIntake({
            firstName: sanitizeUserInput(personal.firstName),
            lastName: sanitizeUserInput(personal.lastName),
            patronymic: sanitizeUserInput(personal.patronymic),
            phone: sanitizeUserInput(personal.phone),
            email: sanitizeUserInput(personal.email),
            dateOfBirth: personal.dateOfBirth,
            dataConsent,
            marketingConsent: false,
            formType,
            answers: sanitizedAnswers,
            source: 'cabinet',
          })
          if (!res.success)
            throw new Error(
              res.error || t('cabinet.anketa.errors.submitFailed')
            )
          return res
        },
        { formType: 'intake' }
      )

      setFormType(null)
      await loadData()
    } catch (error) {
      captureException(
        error instanceof Error ? error : new Error(String(error))
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: IntakeField) => {
    const label = field.label[locale]
    if (field.kind === 'yesno') {
      const value = (answers[field.id] as string) ?? ''
      return (
        <div
          key={field.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b border-dental-secondary-100 py-2"
        >
          <span className="max-w-[70%] text-sm text-dental-text">{label}</span>
          {/* Toggle buttons (press again to clear), not an ARIA radiogroup —
              radios would require roving tabindex per the APG pattern */}
          <div className="flex gap-1" role="group" aria-label={label}>
            {(['yes', 'no'] as const).map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={value === option}
                onClick={() =>
                  setAnswer(field.id, value === option ? '' : option)
                }
                className={`rounded-full px-4 py-1 text-xs font-semibold transition-colors ${
                  value === option
                    ? option === 'yes'
                      ? 'bg-dental-primary-600 text-white'
                      : 'bg-dental-dark text-white'
                    : 'bg-dental-secondary-100 text-dental-text hover:bg-dental-secondary-200'
                }`}
              >
                {option === 'yes'
                  ? t('cabinet.anketa.yes')
                  : t('cabinet.anketa.no')}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (field.kind === 'scale') {
      const value = answers[field.id]
      return (
        <div key={field.id} className="py-2">
          <label
            htmlFor={`f-${field.id}`}
            className="mb-1 block text-sm text-dental-text"
          >
            {label}
          </label>
          <Select
            id={`f-${field.id}`}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={e =>
              setAnswer(
                field.id,
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
          >
            <option value="">—</option>
            {Array.from(
              { length: field.max - field.min + 1 },
              (_, i) => field.min + i
            ).map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
      )
    }

    const value = (answers[field.id] as string) ?? ''
    return (
      <div key={field.id} className="py-2">
        <label
          htmlFor={`f-${field.id}`}
          className="mb-1 block text-sm text-dental-text"
        >
          {label}
        </label>
        {field.multiline ? (
          <Textarea
            id={`f-${field.id}`}
            rows={2}
            fullWidth
            maxLength={field.maxLength}
            value={value}
            onChange={e => setAnswer(field.id, e.target.value)}
          />
        ) : (
          <Input
            id={`f-${field.id}`}
            fullWidth
            maxLength={field.maxLength}
            value={value}
            onChange={e => setAnswer(field.id, e.target.value)}
          />
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dental-secondary-100 bg-white p-8 text-center text-dental-muted">
        {t('cabinet.anketa.loading')}
      </div>
    )
  }

  if (!formType) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-dental-secondary-100 bg-white p-6">
          <h2 className="mb-1 text-xl font-bold text-dental-dark">
            {t('cabinet.anketa.title')}
          </h2>
          <p className="mb-5 text-sm text-dental-text">
            {t('cabinet.anketa.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => startForm('adult')}>
              <FileText className="mr-2 h-4 w-4" />
              {t('cabinet.anketa.fillAdult')}
            </Button>
            <Button variant="outline" onClick={() => startForm('child')}>
              <FileText className="mr-2 h-4 w-4" />
              {t('cabinet.anketa.fillChild')}
            </Button>
          </div>

          <div className="mt-5 border-t border-dental-secondary-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dental-muted">
              {t('cabinet.anketa.blanksTitle')}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                href="/forms/anketa-adult.pdf"
                download
                className="inline-flex items-center gap-1.5 text-dental-primary-600 hover:underline"
              >
                <Download className="h-4 w-4" />
                {t('cabinet.anketa.blankAdult')}
              </a>
              <a
                href="/forms/anketa-child.pdf"
                download
                className="inline-flex items-center gap-1.5 text-dental-primary-600 hover:underline"
              >
                <Download className="h-4 w-4" />
                {t('cabinet.anketa.blankChild')}
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dental-secondary-100 bg-white">
          <div className="border-b border-dental-secondary-100 p-5">
            <h3 className="font-semibold text-dental-dark">
              {t('cabinet.anketa.submittedTitle')}
            </h3>
          </div>
          {submitted.length === 0 ? (
            <div className="p-8 text-center text-sm text-dental-muted">
              <ClipboardList className="mx-auto mb-2 h-8 w-8" />
              {t('cabinet.anketa.empty')}
            </div>
          ) : (
            <ul>
              {submitted.map(row => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-dental-secondary-100 p-4 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-dental-dark">
                      {row.last_name} {row.first_name}
                    </p>
                    <p className="text-xs text-dental-muted">
                      {new Date(row.created_at).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                  <span className="rounded-full bg-dental-primary-50 px-3 py-1 text-xs font-medium text-dental-primary-700">
                    {t(`cabinet.anketa.types.${row.form_type}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-dental-secondary-100 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-dental-dark">
            {formType === 'adult'
              ? t('cabinet.anketa.adultTitle')
              : t('cabinet.anketa.childTitle')}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFormType(null)}
          >
            {t('cabinet.anketa.back')}
          </Button>
        </div>

        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-dental-primary-600">
          {formType === 'adult'
            ? t('cabinet.anketa.personal')
            : t('cabinet.anketa.childPersonal')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            required
            aria-label={t('anketa.fields.lastNameLabel')}
            placeholder={t('anketa.fields.lastNameLabel')}
            value={personal.lastName}
            onChange={e =>
              setPersonal(p => ({ ...p, lastName: e.target.value }))
            }
          />
          <Input
            required
            aria-label={t('anketa.fields.firstNameLabel')}
            placeholder={t('anketa.fields.firstNameLabel')}
            value={personal.firstName}
            onChange={e =>
              setPersonal(p => ({ ...p, firstName: e.target.value }))
            }
          />
          <Input
            aria-label={t('anketa.fields.patronymicLabel')}
            placeholder={t('anketa.fields.patronymicLabel')}
            value={personal.patronymic}
            onChange={e =>
              setPersonal(p => ({ ...p, patronymic: e.target.value }))
            }
          />
          <Input
            type="date"
            aria-label={t('anketa.fields.dateOfBirthLabel')}
            value={personal.dateOfBirth}
            onChange={e =>
              setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))
            }
          />
          <Input
            required
            type="tel"
            aria-label={t('anketa.fields.phoneLabel')}
            placeholder={t('anketa.fields.phoneLabel')}
            value={personal.phone}
            onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
            onBlur={e =>
              setPersonal(p => ({
                ...p,
                phone: formatPhoneNumber(e.target.value),
              }))
            }
          />
          <Input
            type="email"
            aria-label={t('anketa.fields.emailLabel')}
            placeholder={t('anketa.fields.emailLabel')}
            value={personal.email}
            onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
          />
        </div>
      </div>

      {sections.map(section => (
        <div
          key={section.id}
          className="rounded-2xl border border-dental-secondary-100 bg-white p-6"
        >
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-dental-primary-600">
            {section.title[locale]}
          </h3>
          {section.fields.map(renderField)}
        </div>
      ))}

      <div className="rounded-2xl border border-dental-secondary-100 bg-white p-6">
        <label className="flex items-start gap-2 text-sm text-dental-dark">
          <input
            type="checkbox"
            required
            checked={dataConsent}
            onChange={e => setDataConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border border-dental-secondary-300"
          />
          {formType === 'adult'
            ? t('cabinet.anketa.consentAdult')
            : t('cabinet.anketa.consentChild')}
        </label>
        <Button
          type="submit"
          fullWidth
          size="lg"
          className="mt-4"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {!isSubmitting && <Send className="mr-2 h-5 w-5" />}
          {t('cabinet.anketa.submit')}
        </Button>
      </div>
    </form>
  )
}
