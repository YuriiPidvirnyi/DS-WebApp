'use client'

import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from '@/components/ui'
import { newsletterSchema } from '@/utils/validationSchemas'
import type { z } from 'zod'
import { withToast } from '@/utils/toast'
import { subscribeNewsletter } from '@/services/subscriptions'
import MicroFeedback from '@/components/MicroFeedback'
import Turnstile, { type TurnstileRef } from '@/components/Turnstile'
import { assertValidTurnstile } from '@/utils/turnstileVerify'

type NewsletterValues = z.infer<typeof newsletterSchema>

export default function NewsletterSubscribe() {
  const { t } = useTranslation()
  const turnstileRef = useRef<TurnstileRef>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', consent: true },
  })

  const onSubmit = async (data: NewsletterValues) => {
    try {
      const token = turnstileRef.current?.getToken() ?? ''
      await assertValidTurnstile(token)
    } catch {
      return withToast.error(t('newsletter.turnstileError'))
    }

    try {
      await withToast(
        async () => {
          const res = await subscribeNewsletter(data.email)
          if (!res.success) throw new Error(t('newsletter.subscribeError'))
          return res
        },
        { formType: 'newsletter' }
      )
      reset({ email: '', consent: true })
      turnstileRef.current?.reset()
    } catch {
      // withToast already shows a user-facing error message
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
      aria-label={t('newsletter.formAriaLabel')}
    >
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            {t('newsletter.emailLabel')}
          </label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder={t('newsletter.emailPlaceholder')}
            fullWidth
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {t('newsletter.subscribe')}
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <input
          id="newsletter-consent"
          type="checkbox"
          className="mt-1"
          {...register('consent')}
        />
        <label
          htmlFor="newsletter-consent"
          className="text-xs text-dental-secondary"
        >
          {t('newsletter.consentText')}
        </label>
      </div>
      <Turnstile ref={turnstileRef} className="mt-2" />
      {isSubmitSuccessful && (
        <div className="text-xs text-dental-primary">
          <p>{t('newsletter.successMessage')}</p>
          <div className="mt-1">
            <MicroFeedback form="newsletter" compact />
          </div>
        </div>
      )}
    </form>
  )
}
