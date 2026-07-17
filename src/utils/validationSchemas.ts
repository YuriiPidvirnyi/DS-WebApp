import { z } from 'zod'

// Common validation helpers
const phoneRegex = /^\+?380\d{9}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Ім'я повинно містити принаймні 2 символи")
    .max(50, "Ім'я не може містити більше 50 символів")
    .regex(/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/, "Ім'я може містити лише літери"),

  email: z
    .string()
    .min(1, "Email обов'язковий")
    .email('Невірний формат email')
    .regex(emailRegex, 'Невірний формат email'),

  phone: z
    .string()
    .min(1, "Телефон обов'язковий")
    .regex(phoneRegex, 'Невірний формат телефону (приклад: +380501234567)'),

  message: z
    .string()
    .min(10, 'Повідомлення повинно містити принаймні 10 символів')
    .max(1000, 'Повідомлення не може містити більше 1000 символів'),

  consent: z
    .boolean()
    .refine(
      val => val === true,
      'Потрібна згода на обробку персональних даних'
    ),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// Appointment Booking Schema
export const appointmentSchema = z.object({
  // Personal Information
  firstName: z
    .string()
    .min(2, "Ім'я повинно містити принаймні 2 символи")
    .max(30, "Ім'я не може містити більше 30 символів")
    .regex(/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/, "Ім'я може містити лише літери"),

  lastName: z
    .string()
    .min(2, 'Прізвище повинно містити принаймні 2 символи')
    .max(30, 'Прізвище не може містити більше 30 символів')
    .regex(/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/, 'Прізвище може містити лише літери'),

  email: z
    .string()
    .min(1, "Email обов'язковий")
    .email('Невірний формат email')
    .regex(emailRegex, 'Невірний формат email'),

  phone: z
    .string()
    .min(1, "Телефон обов'язковий")
    .regex(phoneRegex, 'Невірний формат телефону (приклад: +380501234567)'),

  dateOfBirth: z
    .string()
    .min(1, "Дата народження обов'язкова")
    .refine(date => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 120
    }, 'Невірна дата народження'),

  // Appointment Details
  service: z.string().min(1, 'Виберіть послугу'),

  date: z
    .string()
    .min(1, 'Виберіть дату')
    .refine(date => {
      const appointmentDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return appointmentDate >= today
    }, 'Дата не може бути в минулому'),

  time: z
    .string()
    .min(1, 'Виберіть час')
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Невірний формат часу'),

  doctor: z.string().optional(),

  // Additional Information
  isFirstVisit: z.boolean().default(false),

  symptoms: z
    .string()
    .max(500, 'Опис симптомів не може містити більше 500 символів')
    .optional(),

  medicalHistory: z
    .string()
    .max(500, 'Медична історія не може містити більше 500 символів')
    .optional(),

  allergies: z
    .string()
    .max(200, 'Алергії не можуть містити більше 200 символів')
    .optional(),

  medications: z
    .string()
    .max(300, 'Медикаменти не можуть містити більше 300 символів')
    .optional(),

  // Consent and Preferences
  consent: z
    .boolean()
    .refine(
      val => val === true,
      'Потрібна згода на обробку персональних даних'
    ),

  marketingConsent: z.boolean().default(false),

  reminderPreference: z.enum(['email', 'sms', 'both', 'none']).default('email'),

  notes: z
    .string()
    .max(300, 'Примітки не можуть містити більше 300 символів')
    .optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

// Callback Request Schema (for quick consultation requests)
export const callbackSchema = z.object({
  name: z
    .string()
    .min(2, "Ім'я повинно містити принаймні 2 символи")
    .max(50, "Ім'я не може містити більше 50 символів")
    .regex(/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/, "Ім'я може містити лише літери"),

  phone: z
    .string()
    .min(1, "Телефон обов'язковий")
    .regex(phoneRegex, 'Невірний формат телефону (приклад: +380501234567)'),

  preferredTime: z
    .enum(['morning', 'afternoon', 'evening', 'any'])
    .default('any'),

  service: z.string().optional(),

  consent: z
    .boolean()
    .refine(
      val => val === true,
      'Потрібна згода на обробку персональних даних'
    ),
})

export type CallbackFormData = z.infer<typeof callbackSchema>

// Newsletter Subscription Schema
export const newsletterSchema = z.object({
  email: z
    .string()
    .min(1, "Email обов'язковий")
    .email('Невірний формат email')
    .regex(emailRegex, 'Невірний формат email'),

  consent: z
    .boolean()
    .refine(
      val => val === true,
      'Потрібна згода на обробку персональних даних'
    ),
})

export type NewsletterFormData = z.infer<typeof newsletterSchema>

// Micro Feedback Schema
export const feedbackCommentSchema = z.object({
  comment: z
    .string()
    .min(5, 'Коментар повинен містити принаймні 5 символів')
    .max(300, 'Коментар не може містити більше 300 символів'),
})

export type FeedbackCommentData = z.infer<typeof feedbackCommentSchema>

// Review/Feedback Schema
export const reviewSchema = z.object({
  name: z
    .string()
    .min(2, "Ім'я повинно містити принаймні 2 символи")
    .max(50, "Ім'я не може містити більше 50 символів")
    .regex(/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/, "Ім'я може містити лише літери"),

  email: z.string().email('Невірний формат email').optional().or(z.literal('')),

  rating: z
    .number()
    .min(1, "Оцінка обов'язкова")
    .max(5, 'Максимальна оцінка - 5'),

  service: z.string().min(1, 'Виберіть послугу'),

  doctor: z.string().optional(),

  comment: z
    .string()
    .min(10, 'Відгук повинен містити принаймні 10 символів')
    .max(1000, 'Відгук не може містити більше 1000 символів'),

  visitDate: z.string().optional(),

  wouldRecommend: z.boolean().default(true),

  consent: z
    .boolean()
    .refine(
      val => val === true,
      'Потрібна згода на обробку персональних даних'
    ),
})

export type ReviewFormData = z.infer<typeof reviewSchema>

// Services and Doctors options for forms
export const SERVICES = [
  'Терапевтична стоматологія',
  'Хірургічна стоматологія',
  'Ортопедична стоматологія',
  'Ортодонтія',
  'Естетична стоматологія',
  'Дитяча стоматологія',
  'Пародонтологія',
  'Ендодонтія',
  'Імплантація',
  'Професійна гігієна',
  'Відбілювання зубів',
] as const

export const DOCTORS = [
  { id: 'any', name: 'Будь-який лікар', specialization: '' },
  {
    id: 'mykola-kovalchuk',
    name: 'Ковальчук Микола Іванович',
    specialization: 'Стоматолог-терапевт',
  },
  {
    id: 'olena-bondarenko',
    name: 'Бондаренко Олена Петрівна',
    specialization: 'Стоматолог-ортодонт',
  },
  {
    id: 'andriy-melnyk',
    name: 'Мельник Андрій Сергійович',
    specialization: 'Стоматолог-хірург, імплантолог',
  },
  {
    id: 'iryna-savchenko',
    name: 'Савченко Ірина Олександрівна',
    specialization: 'Дитячий стоматолог',
  },
  {
    id: 'viktor-lysenko',
    name: 'Лисенко Віктор Миколайович',
    specialization: 'Стоматолог-ортопед',
  },
] as const

export const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
] as const

