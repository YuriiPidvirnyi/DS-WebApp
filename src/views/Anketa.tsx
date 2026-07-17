'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Send, CheckCircle, Gift } from 'lucide-react'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { useSubmissionCooldown } from '@/hooks/useSubmissionCooldown'
import { useCSRF } from '@/hooks/useCSRF'
import {
  intakeFormSchema,
  type IntakeFormData,
  formatPhoneNumber,
} from '@/utils/validationSchemas'
import { withToast } from '@/utils/toast'
import { sanitizeUserInput } from '@/utils/security'
import { createIntake } from '@/services/intake'
import { trackFormSubmission } from '@/utils/analytics'
import Turnstile, { TurnstileRef } from '@/components/Turnstile'
import { assertValidTurnstile } from '@/utils/turnstileVerify'

const ATTRIBUTION_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/

function normalizeAttribution(raw: string | null): string {
  const value = (raw ?? '').trim()
  return ATTRIBUTION_PATTERN.test(value) ? value : ''
}

export default function Anketa() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const turnstileRef = useRef<TurnstileRef>(null)
  const { token: csrfToken } = useCSRF()
  const {
    isCoolingDown,
    remainingSec,
    start: startCooldown,
  } = useSubmissionCooldown('intake_form', 60)

  const promoCode = normalizeAttribution(searchParams.get('promo'))
  const source = normalizeAttribution(searchParams.get('src'))

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setValue,
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      patronymic: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      allergies: '',
      medications: '',
      chronicConditions: '',
      pregnancy: '',
      complaints: '',
      dataConsent: false,
      marketingConsent: false,
    },
  })

  const onSubmit = async (data: IntakeFormData) => {
    try {
      if (isCoolingDown) {
        return withToast.error(
          t('anketa.errors.cooldown', { seconds: remainingSec })
        )
      }

      const cfToken = turnstileRef.current?.getToken() || ''
      try {
        await assertValidTurnstile(cfToken)
      } catch (error) {
        if (error instanceof Error) {
          return withToast.error(error.message)
        }
        return withToast.error(t('anketa.errors.turnstile'))
      }

      const sanitized = {
        firstName: sanitizeUserInput(data.firstName),
        lastName: sanitizeUserInput(data.lastName),
        patronymic: sanitizeUserInput(data.patronymic ?? ''),
        phone: sanitizeUserInput(data.phone),
        email: sanitizeUserInput(data.email ?? ''),
        dateOfBirth: data.dateOfBirth ?? '',
        allergies: sanitizeUserInput(data.allergies ?? ''),
        medications: sanitizeUserInput(data.medications ?? ''),
        chronicConditions: sanitizeUserInput(data.chronicConditions ?? ''),
        pregnancy: data.pregnancy ?? ('' as const),
        complaints: sanitizeUserInput(data.complaints ?? ''),
        dataConsent: data.dataConsent,
        marketingConsent: data.marketingConsent ?? false,
        promoCode,
        source,
        cf_turnstile_response: cfToken,
      }

      await withToast(
        async () => {
          const res = await createIntake(sanitized)
          if (!res.success)
            throw new Error(res.error || t('anketa.errors.submitFailed'))
          return res
        },
        { formType: 'intake' }
      )

      try {
        trackFormSubmission('intake', true, { source, promo: promoCode })
      } catch {
        // analytics may fail silently
      }
      startCooldown()
    } catch (error) {
      import('@sentry/nextjs').then(Sentry => Sentry.captureException(error))
      // Error toast is handled by withToast utility
    }
  }

  return (
    <div className="min-h-screen bg-dental-secondary-50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-dental-dark">
            {t('anketa.title')}
          </h1>
          <p className="mt-3 text-dental-text">{t('anketa.subtitle')}</p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-dental-primary-200 bg-dental-primary-50 p-4">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-dental-primary-600" />
          <p className="text-sm text-dental-dark">{t('anketa.giftNote')}</p>
        </div>

        {isSubmitSuccessful ? (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 shrink-0 text-green-600" />
              <div>
                <h2 className="mb-2 text-xl font-bold text-dental-dark">
                  {t('anketa.successTitle')}
                </h2>
                <p className="text-dental-text">
                  {t('anketa.successDescription')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            {/* Screen reader error announcer */}
            <div aria-live="polite" role="status" className="sr-only">
              {errors?.lastName?.message ||
                errors?.firstName?.message ||
                errors?.phone?.message ||
                errors?.dataConsent?.message}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" name="_csrf" value={csrfToken} />

              <h2 className="text-lg font-semibold text-dental-dark">
                {t('anketa.sections.personal')}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-1 block text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.lastNameLabel')} *
                  </label>
                  <Input
                    id="lastName"
                    fullWidth
                    required
                    autoComplete="family-name"
                    disabled={isSubmitting}
                    error={errors.lastName?.message}
                    {...register('lastName')}
                  />
                </div>
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-1 block text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.firstNameLabel')} *
                  </label>
                  <Input
                    id="firstName"
                    fullWidth
                    required
                    autoComplete="given-name"
                    disabled={isSubmitting}
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="patronymic"
                    className="mb-1 block text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.patronymicLabel')}
                  </label>
                  <Input
                    id="patronymic"
                    fullWidth
                    disabled={isSubmitting}
                    error={errors.patronymic?.message}
                    {...register('patronymic')}
                  />
                </div>
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="mb-1 block text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.dateOfBirthLabel')}
                  </label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    fullWidth
                    disabled={isSubmitting}
                    error={errors.dateOfBirth?.message}
                    {...register('dateOfBirth')}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.phoneLabel')} *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    fullWidth
                    required
                    autoComplete="tel"
                    placeholder="+380 67 123 45 67"
                    disabled={isSubmitting}
                    error={errors.phone?.message}
                    {...register('phone', {
                      onBlur: e => {
                        const formatted = formatPhoneNumber(e.target.value)
                        setValue('phone', formatted, { shouldValidate: true })
                      },
                    })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.emailLabel')}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    fullWidth
                    autoComplete="email"
                    disabled={isSubmitting}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
              </div>

              <h2 className="pt-2 text-lg font-semibold text-dental-dark">
                {t('anketa.sections.medical')}
              </h2>

              <div>
                <label
                  htmlFor="allergies"
                  className="mb-1 block text-sm font-medium text-dental-dark"
                >
                  {t('anketa.fields.allergiesLabel')}
                </label>
                <Textarea
                  id="allergies"
                  rows={2}
                  fullWidth
                  placeholder={t('anketa.fields.allergiesPlaceholder')}
                  disabled={isSubmitting}
                  error={errors.allergies?.message}
                  {...register('allergies')}
                />
              </div>

              <div>
                <label
                  htmlFor="medications"
                  className="mb-1 block text-sm font-medium text-dental-dark"
                >
                  {t('anketa.fields.medicationsLabel')}
                </label>
                <Textarea
                  id="medications"
                  rows={2}
                  fullWidth
                  placeholder={t('anketa.fields.medicationsPlaceholder')}
                  disabled={isSubmitting}
                  error={errors.medications?.message}
                  {...register('medications')}
                />
              </div>

              <div>
                <label
                  htmlFor="chronicConditions"
                  className="mb-1 block text-sm font-medium text-dental-dark"
                >
                  {t('anketa.fields.chronicConditionsLabel')}
                </label>
                <Textarea
                  id="chronicConditions"
                  rows={2}
                  fullWidth
                  placeholder={t('anketa.fields.chronicConditionsPlaceholder')}
                  disabled={isSubmitting}
                  error={errors.chronicConditions?.message}
                  {...register('chronicConditions')}
                />
              </div>

              <div>
                <label
                  htmlFor="pregnancy"
                  className="mb-1 block text-sm font-medium text-dental-dark"
                >
                  {t('anketa.fields.pregnancyLabel')}
                </label>
                <Select
                  id="pregnancy"
                  fullWidth
                  disabled={isSubmitting}
                  {...register('pregnancy')}
                >
                  <option value="">
                    {t('anketa.fields.pregnancyOptions.notApplicable')}
                  </option>
                  <option value="no">
                    {t('anketa.fields.pregnancyOptions.no')}
                  </option>
                  <option value="yes">
                    {t('anketa.fields.pregnancyOptions.yes')}
                  </option>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="complaints"
                  className="mb-1 block text-sm font-medium text-dental-dark"
                >
                  {t('anketa.fields.complaintsLabel')}
                </label>
                <Textarea
                  id="complaints"
                  rows={3}
                  fullWidth
                  placeholder={t('anketa.fields.complaintsPlaceholder')}
                  disabled={isSubmitting}
                  error={errors.complaints?.message}
                  {...register('complaints')}
                />
              </div>

              <h2 className="pt-2 text-lg font-semibold text-dental-dark">
                {t('anketa.sections.consent')}
              </h2>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="dataConsent"
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 rounded border border-dental-secondary-300 bg-dental-secondary-50 focus:ring-3 focus:ring-dental-primary-300"
                    disabled={isSubmitting}
                    {...register('dataConsent')}
                  />
                  <label
                    htmlFor="dataConsent"
                    className="ml-2 text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.dataConsentLabel')} *
                  </label>
                </div>
                {errors.dataConsent && (
                  <p className="text-sm text-red-600">
                    {errors.dataConsent.message}
                  </p>
                )}

                <div className="flex items-start">
                  <input
                    id="marketingConsent"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border border-dental-secondary-300 bg-dental-secondary-50 focus:ring-3 focus:ring-dental-primary-300"
                    disabled={isSubmitting}
                    {...register('marketingConsent')}
                  />
                  <label
                    htmlFor="marketingConsent"
                    className="ml-2 text-sm font-medium text-dental-dark"
                  >
                    {t('anketa.fields.marketingConsentLabel')}
                  </label>
                </div>
              </div>

              <Turnstile ref={turnstileRef} className="mb-4" />

              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isSubmitting || isCoolingDown}
                isLoading={isSubmitting}
              >
                {!isSubmitting && <Send className="mr-2 h-5 w-5" />}
                {isCoolingDown
                  ? t('anketa.cooldown', { seconds: remainingSec })
                  : t('anketa.submit')}
              </Button>

              <p className="text-center text-sm text-dental-muted">
                {t('anketa.requiredFields')}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
