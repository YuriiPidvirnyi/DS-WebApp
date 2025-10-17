import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, SERVICES, DOCTORS, TIME_SLOTS } from '@/utils/validationSchemas'
import type { z } from 'zod'
import { Input, Textarea, Select, Button, LoadingOverlay } from '@/components/ui'
import { getAvailableSlots, createAppointment } from '@/services/appointments'
import { withToast } from '@/utils/toast'

type BookingFormValues = z.infer<typeof appointmentSchema>

export default function BookingForm() {
  const [slots, setSlots] = useState<string[]>(TIME_SLOTS as unknown as string[])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      service: SERVICES[0],
      date: '',
      time: '',
      doctor: 'any',
      isFirstVisit: false,
      consent: false,
      reminderPreference: 'email',
      marketingConsent: false,
    },
  })

  const selectedDate = watch('date')
  const selectedDoctor = watch('doctor')

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    getAvailableSlots(selectedDate, selectedDoctor === 'any' ? undefined : selectedDoctor)
      .then((res) => {
        if (res.success && res.data) setSlots(res.data)
      })
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, selectedDoctor])

  const onSubmit = async (data: BookingFormValues) => {
    await withToast(
      async () => {
        const res = await createAppointment({
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          email: data.email,
          service: data.service,
          message: data.symptoms || '',
          preferredDate: data.date,
          preferredTime: data.time,
        } as any)
        if (!res.success) throw new Error('Не вдалося створити запис')
        return res
      },
      { formType: 'appointment' }
    )
    reset()
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 relative">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Запис на прийом</h2>

      {isSubmitSuccessful && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">Заявку успішно надіслано! Ми підтвердимо час прийому найближчим часом.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я *</label>
            <Input fullWidth placeholder="Ім'я" error={errors.firstName?.message} {...register('firstName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище *</label>
            <Input fullWidth placeholder="Прізвище" error={errors.lastName?.message} {...register('lastName')} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
            <Input type="tel" fullWidth placeholder="+380 XX XXX XX XX" error={errors.phone?.message} {...register('phone')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input type="email" fullWidth placeholder="email@example.com" error={errors.email?.message} {...register('email')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата народження *</label>
            <Input type="date" fullWidth error={errors.dateOfBirth?.message as any} {...register('dateOfBirth')} />
          </div>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Послуга *</label>
            <Select fullWidth error={errors.service?.message} {...register('service')}>
              <option value="">Оберіть послугу</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
            <Input type="date" fullWidth error={errors.date?.message} {...register('date')} />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Час *</label>
            <Select fullWidth error={errors.time?.message} {...register('time')}>
              <option value="">Оберіть час</option>
              {slots.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <LoadingOverlay show={loadingSlots} message="Завантажуємо вільні години..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Лікар</label>
            <Select fullWidth {...register('doctor')}>
              {DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-6 md:mt-8">
            <input type="checkbox" id="isFirstVisit" {...register('isFirstVisit')} />
            <label htmlFor="isFirstVisit" className="text-sm text-gray-700">Перший візит</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Симптоми / побажання</label>
          <Textarea rows={4} fullWidth placeholder="Коротко опишіть ваш запит" error={errors.symptoms?.message as any} {...register('symptoms')} />
        </div>

        <div className="flex items-start">
          <input id="consent" type="checkbox" className="mt-1" {...register('consent')} />
          <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
            Я даю згоду на обробку моїх персональних даних *
          </label>
        </div>
        {errors.consent && (
          <p className="text-sm text-red-600">{errors.consent.message}</p>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Записатися
        </Button>
      </form>
    </div>
  )
}
