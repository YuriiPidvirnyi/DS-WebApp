import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, SERVICES, DOCTORS, TIME_SLOTS } from '@/utils/validationSchemas'
import type { z } from 'zod'
import { Input, Textarea, Select, Button, LoadingOverlay } from '@/components/ui'
import { PenSquare, Check, X } from 'lucide-react'
import Turnstile, { TurnstileRef } from '@/components/Turnstile'
import { assertValidTurnstile } from '@/utils/turnstileVerify'
import { useSubmissionCooldown } from '@/hooks/useSubmissionCooldown'
import { getAvailableSlots, createAppointment } from '@/services/appointments'
import { storeLocalReminder } from '@/services/reminders'
import { sendBookingConfirmation } from '@/services/notifications'
import { withToast } from '@/utils/toast'
import { BookingEvent } from '@/utils/analytics'
import { useNavigate } from 'react-router-dom'

type BookingFormValues = z.infer<typeof appointmentSchema>

export default function BookingForm() {
  const [slots, setSlots] = useState<string[]>(TIME_SLOTS as unknown as string[])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const turnstileRef = useRef<TurnstileRef>(null)
  const { isCoolingDown, remainingSec, start: startCooldown } = useSubmissionCooldown('booking_form', 60)

  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
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

  // Draft autosave
  useEffect(() => {
    const sub = watch((val) => {
      try { localStorage.setItem('booking_draft', JSON.stringify(val)) } catch {}
    })
    // Restore once
    try {
      const saved = localStorage.getItem('booking_draft')
      if (saved) {
        const parsed = JSON.parse(saved)
        reset({ ...parsed })
      }
    } catch {}
    return () => sub.unsubscribe()
  }, [watch, reset])

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
    // Cooldown check to prevent spam
    if (isCoolingDown) {
      return withToast.error(`Занадто часті відправлення. Спробуйте через ${remainingSec} с.`)
    }

    // Verify Turnstile token
    try {
      const token = turnstileRef.current?.getToken() || ''
      await assertValidTurnstile(token)
    } catch (error) {
      if (error instanceof Error) {
        return withToast.error(error.message)
      }
      return withToast.error('Перевірка безпеки не пройдена. Спробуйте ще раз.')
    }
    
    const response = await withToast(
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
        if (!res.success || !res.data) throw new Error('Не вдалося створити запис')
        // Send confirmation (mock)
        void sendBookingConfirmation({ appointmentId: res.data.id, email: data.email })
        // Track booking complete
        try { window.gtag && window.gtag('event', BookingEvent.BookingComplete, { appointment_id: res.data.id, service: data.service }) } catch {}
        return res
      },
      { formType: 'appointment' }
    )
    
    // Store appointment details for reference
    const appointmentId = response?.data?.id || `temp-${Date.now().toString()}`
    const bookingDetails = {
      id: appointmentId,
      service: data.service,
      date: data.date,
      time: data.time,
      name: `${data.firstName} ${data.lastName}`,
      created: new Date().toISOString()
    }
    
    try { 
      // Store booking details for reference
      localStorage.setItem('last_booking', JSON.stringify(bookingDetails))
      
      // Set up automatic reminders based on user preference
      if (data.reminderPreference !== 'none') {
        storeLocalReminder(appointmentId, data.date, data.time)
      }
    } catch {}
    
    // Start cooldown and clear form data after successful submission
    startCooldown(60)
    reset()
    
    // Navigate to success page with reference
    navigate(`/booking/success?ref=${encodeURIComponent(appointmentId)}`)
  }

  // Simple 3-step UI
  const [step, setStep] = useState(0)
  const next = async () => {
    const fieldsByStep = [
      ['service','date','time','doctor'],
      ['firstName','lastName','email','phone','dateOfBirth'],
      [],
    ] as const
    const ok = await trigger(fieldsByStep[step] as any, { shouldFocus: true })
    if (ok) setStep((s) => Math.min(2, s + 1))
  }
  const back = () => setStep((s) => Math.max(0, s - 1))
  
  // In-place edit for summary
  type EditableField = keyof BookingFormValues
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  
  const startEditing = (field: EditableField) => {
    setEditingField(field)
  }
  
  const cancelEditing = () => {
    setEditingField(null)
  }
  
  const saveEditing = async () => {
    if (!editingField) return
    const ok = await trigger(editingField as any, { shouldFocus: true })
    if (ok) setEditingField(null)
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
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-2">
          {[0,1,2].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${i<=step?'bg-dental-teal':'bg-gray-200'}`} />
          ))}
        </div>

        {/* Step 1: Appointment Details */}
        {step===0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        )}

        {/* Step 2: Personal Info */}
        {step===1 && (
          <>
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
          </>
        )}

        {/* Step 3: Extra */}
        {step===2 && (
          <>
            {/* Summary before confirm */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Перевірте дані перед підтвердженням
                <span className="ml-2 text-xs text-gray-500 font-normal">(натисніть на поле для редагування)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {/* Service */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Послуга</span>
                    {editingField !== 'service' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('service')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'service' ? (
                    <div className="mt-1">
                      <Select 
                        fullWidth 
                        error={errors.service?.message} 
                        {...register('service')} 
                        autoFocus
                      >
                        <option value="">Оберіть послугу</option>
                        {SERVICES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">{watch('service') || '—'}</div>
                  )}
                </div>
                
                {/* Date */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Дата</span>
                    {editingField !== 'date' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('date')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'date' ? (
                    <div className="mt-1">
                      <Input 
                        type="date" 
                        fullWidth 
                        error={errors.date?.message} 
                        {...register('date')} 
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">{watch('date') || '—'}</div>
                  )}
                </div>
                
                {/* Time */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Час</span>
                    {editingField !== 'time' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('time')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'time' ? (
                    <div className="mt-1 relative">
                      <Select 
                        fullWidth 
                        error={errors.time?.message} 
                        {...register('time')} 
                        autoFocus
                      >
                        <option value="">Оберіть час</option>
                        {slots.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </Select>
                      <LoadingOverlay show={loadingSlots} message="Завантажуємо вільні години..." />
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">{watch('time') || '—'}</div>
                  )}
                </div>
                
                {/* Doctor */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Лікар</span>
                    {editingField !== 'doctor' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('doctor')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'doctor' ? (
                    <div className="mt-1">
                      <Select 
                        fullWidth 
                        error={errors.doctor?.message} 
                        {...register('doctor')} 
                        autoFocus
                      >
                        {DOCTORS.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </Select>
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {watch('doctor') === 'any' ? 'Будь-який' : DOCTORS.find(d => d.id === watch('doctor'))?.name || '—'}
                    </div>
                  )}
                </div>
                
                {/* Name */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Ім'я</span>
                    {editingField !== 'firstName' && editingField !== 'lastName' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('firstName')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'firstName' || editingField === 'lastName' ? (
                    <div className="mt-1">
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
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">{watch('firstName')} {watch('lastName')}</div>
                  )}
                </div>
                
                {/* Phone */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Телефон</span>
                    {editingField !== 'phone' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('phone')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'phone' ? (
                    <div className="mt-1">
                      <Input 
                        type="tel" 
                        fullWidth 
                        placeholder="+380 XX XXX XX XX" 
                        error={errors.phone?.message} 
                        {...register('phone')} 
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">{watch('phone')}</div>
                  )}
                </div>
                
                {/* Email */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Email</span>
                    {editingField !== 'email' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('email')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'email' ? (
                    <div className="mt-1">
                      <Input 
                        type="email" 
                        fullWidth 
                        placeholder="email@example.com" 
                        error={errors.email?.message} 
                        {...register('email')} 
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">{watch('email')}</div>
                  )}
                </div>
                
                {/* Date of Birth */}
                <div className="relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Дата народження</span>
                    {editingField !== 'dateOfBirth' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('dateOfBirth')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'dateOfBirth' ? (
                    <div className="mt-1">
                      <Input 
                        type="date" 
                        fullWidth 
                        error={errors.dateOfBirth?.message as any} 
                        {...register('dateOfBirth')} 
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">{watch('dateOfBirth')}</div>
                  )}
                </div>
                
                {/* Symptoms / Notes */}
                <div className="md:col-span-2 relative">
                  <div className="text-gray-500 flex justify-between">
                    <span>Симптоми / побажання</span>
                    {editingField !== 'symptoms' && (
                      <button 
                        type="button" 
                        onClick={() => startEditing('symptoms')}
                        className="text-gray-400 hover:text-dental-teal"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'symptoms' ? (
                    <div className="mt-1">
                      <Textarea 
                        rows={4} 
                        fullWidth 
                        placeholder="Коротко опишіть ваш запит" 
                        error={errors.symptoms?.message as any} 
                        {...register('symptoms')} 
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={cancelEditing} className="p-1 text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={saveEditing} className="p-1 text-dental-teal hover:text-dental-teal-dark">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900 whitespace-pre-wrap break-words">{watch('symptoms') || '—'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Extra input before submit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Симптоми / побажання</label>
              <Textarea rows={4} fullWidth placeholder="Коротко опишіть ваш запит" error={errors.symptoms?.message as any} {...register('symptoms')} />
            </div>
            <div className="space-y-4">
              {/* Reminder preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Нагадування</label>
                <Select fullWidth {...register('reminderPreference')}>
                  <option value="email">По email</option>
                  <option value="sms">По SMS</option>
                  <option value="both">По email та SMS</option>
                  <option value="none">Не надсилати нагадування</option>
                </Select>
              </div>

              <div className="flex items-start">
                <input id="consent" type="checkbox" className="mt-1" {...register('consent')} />
                <label htmlFor="consent" className="ml-2 text-sm text-gray-700">Я даю згоду на обробку персональних даних *</label>
              </div>
              <Turnstile ref={turnstileRef} className="mt-2" />
            </div>
          </>
        )}

        {step===0 && (
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
        )}

        {errors.consent && (
          <p className="text-sm text-red-600">{errors.consent.message}</p>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between gap-3">
          {step>0 ? (
            <Button type="button" onClick={back} disabled={isSubmitting}>Назад</Button>
          ) : <span />}
          {step<2 ? (
            <Button type="button" onClick={next} disabled={isSubmitting}>Далі</Button>
          ) : (
            <Button type="submit" size="lg" disabled={isSubmitting || isCoolingDown} isLoading={isSubmitting}>
              {isCoolingDown ? `Зачекайте ${remainingSec} с` : 'Записатися'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
