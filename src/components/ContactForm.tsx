import { useState } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { useForm } from '@/hooks/useForm'
import { validators } from '@/utils/validation'
import { createAppointment } from '@/services'
import { getErrorMessage } from '@/services/api'
import type { AppointmentFormData } from '@/types'

const initialValues: AppointmentFormData = {
  name: '',
  phone: '',
  email: '',
  service: '',
  message: '',
}

interface ContactFormProps {
  onSuccess?: () => void
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateForm = (
    values: AppointmentFormData
  ): Partial<Record<keyof AppointmentFormData, string>> => {
    const errors: Partial<Record<keyof AppointmentFormData, string>> = {}

    // Name validation
    const nameError =
      validators.required(values.name, "Ім'я та прізвище") ||
      validators.fullName(values.name)
    if (nameError) errors.name = nameError

    // Phone validation
    const phoneError =
      validators.required(values.phone, 'Номер телефону') ||
      validators.phone(values.phone)
    if (phoneError) errors.phone = phoneError

    // Email validation (optional but must be valid if provided)
    if (values.email) {
      const emailError = validators.email(values.email)
      if (emailError) errors.email = emailError
    }

    return errors
  }

  const handleSubmit = async (values: AppointmentFormData) => {
    setSubmitError(null)

    try {
      const response = await createAppointment(values)

      if (response.success) {
        // Success! Reset form and show success message
        resetForm()
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setSubmitError(errorMessage)
      console.error('Appointment submission error:', error)
    }
  }

  const {
    values,
    errors,
    isSubmitting,
    isSubmitted,
    handleChange,
    handleSubmit: onSubmit,
    resetForm,
  } = useForm({
    initialValues,
    onSubmit: handleSubmit,
    validate: validateForm,
  })

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Записатися на прийом
      </h2>

      {isSubmitted && !submitError && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900 mb-1">
              Заявку успішно надіслано!
            </h4>
            <p className="text-sm text-green-700">
              Дякуємо за звернення. Ми зв'яжемося з вами протягом 30 хвилин для
              підтвердження запису.
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Помилка</h4>
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Input
          label="Ім'я та прізвище"
          name="name"
          type="text"
          required
          fullWidth
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Введіть ваше ім'я та прізвище"
          disabled={isSubmitting}
        />

        <Input
          label="Номер телефону"
          name="phone"
          type="tel"
          required
          fullWidth
          value={values.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="+380 XX XXX XX XX"
          disabled={isSubmitting}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          fullWidth
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="example@email.com"
          helperText="Необов'язкове поле"
          disabled={isSubmitting}
        />

        <Select
          label="Послуга"
          name="service"
          fullWidth
          value={values.service}
          onChange={handleChange}
          error={errors.service}
          disabled={isSubmitting}
        >
          <option value="">Оберіть послугу</option>
          <option value="consultation">Консультація</option>
          <option value="treatment">Лікування зубів</option>
          <option value="cleaning">Професійна гігієна</option>
          <option value="implants">Імплантація</option>
          <option value="orthodontics">Ортодонтія</option>
          <option value="prosthetics">Протезування</option>
          <option value="whitening">Відбілювання</option>
          <option value="surgery">Хірургія</option>
        </Select>

        <Textarea
          label="Повідомлення"
          name="message"
          rows={4}
          fullWidth
          value={values.message}
          onChange={handleChange}
          error={errors.message}
          placeholder="Опишіть ваші побажання або питання"
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting || isSubmitted}
        >
          {!isSubmitting && <Send className="h-5 w-5 mr-2" />}
          {isSubmitted ? 'Заявку надіслано' : 'Надіслати заявку'}
        </Button>

        <p className="text-sm text-gray-500 text-center">
          * Обов'язкові поля. Ми зв'яжемося з вами протягом 30 хвилин.
        </p>
      </form>
    </div>
  )
}
