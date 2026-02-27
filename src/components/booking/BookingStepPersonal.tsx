'use client'

import { type UseFormReturn } from 'react-hook-form'
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
            Ім&apos;я *
          </label>
          <Input
            id="firstName"
            fullWidth
            placeholder="Ім'я"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Прізвище *
          </label>
          <Input
            id="lastName"
            fullWidth
            placeholder="Прізвище"
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
            Телефон *
          </label>
          <Input
            id="phone"
            type="tel"
            fullWidth
            placeholder="+380 XX XXX XX XX"
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
            Email *
          </label>
          <Input
            id="email"
            type="email"
            fullWidth
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Дата народження *
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
