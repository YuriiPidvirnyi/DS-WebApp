'use client'

import { Button, LoadingOverlay } from '@/components/ui'
import Turnstile from '@/components/Turnstile'
import {
  BookingStepService,
  BookingStepPersonal,
  BookingSummary,
  useBookingForm,
} from '@/components/booking'
import { useCSRF } from '@/hooks/useCSRF'

/**
 * Multi-step booking form (3 steps):
 *   1. Appointment details (service, date, time, doctor)
 *   2. Personal information (name, phone, email, date of birth)
 *   3. Summary + confirmation (editable, consent, Turnstile)
 *
 * All logic is encapsulated in the `useBookingForm` hook.
 * Each step is rendered by a dedicated step component.
 */
export default function BookingForm() {
  const { token: csrfToken } = useCSRF()
  const {
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
  } = useBookingForm()

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 relative">
      <h2 className="text-2xl font-bold text-dental-dark mb-6">Запис на прийом</h2>

      {isSubmitSuccessful && (
        <div className="mb-6 p-4 bg-dental-primary/10 border border-dental-primary/30 rounded-lg">
          <p className="text-dental-primary-darker">
            Заявку успішно надіслано! Ми підтвердимо час прийому найближчим
            часом.
          </p>
        </div>
      )}

      {/* Screen reader error announcer */}
      <div aria-live="polite" role="status" className="sr-only">
        {errors?.service?.message ||
          errors?.date?.message ||
          errors?.time?.message ||
          errors?.firstName?.message ||
          errors?.lastName?.message ||
          errors?.email?.message ||
          errors?.phone?.message ||
          errors?.dateOfBirth?.message ||
          errors?.consent?.message}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* CSRF Token - hidden input for form protection */}
        <input type="hidden" name="_csrf" value={csrfToken} />
        
        {/* Progress stepper */}
        <div className="flex items-center gap-2 mb-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-dental-primary' : 'bg-dental-secondary/50'}`}
            />
          ))}
        </div>

        {/* Step 1: Appointment details */}
        {step === 0 && (
          <BookingStepService
            form={form}
            slots={slots}
            loadingSlots={loadingSlots}
          />
        )}

        {/* Step 2: Personal information */}
        {step === 1 && <BookingStepPersonal form={form} />}

        {/* Step 3: Summary + confirmation */}
        {step === 2 && (
          <>
            <BookingSummary
              form={form}
              slots={slots}
              loadingSlots={loadingSlots}
              editingField={editingField}
              onStartEdit={startEditing}
              onSave={saveEditing}
              onCancel={cancelEditing}
            />
            {errors.consent && (
              <p className="text-sm text-red-600">{errors.consent.message}</p>
            )}
            <Turnstile ref={turnstileRef} className="mt-2" />
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between gap-3">
          {step > 0 ? (
            <Button type="button" onClick={back} disabled={isSubmitting}>
              Назад
            </Button>
          ) : (
            <span />
          )}

          {step < 2 ? (
            <Button type="button" onClick={next} disabled={isSubmitting}>
              Далі
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || isCoolingDown}
              isLoading={isSubmitting}
            >
              {isCoolingDown ? `Зачекайте ${remainingSec} с` : 'Записатися'}
            </Button>
          )}
        </div>
      </form>

      {isSubmitting && <LoadingOverlay show message="Надсилаємо заявку..." />}
    </div>
  )
}
