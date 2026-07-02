'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, CheckCircle } from 'lucide-react'
import { Input, Textarea, Button } from './ui'
import { useSubmissionCooldown } from '@/hooks/useSubmissionCooldown'
import { useCSRF } from '@/hooks/useCSRF'
import {
  contactFormSchema,
  type ContactFormData,
  formatPhoneNumber,
} from '../utils/validationSchemas'
import { withToast } from '../utils/toast'
import { sanitizeUserInput } from '../utils/security'
import { createContact } from '@/services/contacts'
import { trackFormSubmission } from '@/utils/analytics'
import MicroFeedback from '@/components/MicroFeedback'
import Turnstile, { TurnstileRef } from '@/components/Turnstile'
import { assertValidTurnstile } from '@/utils/turnstileVerify'

interface ContactFormProps {
  onSuccess?: () => void
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const { t } = useTranslation()
  const turnstileRef = useRef<TurnstileRef>(null)
  const { token: csrfToken } = useCSRF()
  const {
    isCoolingDown,
    remainingSec,
    start: startCooldown,
  } = useSubmissionCooldown('contact_form', 30)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      consent: false,
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Cooldown check to prevent spam
      if (isCoolingDown) {
        return withToast.error(
          t('contact.form.errors.cooldown', { seconds: remainingSec })
        )
      }

      // Verify Turnstile token (client-side pre-check)
      const cfToken = turnstileRef.current?.getToken() || ''
      try {
        await assertValidTurnstile(cfToken)
      } catch (error) {
        if (error instanceof Error) {
          return withToast.error(error.message)
        }
        return withToast.error(t('contact.form.errors.turnstile'))
      }

      // Sanitize input data
      const sanitizedData = {
        name: sanitizeUserInput(data.name),
        email: sanitizeUserInput(data.email),
        phone: sanitizeUserInput(data.phone),
        message: sanitizeUserInput(data.message),
        consent: data.consent,
        cf_turnstile_response: cfToken,
      }

      // Real API call
      await withToast(
        async () => {
          const res = await createContact(sanitizedData)
          if (!res.success)
            throw new Error(res.error || t('contact.form.errors.submitFailed'))
          return res
        },
        { formType: 'contact' }
      )

      // Start cooldown and reset form on success
      try {
        trackFormSubmission('contact', true)
      } catch {
        // analytics may fail silently
      }
      startCooldown()
      reset()

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      import('@sentry/nextjs').then(Sentry => Sentry.captureException(error))
      // Error toast is handled by withToast utility
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-dental-dark mb-6">
        {t('contact.form.title')}
      </h2>

      {isSubmitSuccessful && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">
                {t('contact.form.successTitle')}
              </h4>
              <p className="text-sm text-green-700">
                {t('contact.form.successDescription')}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <MicroFeedback form="contact" />
          </div>
        </div>
      )}

      {/* Screen reader error announcer */}
      <div aria-live="polite" role="status" className="sr-only">
        {errors?.name?.message ||
          errors?.phone?.message ||
          errors?.email?.message ||
          errors?.message?.message}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* CSRF Token - hidden input for form protection */}
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-dental-dark mb-1"
          >
            {t('contact.form.fields.fullNameLabel')} *
          </label>
          <Input
            id="name"
            fullWidth
            required
            placeholder={t('contact.form.fields.fullNamePlaceholder')}
            disabled={isSubmitting}
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-dental-dark mb-1"
          >
            {t('contact.form.fields.phoneLabel')} *
          </label>
          <Input
            id="phone"
            type="tel"
            fullWidth
            required
            placeholder={t('contact.form.fields.phonePlaceholder')}
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
            className="block text-sm font-medium text-dental-dark mb-1"
          >
            {t('contact.form.fields.emailLabel')} *
          </label>
          <Input
            id="email"
            type="email"
            fullWidth
            required
            placeholder={t('contact.form.fields.emailPlaceholder')}
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-dental-dark mb-1"
          >
            {t('contact.form.fields.messageLabel')} *
          </label>
          <Textarea
            id="message"
            rows={4}
            fullWidth
            required
            placeholder={t('contact.form.fields.messagePlaceholder')}
            disabled={isSubmitting}
            error={errors.message?.message}
            {...register('message')}
          />
        </div>

        <div className="flex items-start mb-6">
          <div className="flex items-center h-5">
            <input
              id="consent"
              type="checkbox"
              required
              className="w-4 h-4 border border-dental-secondary-300 rounded bg-dental-secondary-50 focus:ring-3 focus:ring-dental-primary-300"
              disabled={isSubmitting}
              {...register('consent')}
            />
          </div>
          <label
            htmlFor="consent"
            className="ml-2 text-sm font-medium text-dental-dark"
          >
            {t('contact.form.fields.consentLabel')} *
          </label>
        </div>
        {errors.consent && (
          <p className="text-sm text-red-600 mt-1">{errors.consent.message}</p>
        )}

        <Turnstile ref={turnstileRef} className="mb-4" />

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={isSubmitting || isCoolingDown}
          isLoading={isSubmitting}
        >
          {!isSubmitting && <Send className="h-5 w-5 mr-2" />}
          {isCoolingDown
            ? t('contact.form.cooldown', { seconds: remainingSec })
            : t('contact.form.submit')}
        </Button>

        <p className="text-sm text-dental-muted text-center">
          {t('contact.form.requiredFields')}
        </p>
      </form>
    </div>
  )
}
