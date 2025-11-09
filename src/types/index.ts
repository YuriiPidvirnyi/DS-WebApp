// Типи для послуг
export interface Service {
  id: string
  category: string
  name: string
  description?: string
  price?: number
  duration?: number // в хвилинах
}

export interface ServiceCategory {
  category: string
  description: string
  services: string[]
}

// Типи для запису на прийом
export interface AppointmentFormData extends Record<string, unknown> {
  name: string
  phone: string
  email: string
  service: string
  message: string
  preferredDate?: string
  preferredTime?: string
}

export interface Appointment extends AppointmentFormData {
  id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: Date
  doctorId?: string
}

// Типи для лікарів
export interface Doctor {
  id: string
  name: string
  position: string
  specialization: string[]
  experience: string
  education: string
  bio?: string
  photoUrl?: string
}

// Enhanced Patient Types for Full Management
export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  email?: string
  isPrimary: boolean
}

export interface MedicalHistory {
  allergies: string[]
  medications: string[]
  conditions: string[]
  previousSurgeries: string[]
  bloodType?: string
  lastUpdated: Date
}

export interface DentalHistory {
  previousDentist?: string
  lastVisitDate?: Date
  majorTreatments: string[]
  currentComplaints: string[]
  oralHygiene: 'poor' | 'fair' | 'good' | 'excellent'
}

export interface InsuranceInfo {
  id: string
  provider: string
  policyNumber: string
  groupNumber?: string
  isPrimary: boolean
  cardImageUrl?: string
  expirationDate?: Date
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

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  highContrast: boolean
  screenReader: boolean
  colorblindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia'
}

export interface EnhancedPatient {
  id: string
  // Basic Info
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say'

  // Contact
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

  // Medical
  medicalHistory: MedicalHistory
  dentalHistory: DentalHistory

  // Insurance
  primaryInsurance?: InsuranceInfo
  secondaryInsurance?: InsuranceInfo

  // Emergency
  emergencyContacts: EmergencyContact[]

  // Account Management
  familyAccountId?: string
  familyMembers?: string[] // Array of patient IDs
  accountHolder?: string // Patient ID of primary account holder

  // Consents
  consents: ConsentRecord[]

  // Tags & Categories
  tags: PatientTag[]

  // Preferences
  communicationPreferences: CommunicationPreferences
  accessibilityPreferences?: AccessibilityPreferences

  // Portal Access
  portalUsername?: string
  portalEnabled: boolean
  lastLoginDate?: Date

  // Status
  status: 'active' | 'inactive' | 'archived' | 'deceased'
  registrationDate: Date
  lastVisitDate?: Date
  nextAppointmentDate?: Date

  // Financial
  outstandingBalance: number
  lifetimeValue: number

