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