// Validation helper functions
export const validatePhoneNumber = (phone: string): boolean => {
  return phoneRegex.test(phone)
}

export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email)
}

export const formatPhoneNumber = (phone: string): string => {
  // Normalize to +380XXXXXXXXX
  const digits = phone.replace(/\D/g, '')

  // If already starts with 380 and has extra digits, take last 9 digits
  if (digits.startsWith('380')) {
    const last9 = digits.slice(-9)
    if (last9.length === 9) return '+380' + last9
  }

  // Handle 0XXXXXXXXX (10 digits) or 9-digit local form
  if (digits.length === 10 && digits.startsWith('0')) {
    return '+380' + digits.slice(1)
  }
  if (digits.length === 9) {
    return '+380' + digits
  }

  // Fallback: if at least 9 digits exist, use the last 9
  if (digits.length > 9) {
    return '+380' + digits.slice(-9)
  }

  return phone // Return original if format is unclear
}

// Common error messages
export const VALIDATION_MESSAGES = {
  required: "Це поле обов'язкове",
  email: 'Невірний формат email',
  phone: 'Невірний формат телефону',
  minLength: (min: number) => `Мінімум ${min} символів`,
  maxLength: (max: number) => `Максимум ${max} символів`,
  consent: 'Потрібна згода на обробку персональних даних',
} as const

// Patient Intake Form Schema (анкета нового пацієнта, /anketa)
export const intakeFormSchema = z.object({
  lastName: z
    .string()
    .min(2, 'Прізвище повинно містити принаймні 2 символи')
    .max(50, 'Прізвище не може містити більше 50 символів')
    .regex(/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/, 'Прізвище може містити лише літери'),

  firstName: z
    .string()
    .min(2, "Ім'я повинно містити принаймні 2 символи")
    .max(50, "Ім'я не може містити більше 50 символів")
    .regex(/^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]+$/, "Ім'я може містити лише літери"),

  patronymic: z
    .string()
    .max(50, 'По батькові не може містити більше 50 символів')
    .regex(
      /^[a-zA-ZаА-яЯієїґІЄЇҐ\s'-]*$/,
      'По батькові може містити лише літери'
    )
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .min(1, "Телефон обов'язковий")
    .regex(phoneRegex, 'Невірний формат телефону (приклад: +380501234567)'),

  email: z
    .string()
    .email('Невірний формат email')
    .regex(emailRegex, 'Невірний формат email')
    .optional()
    .or(z.literal('')),

  dateOfBirth: z
    .string()
    .optional()
    .refine(date => {
      if (!date) return true
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 120
    }, 'Невірна дата народження'),

  allergies: z.string().max(500, 'Максимум 500 символів').optional(),

  medications: z.string().max(500, 'Максимум 500 символів').optional(),

  chronicConditions: z.string().max(500, 'Максимум 500 символів').optional(),

  pregnancy: z.enum(['', 'no', 'yes']),

  complaints: z.string().max(1000, 'Максимум 1000 символів').optional(),

  dataConsent: z
    .boolean()
    .refine(
      val => val === true,
      'Потрібна згода на обробку персональних даних'
    ),

  marketingConsent: z.boolean(),
})

export type IntakeFormData = z.infer<typeof intakeFormSchema>
