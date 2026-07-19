'use client'

import { useRef, type KeyboardEvent } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Input, Select, LoadingOverlay, AsyncState } from '@/components/ui'
import { SERVICES, DOCTORS, type BookingFormValues } from './useBookingForm'

interface BookingStepServiceProps {
  form: UseFormReturn<BookingFormValues>
  slots: string[]
  loadingSlots: boolean
  slotsLoadError?: string | null
}

const labelClass = 'block text-sm font-medium text-dental-dark mb-1.5'

/**
 * Step 1 of the booking wizard: appointment details
 * (service, date, time, doctor, first-visit checkbox)
 *
 * Макет 1b: час — чипи вільних слотів замість select (доступність видно
 * одразу); чекбокс — повнорядковий label із ціллю натискання ≥44px.
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
    setValue,
    watch,
    formState: { errors },
  } = form

  const selectedTime = watch('time')
  const slotRefs = useRef<Array<HTMLButtonElement | null>>([])

  const selectSlot = (slot: string) =>
    setValue('time', slot, { shouldValidate: true, shouldDirty: true })

  // WAI-ARIA radiogroup keyboard pattern: arrows move focus AND selection
  // (with wrap), Home/End jump to the ends. Combined with the roving tabindex
  // below, the group is a single Tab stop.
  const onSlotKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let next: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % slots.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + slots.length) % slots.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = slots.length - 1
        break
      default:
        return
    }
    e.preventDefault()
    selectSlot(slots[next])
    slotRefs.current[next]?.focus()
  }

  // Roving tabindex: the checked slot is the tab stop; if none is picked yet,
  // the first slot is, so keyboard users always enter the group in one Tab.
  const selectedIndex = slots.indexOf(selectedTime)
  const activeIndex = selectedIndex === -1 ? 0 : selectedIndex

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="service" className={labelClass}>
            {t('booking.fields.serviceLabel')}{' '}
            <span className="text-dental-error">*</span>
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
          <label htmlFor="date" className={labelClass}>
            {t('booking.fields.dateLabel')}{' '}
            <span className="text-dental-error">*</span>
          </label>
          <Input
            id="date"
            type="date"
            fullWidth
            error={errors.date?.message}
            {...register('date')}
          />
        </div>
      </div>

      {/* Вільний час — чипи доступних слотів */}
      <div className="relative">
        <span id="time-label" className={labelClass}>
          {t('booking.fields.timeLabel')}{' '}
          <span className="text-dental-error">*</span>
        </span>
        <input type="hidden" {...register('time')} />
        {slots.length > 0 && (
          <div
            role="radiogroup"
            aria-labelledby="time-label"
            aria-invalid={errors.time ? true : undefined}
            aria-describedby={errors.time ? 'time-error' : undefined}
            className="flex flex-wrap gap-2"
          >
            {slots.map((slot, index) => {
              const selected = selectedTime === slot
              return (
                <button
                  key={slot}
                  ref={el => {
                    slotRefs.current[index] = el
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={index === activeIndex ? 0 : -1}
                  onClick={() => selectSlot(slot)}
                  onKeyDown={e => onSlotKeyDown(e, index)}
                  className={clsx(
                    'min-h-11 rounded-full px-4.5 text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-1 focus:ring-dental-primary-300',
                    selected
                      ? 'bg-dental-primary-600 font-semibold text-white shadow-soft'
                      : 'border border-dental-secondary-300 bg-white font-medium text-dental-muted hover:border-dental-primary-400 hover:text-dental-dark'
                  )}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        )}
        {errors.time?.message && (
          <p
            id="time-error"
            className="mt-2 text-sm text-dental-error"
            role="alert"
          >
            {errors.time.message}
          </p>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="doctor" className={labelClass}>
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

        {/* Повнорядковий label — тач-ціль ≥44px (знахідка 04) */}
        <label
          htmlFor="isFirstVisit"
          className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dental-secondary-200 px-4 py-2.5 transition-colors hover:bg-dental-primary-50 has-checked:border-dental-primary-400 has-checked:bg-dental-primary-50"
        >
          <input
            type="checkbox"
            id="isFirstVisit"
            className="h-5 w-5 shrink-0 accent-dental-primary-600"
            {...register('isFirstVisit')}
          />
          <span className="text-sm text-dental-text">
            {t('booking.fields.firstVisit')}
          </span>
        </label>
      </div>
    </>
  )
}
