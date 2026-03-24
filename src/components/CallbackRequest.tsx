'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button, Select } from '@/components/ui'
import { callbackSchema } from '@/utils/validationSchemas'
import type { z } from 'zod'
import { withToast } from '@/utils/toast'
import { createContact } from '@/services/contacts'
import MicroFeedback from '@/components/MicroFeedback'

type CallbackValues = z.infer<typeof callbackSchema>

export default function CallbackRequest() {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<CallbackValues>({
    resolver: zodResolver(callbackSchema) as Resolver<CallbackValues>,
    defaultValues: {
      name: '',
      phone: '',
      preferredTime: 'any',
      service: '',
      consent: true,
    },
  })

  const onSubmit = async (data: CallbackValues) => {
    try {
      await withToast(
        async () => {
          const timeLabels: Record<string, string> = {
            any: t('callback.timeAny'),
            morning: t('callback.timeMorning'),
            afternoon: t('callback.timeAfternoon'),
            evening: t('callback.timeEvening'),
          }
          const message = [
            `[${t('callback.title')}]`,
            data.preferredTime
              ? `${t('callback.timeLabel')}: ${timeLabels[data.preferredTime] || data.preferredTime}`
              : '',
            data.service
              ? `${t('callback.serviceLabel')}: ${data.service}`
              : '',
          ]
            .filter(Boolean)
            .join('\n')

          const res = await createContact({
            name: data.name,
            phone: data.phone,
            email: '',
            message,
            consent: data.consent,
          })
          if (!res.success) throw new Error(t('callback.submitError'))
          return res
        },
        { formType: 'callback' }
      )

      reset({
        name: '',
        phone: '',
        preferredTime: 'any',
        service: '',
        consent: true,
      })
    } catch {
      // withToast already shows a user-facing error message
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {t('callback.title')}
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="cb-name" className="sr-only">
            {t('callback.nameLabel')}
          </label>
          <Input
            id="cb-name"
            placeholder={t('callback.namePlaceholder')}
            fullWidth
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <div>
          <label htmlFor="cb-phone" className="sr-only">
            {t('callback.phoneLabel')}
          </label>
          <Input
            id="cb-phone"
            type="tel"
            placeholder={t('callback.phonePlaceholder')}
            fullWidth
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cb-time" className="sr-only">
              {t('callback.timeLabel')}
            </label>
            <Select
              id="cb-time"
              fullWidth
              error={errors.preferredTime?.message}
              {...register('preferredTime')}
            >
              <option value="any">{t('callback.timeAny')}</option>
              <option value="morning">{t('callback.timeMorning')}</option>
              <option value="afternoon">{t('callback.timeAfternoon')}</option>
              <option value="evening">{t('callback.timeEvening')}</option>
            </Select>
          </div>
          <div>
            <label htmlFor="cb-service" className="sr-only">
              {t('callback.serviceLabel')}
            </label>
            <Input
              id="cb-service"
              placeholder={t('callback.servicePlaceholder')}
              {...register('service')}
            />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <input
            id="cb-consent"
            type="checkbox"
            className="mt-1"
            {...register('consent')}
          />
          <label htmlFor="cb-consent" className="text-xs text-gray-600">
            {t('callback.consentText')}
          </label>
        </div>
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {t('callback.submitButton')}
        </Button>
        {isSubmitSuccessful && (
          <div className="mt-2">
            <p className="text-xs text-green-600 mb-1">
              {t('callback.successMessage')}
            </p>
            <MicroFeedback form="callback" compact />
          </div>
        )}
      </form>
    </div>
  )
}
