'use client'

import { type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Select, LoadingOverlay, AsyncState } from '@/components/ui'
import { SERVICES, DOCTORS, type BookingFormValues } from './useBookingForm'

interface BookingStepServiceProps {
  form: UseFormReturn<BookingFormValues>
  slots: string[]
  loadingSlots: boolean
  slotsLoadError?: string | null
}

/**
 * Step 1 of the booking wizard: appointment details
 * (service, date, time, doctor, first-visit checkbox)
 */
export default function BookingStepService({
  form,
  slots,
  loadingSlots,
  slotsLoadError,
}: BookingStepServiceProps) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="service"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.serviceLabel')} *
          </label>
          <Select
            id="service"
            fullWidth
            error={errors.service?.message}
            {...register('service')}
          >
            <option value="">{t('booking.selectService')}</option>
            {SERVICES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.dateLabel')} *
          </label>
          <Input
            id="date"
            type="date"
            fullWidth
            error={errors.date?.message}
            {...register('date')}
          />
        </div>

        <div className="relative">
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.timeLabel')} *
          </label>
          <Select
            id="time"
            fullWidth
            error={errors.time?.message}
            {...register('time')}
          >
            <option value="">{t('booking.selectTime')}</option>
            {slots.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <LoadingOverlay
            show={loadingSlots}
            message={t('booking.slots.loadingMessage')}
          />
          {slotsLoadError && (
            <AsyncState
              variant="error"
              message={slotsLoadError}
              className="mt-2 px-3 py-3"
            />
          )}
          {!slotsLoadError && !loadingSlots && slots.length === 0 && (
            <AsyncState
              variant="empty"
              message={t('booking.slots.empty')}
              className="mt-2 px-3 py-3"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="doctor"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('booking.fields.doctorLabel')}
          </label>
          <Select id="doctor" fullWidth {...register('doctor')}>
            {DOCTORS.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2 mt-6 md:mt-8">
          <input
            type="checkbox"
            id="isFirstVisit"
            {...register('isFirstVisit')}
          />
          <label htmlFor="isFirstVisit" className="text-sm text-gray-700">
            {t('booking.fields.firstVisit')}
          </label>
        </div>
      </div>
    </>
  )
}
