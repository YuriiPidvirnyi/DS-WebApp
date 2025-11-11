import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { createPatient } from '@/services/patientManagement'
import { withToast } from '@/utils/toast'

const patientSchema = z.object({
  // Basic Info
  firstName: z.string().min(2, 'Мінімум 2 символи'),
  lastName: z.string().min(2, 'Мінімум 2 символи'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Оберіть дату'),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),

  // Contact
  phone: z.string().regex(/^\+380\d{9}$/, 'Формат: +380XXXXXXXXX'),
  email: z.string().email('Невірний email').optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().default('Київ'),

  // Medical History
  allergies: z.string().optional(),
  medications: z.string().optional(),
  conditions: z.string().optional(),

  // Insurance
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),

  // Emergency Contact
  emergencyName: z.string().min(2, 'Мінімум 2 символи'),
  emergencyPhone: z.string().regex(/^\+380\d{9}$/),
  emergencyRelation: z.string().min(2),

  // Consents
  hipaaConsent: z.boolean().refine(val => val === true, "Обов'язкова згода"),
  marketingConsent: z.boolean().default(false),
})

type PatientFormData = z.infer<typeof patientSchema>

export default function PatientRegistrationForm({
  onSuccess,
}: {
  onSuccess?: (id: string) => void
}) {
  const [step, setStep] = useState(1)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm({
    resolver: zodResolver(patientSchema),
  })

  const onSubmit = async (data: PatientFormData) => {
    const patientData = {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: {
        street: data.street || '',
        city: data.city,
        state: 'Київська',
        zipCode: '',
        country: 'Україна',
      },
      medicalHistory: {
        allergies: data.allergies?.split(',').map(s => s.trim()) || [],
        medications: data.medications?.split(',').map(s => s.trim()) || [],
        conditions: data.conditions?.split(',').map(s => s.trim()) || [],
        previousSurgeries: [],
        lastUpdated: new Date(),
      },
      dentalHistory: {
        majorTreatments: [],
        currentComplaints: [],
        oralHygiene: 'fair' as const,
      },
      primaryInsurance: data.insuranceProvider
        ? {
            id: crypto.randomUUID(),
            provider: data.insuranceProvider,
            policyNumber: data.policyNumber || '',
            isPrimary: true,
          }
        : undefined,
      emergencyContacts: [
        {
          id: crypto.randomUUID(),
          name: data.emergencyName,
          phone: data.emergencyPhone,
          relationship: data.emergencyRelation,
          isPrimary: true,
        },
      ],
      consents: [
        {
          id: crypto.randomUUID(),
          type: 'hipaa' as const,
          signedDate: new Date(),
          signature: `${data.firstName} ${data.lastName}`,
        },
      ],
      tags: [],
      communicationPreferences: {
        preferredChannel: 'email' as const,
        appointmentReminders: true,
        marketingEmails: data.marketingConsent,
        treatmentFollowUps: true,
        birthdayGreetings: true,
        language: 'uk' as const,
      },
      portalEnabled: true,
      status: 'active' as const,
      registrationDate: new Date(),
      outstandingBalance: 0,
      lifetimeValue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await withToast(async () => {
      const result = await createPatient(patientData)
      if (result.success && result.data) {
        onSuccess?.(result.data.id)
      }
    }, {})
  }

  const nextStep = async () => {
    const fieldsPerStep: Array<Array<keyof PatientFormData>> = [
      ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'email'],
      ['street', 'city', 'allergies', 'medications', 'conditions'],
      ['emergencyName', 'emergencyPhone', 'emergencyRelation', 'hipaaConsent'],
    ]
    const ok = await trigger(fieldsPerStep[step - 1])
    if (ok) setStep(s => Math.min(3, s + 1))
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Реєстрація пацієнта</h2>

      {/* Progress */}
      <div className="flex mb-8 gap-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${i <= step ? 'bg-dental-teal' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Основна інформація</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ім'я *"
                {...register('firstName')}
                error={errors.firstName?.message}
              />
              <Input
                label="Прізвище *"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>
            <Input label="По батькові" {...register('middleName')} />
            <Input
              label="Дата народження *"
              type="date"
              {...register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
            />
            <Select
              label="Стать *"
              {...register('gender')}
              error={errors.gender?.message}
            >
              <option value="">Оберіть</option>
              <option value="male">Чоловіча</option>
              <option value="female">Жіноча</option>
              <option value="other">Інша</option>
              <option value="prefer-not-to-say">Не хочу вказувати</option>
            </Select>
            <Input
              label="Телефон *"
              type="tel"
              placeholder="+380XXXXXXXXX"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
        )}

        {/* Step 2: Medical History */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Медична інформація</h3>
            <Input label="Адреса" {...register('street')} />
            <Input label="Місто" {...register('city')} defaultValue="Київ" />
            <Textarea
              label="Алергії (через кому)"
              {...register('allergies')}
              placeholder="Пеніцилін, латекс..."
            />
            <Textarea
              label="Поточні ліки (через кому)"
              {...register('medications')}
              placeholder="Аспірин, Інсулін..."
            />
            <Textarea
              label="Хронічні захворювання (через кому)"
              {...register('conditions')}
              placeholder="Діабет, Гіпертонія..."
            />
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-medium mb-2">Страхування (необов'язково)</h4>
              <Input
                label="Страхова компанія"
                {...register('insuranceProvider')}
              />
              <Input label="Номер поліса" {...register('policyNumber')} />
            </div>
          </div>
        )}

        {/* Step 3: Emergency & Consent */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Екстрений контакт</h3>
            <Input
              label="ПІБ екстреного контакту *"
              {...register('emergencyName')}
              error={errors.emergencyName?.message}
            />
            <Input
              label="Телефон *"
              type="tel"
              {...register('emergencyPhone')}
              error={errors.emergencyPhone?.message}
            />
            <Input
              label="Відношення *"
              {...register('emergencyRelation')}
              placeholder="Дружина, Син..."
              error={errors.emergencyRelation?.message}
            />

            <div className="border-t pt-4 space-y-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...register('hipaaConsent')}
                  className="mt-1"
                />
                <span className="text-sm">
                  Я даю згоду на обробку персональних даних відповідно до
                  законів України *
                </span>
              </label>
              {errors.hipaaConsent && (
                <p className="text-red-600 text-sm">
                  {errors.hipaaConsent.message}
                </p>
              )}

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...register('marketingConsent')}
                  className="mt-1"
                />
                <span className="text-sm">
                  Хочу отримувати інформацію про акції та новини клініки
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(s => s - 1)}
            >
              Назад
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={nextStep} className="ml-auto">
              Далі
            </Button>
          ) : (
            <Button type="submit" isLoading={isSubmitting} className="ml-auto">
              Завершити реєстрацію
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
