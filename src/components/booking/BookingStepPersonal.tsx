'use client'

import { type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui'
import { formatPhoneNumber } from '@/utils/validationSchemas'
import { type BookingFormValues } from './useBookingForm'

interface BookingStepPersonalProps {
  form: UseFormReturn<BookingFormValues>
}

/**
 * Step 2 of the booking wizard: patient personal information
 * (first name, last name, phone, email, date of birth)
 */
export default function BookingStepPersonal({
  form,
}: BookingStepPersonalProps) {
  const { t } = useTranslation()
  const {
    register,
    setValue,
    formState: { errors },
  } = form

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.firstNameLabel')} *
          </label>
          <Input
            id="firstName"
            fullWidth
            placeholder={t('booking.fields.firstNamePlaceholder')}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.lastNameLabel')} *
          </label>
          <Input
            id="lastName"
            fullWidth
            placeholder={t('booking.fields.lastNamePlaceholder')}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.phoneLabel')} *
          </label>
          <Input
            id="phone"
            type="tel"
            fullWidth
            placeholder={t('booking.fields.phonePlaceholder')}
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
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.emailLabel')} *
          </label>
          <Input
            id="email"
            type="email"
            fullWidth
            placeholder={t('booking.fields.emailPlaceholder')}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.dateOfBirthLabel')} *
          </label>
          <Input
            id="dateOfBirth"
            type="date"
            fullWidth
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
        </div>
      </div>
    </>
  )
}
