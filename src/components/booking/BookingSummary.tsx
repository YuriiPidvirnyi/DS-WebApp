import { type UseFormReturn } from 'react-hook-form'
import { Input, Select, Textarea, LoadingOverlay } from '@/components/ui'
import EditableField from './EditableField'
import { SERVICES, DOCTORS, type BookingFormValues } from './useBookingForm'

interface BookingSummaryProps {
  form: UseFormReturn<BookingFormValues>
  slots: string[]
  loadingSlots: boolean
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
  editingField,
  onStartEdit,
  onSave,
  onCancel,
}: BookingSummaryProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form

  const doctorValue = watch('doctor')
  const doctorLabel =
    doctorValue === 'any'
      ? 'Будь-який'
      : (DOCTORS.find(d => d.id === doctorValue)?.name ?? '—')

  return (
    <>
      {/* Summary grid */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Перевірте дані перед підтвердженням
          <span className="ml-2 text-xs text-gray-500 font-normal">
            (натисніть на поле для редагування)
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {/* Service */}
          <EditableField
            label="Послуга"
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
              <option value="">Оберіть послугу</option>
              {SERVICES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </EditableField>

          {/* Date */}
          <EditableField
            label="Дата"
            value={watch('date') || '—'}
            isEditing={editingField === 'date'}
            onStartEdit={() => onStartEdit('date')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Input
              type="date"
              fullWidth
              aria-label="Дата"
              error={errors.date?.message}
              {...register('date')}
              autoFocus
            />
          </EditableField>

          {/* Time */}
          <EditableField
            label="Час"
            value={watch('time') || '—'}
            isEditing={editingField === 'time'}
            onStartEdit={() => onStartEdit('time')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <div className="relative">
              <Select
                fullWidth
                aria-label="Час"
                error={errors.time?.message}
                {...register('time')}
                autoFocus
              >
                <option value="">Оберіть час</option>
                {slots.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <LoadingOverlay
                show={loadingSlots}
                message="Завантажуємо вільні години..."
              />
            </div>
          </EditableField>

          {/* Doctor */}
          <EditableField
            label="Лікар"
            value={doctorLabel}
            isEditing={editingField === 'doctor'}
            onStartEdit={() => onStartEdit('doctor')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Select
              fullWidth
              aria-label="Лікар"
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
            label="Ім'я"
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
                placeholder="Ім'я"
                error={errors.firstName?.message}
                {...register('firstName')}
                autoFocus={editingField === 'firstName'}
              />
              <Input
                fullWidth
                placeholder="Прізвище"
                error={errors.lastName?.message}
                {...register('lastName')}
                autoFocus={editingField === 'lastName'}
              />
            </div>
          </EditableField>

          {/* Phone */}
          <EditableField
            label="Телефон"
            value={watch('phone') || '—'}
            isEditing={editingField === 'phone'}
            onStartEdit={() => onStartEdit('phone')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Input
              type="tel"
              fullWidth
              placeholder="+380 XX XXX XX XX"
              error={errors.phone?.message}
              {...register('phone')}
              autoFocus
            />
          </EditableField>

          {/* Email */}
          <EditableField
            label="Email"
            value={watch('email') || '—'}
            isEditing={editingField === 'email'}
            onStartEdit={() => onStartEdit('email')}
            onSave={onSave}
            onCancel={onCancel}
          >
            <Input
              type="email"
              fullWidth
              placeholder="email@example.com"
              error={errors.email?.message}
              {...register('email')}
              autoFocus
            />
          </EditableField>

          {/* Date of Birth */}
          <EditableField
            label="Дата народження"
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
            label="Симптоми / побажання"
            value={
              <span className="whitespace-pre-wrap break-words">
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
              placeholder="Коротко опишіть ваш запит"
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
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Нагадування
          </label>
          <Select
            id="reminderPreference"
            fullWidth
            {...register('reminderPreference')}
          >
            <option value="email">По email</option>
            <option value="sms">По SMS</option>
            <option value="both">По email та SMS</option>
            <option value="none">Не надсилати нагадування</option>
          </Select>
        </div>

        <div className="flex items-start">
          <input
            id="consent"
            type="checkbox"
            className="mt-1"
            {...register('consent')}
          />
          <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
            Я даю згоду на обробку персональних даних *
          </label>
        </div>
      </div>
    </>
  )
}
