'use client'

import { type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Input,
  Select,
  Textarea,
  LoadingOverlay,
  AsyncState,
} from '@/components/ui'
import EditableField from './EditableField'
import { SERVICES, DOCTORS, type BookingFormValues } from './useBookingForm'

interface BookingSummaryProps {
  form: UseFormReturn<BookingFormValues>
  slots: string[]
  loadingSlots: boolean
  slotsLoadError?: string | null
  editingField: keyof BookingFormValues | null
  onStartEdit: (field: keyof BookingFormValues) => void
  onSave: () => void
  onCancel: () => void
}

/**
 * Step 3 of the booking wizard: summary + confirmation.
 * Shows all entered data with inline-edit capability, plus
 * the reminder preference, consent checkbox, and Turnstile slot.
 */
export default function BookingSummary({
  form,
  slots,
  loadingSlots,
  slotsLoadError,
  editingField,
  onStartEdit,
  onSave,
  onCancel,
}: BookingSummaryProps) {
  const { t } = useTranslation()
  const {
    register,
    watch,
    formState: { errors },
  } = form

  const doctorValue = watch('doctor')
  const doctorLabel =
    doctorValue === 'any'
      ? t('booking.fields.anyDoctor')
      : (DOCTORS.find(d => d.id === doctorValue)?.name ?? '—')

  return (
    <>
      {/* Summary grid */}
      <div className="bg-dental-secondary-50 border border-dental-secondary-200 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-dental-dark mb-3">
          {t('booking.summary.title')}
          <span className="ml-2 text-xs text-dental-muted font-normal">
            ({t('booking.summary.hint')})
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {/* Service */}
          <EditableField
            label={t('booking.fields.serviceLabel')}
            value={watch('service') || '—'}
            isEditing={editingField === 'service'}
            onStartEdit={() => onStartEdit('service')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Select
              fullWidth
              error={errors.service?.message}
              {...register('service')}
              autoFocus
            >
              <option value="">{t('booking.selectService')}</option>
              {SERVICES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </EditableField>

          {/* Date */}
          <EditableField
            label={t('booking.fields.dateLabel')}
            value={watch('date') || '—'}
            isEditing={editingField === 'date'}
            onStartEdit={() => onStartEdit('date')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Input
              type="date"
              fullWidth
              aria-label={t('booking.fields.dateLabel')}
              error={errors.date?.message}
              {...register('date')}
              autoFocus
            />
          </EditableField>

          {/* Time */}
          <EditableField
            label={t('booking.fields.timeLabel')}
            value={watch('time') || '—'}
            isEditing={editingField === 'time'}
            onStartEdit={() => onStartEdit('time')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <div className="relative">
              <Select
                fullWidth
                aria-label={t('booking.fields.timeLabel')}
                error={errors.time?.message}
                {...register('time')}
                autoFocus
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
                  message={t('booking.slots.summaryEmpty')}
                  className="mt-2 px-3 py-3"
                />
              )}
            </div>
          </EditableField>

          {/* Doctor */}
          <EditableField
            label={t('booking.fields.doctorLabel')}
            value={doctorLabel}
            isEditing={editingField === 'doctor'}
            onStartEdit={() => onStartEdit('doctor')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Select
              fullWidth
              aria-label={t('booking.fields.doctorLabel')}
              error={errors.doctor?.message}
              {...register('doctor')}
              autoFocus
            >
              {DOCTORS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </EditableField>

          {/* Name (first + last together) */}
          <EditableField
            label={t('booking.fields.fullNameLabel')}
            value={`${watch('firstName')} ${watch('lastName')}`}
            isEditing={
              editingField === 'firstName' || editingField === 'lastName'
            }
            onStartEdit={() => onStartEdit('firstName')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                fullWidth
                placeholder={t('booking.fields.firstNamePlaceholder')}
                error={errors.firstName?.message}
                {...register('firstName')}
                autoFocus={editingField === 'firstName'}
              />
              <Input
                fullWidth
                placeholder={t('booking.fields.lastNamePlaceholder')}
                error={errors.lastName?.message}
                {...register('lastName')}
                autoFocus={editingField === 'lastName'}
              />
            </div>
          </EditableField>

          {/* Phone */}
          <EditableField
            label={t('booking.fields.phoneLabel')}
            value={watch('phone') || '—'}
            isEditing={editingField === 'phone'}
            onStartEdit={() => onStartEdit('phone')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Input
              type="tel"
              fullWidth
              placeholder={t('booking.fields.phonePlaceholder')}
              error={errors.phone?.message}
              {...register('phone')}
              autoFocus
            />
          </EditableField>

          {/* Email */}
          <EditableField
            label={t('booking.fields.emailLabel')}
            value={watch('email') || '—'}
            isEditing={editingField === 'email'}
            onStartEdit={() => onStartEdit('email')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Input
              type="email"
              fullWidth
              placeholder={t('booking.fields.emailPlaceholder')}
              error={errors.email?.message}
              {...register('email')}
              autoFocus
            />
          </EditableField>

          {/* Date of Birth */}
          <EditableField
            label={t('booking.fields.dateOfBirthLabel')}
            value={watch('dateOfBirth') || '—'}
            isEditing={editingField === 'dateOfBirth'}
            onStartEdit={() => onStartEdit('dateOfBirth')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Input
              type="date"
              fullWidth
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
              autoFocus
            />
          </EditableField>

          {/* Symptoms / Notes — spans full width */}
          <EditableField
            label={t('booking.fields.symptomsLabel')}
            value={
              <span className="whitespace-pre-wrap wrap-break-word">
                {watch('symptoms') || '—'}
              </span>
            }
            isEditing={editingField === 'symptoms'}
            onStartEdit={() => onStartEdit('symptoms')}
            onSave={onSave}
            onCancel={onCancel}
            className="md:col-span-2"
          >
            <Textarea
              rows={4}
              fullWidth
              placeholder={t('booking.fields.symptomsPlaceholder')}
              error={errors.symptoms?.message}
              {...register('symptoms')}
              autoFocus
            />
          </EditableField>
        </div>
      </div>

      {/* Additional options */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="reminderPreference"
            className="block text-sm font-medium text-dental-dark mb-1"
          >
            {t('booking.fields.reminderPreferenceLabel')}
          </label>
          <Select
            id="reminderPreference"
            fullWidth
            {...register('reminderPreference')}
          >
            <option value="email">
              {t('booking.fields.reminderOptions.email')}
            </option>
            <option value="sms">
              {t('booking.fields.reminderOptions.sms')}
            </option>
            <option value="both">
              {t('booking.fields.reminderOptions.both')}
            </option>
            <option value="none">
              {t('booking.fields.reminderOptions.none')}
            </option>
          </Select>
        </div>

        {/* Повнорядковий label згоди — тач-ціль ≥44px (знахідка 04) */}
        <label
          htmlFor="consent"
          className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dental-secondary-200 px-4 py-2.5 transition-colors hover:bg-dental-primary-50 has-checked:border-dental-primary-400 has-checked:bg-dental-primary-50"
        >
          <input
            id="consent"
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-dental-primary-600"
            {...register('consent')}
          />
          <span className="text-sm text-dental-text">
            {t('booking.fields.consentLabel')}{' '}
            <span className="text-dental-error">*</span>
          </span>
        </label>
      </div>
    </>
  )
}
