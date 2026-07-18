'use client'

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import { Button, LoadingOverlay } from '@/components/ui'
import Turnstile from '@/components/Turnstile'
import { useTranslation } from 'react-i18next'
import {
  BookingStepService,
  BookingStepPersonal,
  BookingSummary,
  useBookingForm,
} from '@/components/booking'
import { DOCTORS } from '@/components/booking/useBookingForm'
import { useCSRF } from '@/hooks/useCSRF'

/**
 * Multi-step booking form (3 steps):
 *   1. Appointment details (service, date, time, doctor)
 *   2. Personal information (name, phone, email, date of birth)
 *   3. Summary + confirmation (editable, consent, Turnstile)
 *
 * All logic is encapsulated in the `useBookingForm` hook.
 * Each step is rendered by a dedicated step component.
 *
 * Макет 1b: одна рамка (без картки-в-картці), пронумеровані підписані кроки,
 * панель «Ваш запис» тримає контекст на кожному кроці.
 */
export default function BookingForm() {
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const {
    form,
    step,
    next,
    back,
    slots,
    loadingSlots,
    slotsLoadError,
    turnstileRef,
    isCoolingDown,
    remainingSec,
    editingField,
    startEditing,
    cancelEditing,
    saveEditing,
    onSubmit,
  } = useBookingForm()

  const {
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form

  // Step titles (reuse existing i18n keys) shown as the wizard heading
  const stepTitleKeys = [
    'booking.steps.service',
    'booking.steps.personal',
    'booking.steps.summary',
  ] as const

  // Move focus to the step heading on step change so screen-reader and
  // keyboard users are told which step they're on (skip the initial mount).
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const isInitialStep = useRef(true)
  useEffect(() => {
    if (isInitialStep.current) {
      isInitialStep.current = false
      return
    }
    stepHeadingRef.current?.focus()
  }, [step])

  // «Ваш запис» — live context panel values
  const watchedService = watch('service')
  const watchedDate = watch('date')
  const watchedTime = watch('time')
  const watchedDoctor = watch('doctor')
  const doctorLabel =
    watchedDoctor === 'any' || !watchedDoctor
      ? t('booking.fields.anyDoctor')
      : (DOCTORS.find(d => d.id === watchedDoctor)?.name ?? '—')

  const summaryRows = [
    { label: t('booking.fields.serviceLabel'), value: watchedService || '—' },
    { label: t('booking.fields.dateLabel'), value: watchedDate || '—' },
    { label: t('booking.fields.timeLabel'), value: watchedTime || '—' },
    { label: t('booking.fields.doctorLabel'), value: doctorLabel },
  ]

  return (
    <div className="bg-white rounded-md border border-dental-secondary-200 shadow-soft p-5 sm:p-9 relative">
      <h2 className="text-2xl font-bold text-dental-dark mb-6">
        {t('booking.form.heading')}
      </h2>

      {isSubmitSuccessful && (
        <div className="mb-6 p-4 bg-dental-primary/10 border border-dental-primary/30 rounded-lg">
          <p className="text-dental-primary-darker">
            {t('booking.bookingSuccess')}{' '}
            {t('booking.bookingSuccessDescription')}
          </p>
        </div>
      )}

      {/* Screen reader error announcer */}
      <div aria-live="polite" role="status" className="sr-only">
        {errors?.service?.message ||
          errors?.date?.message ||
          errors?.time?.message ||
          errors?.firstName?.message ||
          errors?.lastName?.message ||
          errors?.email?.message ||
          errors?.phone?.message ||
          errors?.dateOfBirth?.message ||
          errors?.consent?.message}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* CSRF Token - hidden input for form protection */}
        <input type="hidden" name="_csrf" value={csrfToken} />

        {/* Numbered, labelled stepper — видно весь шлях (знахідка 13) */}
        <div
          className="mb-2"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuetext={t('booking.steps.progress', {
            current: step + 1,
            total: 3,
          })}
          aria-label={t('booking.steps.progressAria')}
        >
          <div aria-hidden="true" className="flex items-start">
            {stepTitleKeys.map((key, i) => (
              <div key={key} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-center">
                  <div
                    className={clsx(
                      'h-0.5 flex-1',
                      i === 0
                        ? 'bg-transparent'
                        : i <= step
                          ? 'bg-dental-primary-300'
                          : 'bg-dental-secondary-200'
                    )}
                  />
                  <div
                    className={clsx(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
                      i < step &&
                        'bg-dental-primary-600 text-white',
                      i === step && 'bg-dental-primary-600 text-white',
                      i === step + 1 &&
                        'border-2 border-dental-primary-200 bg-white text-dental-primary-500',
                      i > step + 1 &&
                        'border-2 border-dental-secondary-200 bg-white text-dental-secondary-500'
                    )}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <div
                    className={clsx(
                      'h-0.5 flex-1',
                      i === stepTitleKeys.length - 1
                        ? 'bg-transparent'
                        : i < step
                          ? 'bg-dental-primary-300'
                          : 'bg-dental-secondary-200'
                    )}
                  />
                </div>
                <span
                  className={clsx(
                    'mt-1.5 text-[13px] text-center px-1',
                    i === step
                      ? 'font-semibold text-dental-dark'
                      : 'font-medium text-dental-muted'
                  )}
                >
                  {t(key)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          <div className="space-y-6 min-w-0">
            {/* Current step title — focused on step change for SR/keyboard users */}
            <h3
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-lg font-semibold text-dental-dark focus:outline-hidden"
            >
              {t(stepTitleKeys[step])}
            </h3>

            {/* Step 1: Appointment details */}
            {step === 0 && (
              <BookingStepService
                form={form}
                slots={slots}
                loadingSlots={loadingSlots}
                slotsLoadError={slotsLoadError}
              />
            )}

            {/* Step 2: Personal information */}
            {step === 1 && <BookingStepPersonal form={form} />}

            {/* Step 3: Summary + confirmation */}
            {step === 2 && (
              <>
                <BookingSummary
                  form={form}
                  slots={slots}
                  loadingSlots={loadingSlots}
                  slotsLoadError={slotsLoadError}
                  editingField={editingField}
                  onStartEdit={startEditing}
                  onSave={saveEditing}
                  onCancel={cancelEditing}
                />
                {errors.consent && (
                  <p className="text-sm text-dental-error">
                    {errors.consent.message}
                  </p>
                )}
                <Turnstile ref={turnstileRef} className="mt-2" />
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={back}
                  disabled={isSubmitting}
                >
                  {t('common.back')}
                </Button>
              ) : (
                <span />
              )}

              {step < 2 ? (
                <Button
                  type="button"
                  className="min-h-11"
                  onClick={next}
                  disabled={isSubmitting}
                >
                  {step === 0
                    ? t('booking.form.nextPersonal')
                    : t('booking.form.nextSummary')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || isCoolingDown}
                  isLoading={isSubmitting}
                >
                  {isCoolingDown
                    ? t('booking.form.cooldown', { seconds: remainingSec })
                    : t('booking.form.submit')}
                </Button>
              )}
            </div>
          </div>

          {/* Панель «Ваш запис» — контекст запису на кожному кроці */}
          <aside
            className="hidden lg:block self-start rounded-md bg-dental-primary-50 p-6"
            aria-label={t('booking.form.panelTitle')}
          >
            <h4 className="text-base font-bold text-dental-dark mb-4">
              {t('booking.form.panelTitle')}
            </h4>
            <dl className="space-y-3">
              {summaryRows.map(row => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <dt className="text-dental-muted">{row.label}</dt>
                  <dd className="font-medium text-dental-dark text-right wrap-break-word min-w-0">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-dental-primary-200 pt-4 text-[13px] leading-snug text-dental-muted">
              {t('booking.form.panelNote')}
            </p>
          </aside>
        </div>
      </form>

      {isSubmitting && (
        <LoadingOverlay show message={t('booking.form.submittingOverlay')} />
      )}
    </div>
  )
}
