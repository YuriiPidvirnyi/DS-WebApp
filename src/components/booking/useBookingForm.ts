'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm, type Resolver, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  appointmentSchema,
  SERVICES,
  DOCTORS,
  TIME_SLOTS,
} from '@/utils/validationSchemas'
import type { z } from 'zod'
import type { TurnstileRef } from '@/components/Turnstile'
import { assertValidTurnstile } from '@/utils/turnstileVerify'
import { useSubmissionCooldown } from '@/hooks/useSubmissionCooldown'
import { getAvailableSlots, createAppointment } from '@/services/appointments'
import { storeLocalReminder } from '@/services/reminders'
import { sendBookingConfirmation } from '@/services/notifications'
import { sanitizeUserInput } from '@/utils/security'
import { withToast } from '@/utils/toast'
import {
  BookingEvent,
  FormEvent,
  AnalyticsEventCategory,
  trackEvent,
} from '@/utils/analytics'
import { useRouter } from 'next/navigation'

export type BookingFormValues = z.infer<typeof appointmentSchema>

/** Fields validated per step for the multi-step wizard */
const FIELDS_BY_STEP = [
  ['service', 'date', 'time', 'doctor'],
  ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'],
  [],
] as const

export { SERVICES, DOCTORS, TIME_SLOTS }

/**
 * Custom hook that encapsulates all BookingForm logic:
 * - react-hook-form setup with Zod validation
 * - Draft autosave to localStorage
 * - Available time slots fetching
 * - Multi-step wizard navigation
 * - Submission with Turnstile verification, cooldown, analytics
 * - Inline editing state for summary step
 */
export function useBookingForm() {
  // --- Available time slots ---
  const [slots, setSlots] = useState<string[]>(
    TIME_SLOTS as unknown as string[]
  )
  const [loadingSlots, setLoadingSlots] = useState(false)

  // --- Turnstile ---
  const turnstileRef = useRef<TurnstileRef>(null)

  // --- Submission cooldown ---
  const {
    isCoolingDown,
    remainingSec,
    start: startCooldown,
  } = useSubmissionCooldown('booking_form', 60)

  const router = useRouter()

  // --- React Hook Form ---
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(appointmentSchema) as Resolver<BookingFormValues>,
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

  const { watch, reset, trigger } = form
  const selectedDate = watch('date')
  const selectedDoctor = watch('doctor')

  // --- Draft autosave ---
  useEffect(() => {
    const sub = watch(val => {
      try {
        localStorage.setItem('booking_draft', JSON.stringify(val))
      } catch {
        // localStorage may be unavailable
      }
    })
    // Restore draft once on mount
    try {
      const saved = localStorage.getItem('booking_draft')
      if (saved) {
        const parsed = JSON.parse(saved)
        reset({ ...parsed })
      }
    } catch {
      // Ignore parse errors
    }
    return () => sub.unsubscribe()
  }, [watch, reset])

  // --- Fetch available slots when date/doctor changes ---
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    getAvailableSlots(
      selectedDate,
      selectedDoctor === 'any' ? undefined : selectedDoctor
    )
      .then(res => {
        if (res.success && res.data) setSlots(res.data)
      })
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, selectedDoctor])

  // --- Multi-step wizard ---
  const [step, setStep] = useState(0)

  const next = async () => {
    const ok = await trigger(
      FIELDS_BY_STEP[step] as unknown as FieldPath<BookingFormValues>[],
      { shouldFocus: true }
    )
    if (ok) {
      setStep(s => {
        const nextStep = Math.min(2, s + 1)
        try {
          trackEvent(FormEvent.FormStep, AnalyticsEventCategory.Forms, {
            form: 'booking',
            step: nextStep,
          })
        } catch {
          // Analytics may fail silently
        }
        return nextStep
      })
    }
  }

  const back = () => {
    setStep(s => {
      const prev = Math.max(0, s - 1)
      try {
        trackEvent(FormEvent.FormStep, AnalyticsEventCategory.Forms, {
          form: 'booking',
          step: prev,
        })
      } catch {
        // Analytics may fail silently
      }
      return prev
    })
  }

  // --- Inline editing for summary step ---
  type EditableFieldKey = keyof BookingFormValues
  const [editingField, setEditingField] = useState<EditableFieldKey | null>(
    null
  )

  const startEditing = (field: EditableFieldKey) => setEditingField(field)
  const cancelEditing = () => setEditingField(null)
  const saveEditing = async () => {
    if (!editingField) return
    const ok = await trigger(editingField, { shouldFocus: true })
    if (ok) setEditingField(null)
  }

  // --- Form submission ---
  const onSubmit = async (data: BookingFormValues) => {
    if (isCoolingDown) {
      return withToast.error(
        `Занадто часті відправлення. Спробуйте через ${remainingSec} с.`
      )
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

    // Sanitize user input before submission
    const sanitizedName = `${sanitizeUserInput(data.firstName)} ${sanitizeUserInput(data.lastName)}`
    const sanitizedPhone = sanitizeUserInput(data.phone)
    const sanitizedEmail = sanitizeUserInput(data.email)
    const sanitizedMessage = sanitizeUserInput(data.symptoms || '')

    const response = await withToast(
      async () => {
        const res = await createAppointment({
          name: sanitizedName,
          phone: sanitizedPhone,
          email: sanitizedEmail,
          service: data.service,
          message: sanitizedMessage,
          preferredDate: data.date,
          preferredTime: data.time,
        })
        if (!res.success || !res.data)
          throw new Error('Не вдалося створити запис')
        // Send confirmation (fire-and-forget)
        void sendBookingConfirmation({
          appointmentId: res.data.id,
          email: data.email,
        })
        // Track booking complete
        try {
          if (window.gtag) {
            window.gtag('event', BookingEvent.BookingComplete, {
              appointment_id: res.data.id,
              service: data.service,
            })
          }
        } catch {
          // Analytics may fail silently
        }
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
      created: new Date().toISOString(),
    }

    try {
      localStorage.setItem('last_booking', JSON.stringify(bookingDetails))

      // Set up automatic reminders based on user preference
      if (data.reminderPreference !== 'none') {
        storeLocalReminder(appointmentId, data.date, data.time)
      }
    } catch {
      // localStorage may be unavailable
    }

    // Start cooldown and clear draft
    startCooldown(60)
    reset()

    // Navigate to success page
    router.push(`/booking/success?ref=${encodeURIComponent(appointmentId)}`)
  }

  return {
    form,
    step,
    next,
    back,
    slots,
    loadingSlots,
    turnstileRef,
    isCoolingDown,
    remainingSec,
    editingField,
    startEditing,
    cancelEditing,
    saveEditing,
    onSubmit,
  }
}