  // Metadata
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

// Типи для навігації
export interface NavItem {
  name: string
  href: string
}

// Clinical Documentation Types
export interface ToothCondition {
  toothNumber: number // 1-32 adult teeth, 51-85 pediatric
  surfaces: {
    mesial?: string // M
    distal?: string // D
    occlusal?: string // O
    buccal?: string // B
    lingual?: string // L
  }
  restorations: string[]
  condition: 'healthy' | 'caries' | 'filled' | 'crown' | 'missing' | 'implant'
  notes?: string
}

export interface PeriodontalReading {
  toothNumber: number
  probingDepths: {
    mesial: number
    distal: number
    buccal: number
  }
  bleeding: boolean
  mobility: 0 | 1 | 2 | 3
  furcation?: 1 | 2 | 3
  notes?: string
}

export interface ClinicalNote {
  id: string
  patientId: string
  appointmentId?: string
  type: 'soap' | 'progress' | 'consultation' | 'emergency'
  subjective?: string // Patient's complaint/symptoms
  objective?: string // Clinical findings
  assessment?: string // Diagnosis
  plan?: string // Treatment plan
  vitalSigns?: {
    bloodPressure?: string
    pulse?: number
    oxygen?: number
  }
  providerId: string
  createdAt: Date
  updatedAt: Date
}

export interface TreatmentPlan {
  id: string
  patientId: string
  providerId: string
  title: string
  description?: string
  phases: TreatmentPhase[]
  totalCost: number
  estimatedDuration: number // in weeks
  status:
    | 'draft'
    | 'presented'
    | 'accepted'
    | 'in-progress'
    | 'completed'
    | 'cancelled'
  priority: 'urgent' | 'recommended' | 'optional'
  createdAt: Date
  presentedAt?: Date
  acceptedAt?: Date
  completedAt?: Date
}

export interface TreatmentPhase {
  id: string
  phaseNumber: number
  title: string
  description?: string
  procedures: ProcedureItem[]
  estimatedCost: number
  estimatedVisits: number
  status: 'pending' | 'in-progress' | 'completed'
  startDate?: Date
  completedDate?: Date
}

export interface ProcedureItem {
  id: string
  code: string // CDT code
  name: string
  description?: string
  toothNumbers?: number[]
  surfaces?: string[]
  quantity: number
  unitCost: number
  totalCost: number
  completed: boolean
  completedDate?: Date
  providerId?: string
  notes?: string
}

export interface DentalImage {
  id: string
  patientId: string
  type: 'xray' | 'photo' | 'scan' | 'cbct'
  category: 'diagnostic' | 'treatment' | 'progress' | 'before' | 'after'
  title: string
  description?: string
  fileUrl: string
  thumbnailUrl?: string
  toothNumbers?: number[]
  takenDate: Date
  providerId: string
  annotations?: ImageAnnotation[]
  dicomData?: Record<string, unknown> // For DICOM files
}

export interface ImageAnnotation {
  id: string
  type: 'arrow' | 'circle' | 'rectangle' | 'text' | 'measurement'
  coordinates: {
    x: number
    y: number
    width?: number
    height?: number
  }
  text?: string
  color: string
  createdBy: string
  createdAt: Date
}

// Communication Types
export interface PatientMessage {
  id: string
  patientId: string
  providerId?: string
  subject: string
  content: string
  messageType: 'inquiry' | 'appointment' | 'billing' | 'clinical' | 'general'
  direction: 'inbound' | 'outbound'
  status: 'unread' | 'read' | 'replied' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  attachments?: MessageAttachment[]
  parentMessageId?: string // for replies
  sentAt: Date
  readAt?: Date
  repliedAt?: Date
}

export interface MessageAttachment {
  id: string
  filename: string
  fileSize: number
  mimeType: string
  fileUrl: string
  uploadedAt: Date
}

export interface AutomatedCampaign {
  id: string
  name: string
  type: 'reminder' | 'recall' | 'birthday' | 'followup' | 'marketing'
  trigger: {
    event:
      | 'appointment-scheduled'
      | 'treatment-completed'
      | 'birthday'
      | 'overdue-visit'
    delay: number // hours
  }
  template: {
    subject: string
    content: string
    channels: ('email' | 'sms' | 'app')[]
  }
  active: boolean
  lastRun?: Date
  stats: {
    sent: number
    delivered: number
    opened: number
    clicked: number
  }
}

// Payment & Billing Types
export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'financing'
  isDefault: boolean
  // Card details (tokenized)
  cardLast4?: string
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'discover'
  cardExpiry?: string
  // Bank details (tokenized)
  bankName?: string
  accountLast4?: string
  // Metadata
  createdAt: Date
  expiresAt?: Date
}

export interface PaymentPlan {
  id: string
  patientId: string
  totalAmount: number
  downPayment: number
  monthlyPayment: number
  numberOfPayments: number
  interestRate: number
  startDate: Date
  status: 'active' | 'completed' | 'defaulted' | 'cancelled'
  paymentMethodId: string
  payments: PlanPayment[]
  createdAt: Date
}

export interface PlanPayment {
  id: string
  paymentNumber: number
  dueDate: Date
  amount: number
  status: 'pending' | 'paid' | 'late' | 'failed'
  paidDate?: Date
  transactionId?: string
  lateFee?: number
}

export interface InsuranceClaim {
  id: string
  patientId: string
  appointmentId?: string
  claimNumber?: string
  insuranceId: string
  procedures: ClaimProcedure[]
  totalAmount: number
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'denied' | 'paid'
  submittedAt?: Date
  responseDate?: Date
  paidAmount?: number
  denialReason?: string
  eobDocument?: string
  notes?: string
}

export interface ClaimProcedure {
  procedureId: string
  cdtCode: string
  description: string
  chargedAmount: number
  allowedAmount?: number
  paidAmount?: number
  patientResponsibility?: number
  deductible?: number
  coInsurance?: number
  serviceDate: Date
  toothNumber?: number
  surfaces?: string
}

// API Response типи
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

// Типи запиту з контактної форми
export interface ContactRequest {
  name: string
  email: string
  phone: string
  message: string
  consent: boolean
}
