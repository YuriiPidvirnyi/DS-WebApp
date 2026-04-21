// Типи для запису на прийом
export interface AppointmentFormData extends Record<string, unknown> {
  name: string
  phone: string
  email: string
  service: string
  message: string
  preferredDate?: string
  preferredTime?: string
  doctorId?: string
  locale?: 'uk' | 'en' | 'pl'
}

export interface Appointment extends AppointmentFormData {
  id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: Date
  doctorId?: string
}

// Типи для пацієнтів
export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  email?: string
  isPrimary: boolean
}

export interface ConsentRecord {
  id: string
  type: 'hipaa' | 'treatment' | 'photo' | 'video' | 'financial'
  signedDate: Date
  signature: string
  documentUrl?: string
}

export interface PatientTag {
  id: string
  label: string
  color: string
  category: 'risk' | 'preference' | 'status' | 'vip'
}

export interface CommunicationPreferences {
  preferredChannel: 'email' | 'sms' | 'phone' | 'app'
  appointmentReminders: boolean
  marketingEmails: boolean
  treatmentFollowUps: boolean
  birthdayGreetings: boolean
  language: 'uk' | 'en' | 'pl'
}

export interface EnhancedPatient {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  phone: string
  alternatePhone?: string
  email?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  emergencyContacts: EmergencyContact[]
  familyAccountId?: string
  familyMembers?: string[]
  accountHolder?: string
  consents: ConsentRecord[]
  tags: PatientTag[]
  communicationPreferences: CommunicationPreferences
  portalUsername?: string
  portalEnabled: boolean
  lastLoginDate?: Date
  status: 'active' | 'inactive' | 'archived' | 'deceased'
  registrationDate: Date
  lastVisitDate?: Date
  nextAppointmentDate?: Date
  outstandingBalance: number
  lifetimeValue: number
  referralSource?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Типи для відгуків
export interface Testimonial {
  id: string
  name: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  service?: string
  date: string
  avatarUrl?: string
}

// Типи для галереї
export interface GalleryImage {
  id: string
  url: string
  title: string
  category: 'clinic' | 'equipment' | 'team' | 'before-after'
  description?: string
}

// API Response типи
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Типи запиту з контактної форми
export interface ContactRequest {
  name: string
  phone: string
  email?: string
  message?: string
  consent: boolean
}
