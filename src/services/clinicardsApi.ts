/**
 * CliniCards API Integration Service
 * Documentation: https://cliniccards.com/ua/help/nalashtuvannya-ari
 */

interface CliniCardsConfig {
  apiKey: string
  baseUrl: string
  timeout?: number
  retries?: number
}

interface Schedule {
  doctorId: string
  doctorName: string
  specialization: string
  date: string
  timeSlots: TimeSlot[]
}

interface TimeSlot {
  time: string
  available: boolean
  duration: number
  appointmentId?: string
}

interface Patient {
  id?: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  email?: string
  birthDate?: string
  gender?: 'male' | 'female'
  address?: string
  notes?: string
}

interface Appointment {
  id?: string
  patientId: string
  doctorId: string
  serviceId?: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
}

interface TreatmentPlan {
  id: string
  patientId: string
  patientName: string
  createdDate: string
  totalCost: number
  status: 'active' | 'completed' | 'cancelled'
  procedures: Procedure[]
}

interface Procedure {
  id: string
  name: string
  cost: number
  quantity: number
  completed: boolean
  completedDate?: string
}

interface Payment {
  id: string
  patientId: string
  patientName: string
  amount: number
  date: string
  method: 'cash' | 'card' | 'transfer'
  purpose: string
  invoiceNumber?: string
}

interface PriceItem {
  id: string
  categoryId: string
  categoryName: string
  name: string
  price: number
  duration?: number
  description?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class CliniCardsApiService {
  private config: CliniCardsConfig
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(config: CliniCardsConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.cliniccards.com/v1',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      ...config,
    }
  }

  /**
   * Make API request with retry logic and caching
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`
    const cacheKey = `${endpoint}-${JSON.stringify(options.body || {})}`

    // Check cache for GET requests
    if (useCache && options.method === 'GET') {
      const cached = this.requestCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return { success: true, data: cached.data }
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-API-Version': '1.0',
      ...options.headers,
    }

    let lastError: Error | null = null

    // Retry logic
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Cache successful GET requests
        if (useCache && options.method === 'GET') {
          this.requestCache.set(cacheKey, { data, timestamp: Date.now() })
        }

        return { success: true, data }
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries!) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
    }
  }

  // ============= SCHEDULE METHODS =============

  /**
   * Get doctor schedule for online booking
   */
  async getSchedule(params: {
    doctorId?: string
    startDate: string
    endDate: string
  }): Promise<ApiResponse<Schedule[]>> {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
      ...(params.doctorId && { doctor_id: params.doctorId }),
    })

    return this.request<Schedule[]>(`/schedule?${queryParams}`, { method: 'GET' })
  }

  /**
   * Get available time slots for specific doctor and date
   */
  async getAvailableSlots(params: {
    doctorId: string
    date: string
  }): Promise<ApiResponse<TimeSlot[]>> {
    return this.request<TimeSlot[]>(
      `/schedule/slots?doctor_id=${params.doctorId}&date=${params.date}`,
      { method: 'GET' }
    )
  }

  /**
   * Create new appointment
   */
  async createAppointment(appointment: Appointment): Promise<ApiResponse<{ id: string }>> {
    return this.request<{ id: string }>(
      '/appointments',
      {
        method: 'POST',
        body: JSON.stringify(appointment),
      },
      false
    )
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<ApiResponse<void>> {
    return this.request<void>(
      `/appointments/${appointmentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      false
    )
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string): Promise<ApiResponse<void>> {
    return this.request<void>(
      `/appointments/${appointmentId}`,
      {
        method: 'DELETE',
      },
      false
    )
  }

  // ============= PATIENT METHODS =============

  /**
   * Create new patient
   */
  async createPatient(patient: Patient): Promise<ApiResponse<{ id: string }>> {
    return this.request<{ id: string }>(
      '/patients',
      {
        method: 'POST',
        body: JSON.stringify(patient),
      },
      false
    )
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<ApiResponse<Patient>> {
    return this.request<Patient>(`/patients/${patientId}`, { method: 'GET' })
  }

  /**
   * Get patient by phone
   */
  async getPatientByPhone(phone: string): Promise<ApiResponse<Patient | null>> {
    return this.request<Patient | null>(
      `/patients/search?phone=${encodeURIComponent(phone)}`,
      { method: 'GET' }
    )
  }

  /**
   * Get list of all patients
   */
  async getPatients(params?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ patients: Patient[]; total: number }>> {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.set('search', params.search)
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.offset) queryParams.set('offset', params.offset.toString())

    return this.request<{ patients: Patient[]; total: number }>(
      `/patients?${queryParams}`,
      { method: 'GET' }
    )
  }

  /**
   * Update patient information
   */
  async updatePatient(
    patientId: string,
    updates: Partial<Patient>
  ): Promise<ApiResponse<void>> {
    return this.request<void>(
      `/patients/${patientId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      false
    )
  }

  // ============= TREATMENT PLAN METHODS =============

  /**
   * Get treatment plans for period
   */
  async getTreatmentPlans(params: {
    startDate: string
    endDate: string
    patientId?: string
  }): Promise<ApiResponse<TreatmentPlan[]>> {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
      ...(params.patientId && { patient_id: params.patientId }),
    })

    return this.request<TreatmentPlan[]>(
      `/treatment-plans?${queryParams}`,
      { method: 'GET' }
    )
  }

  /**
   * Get treatment plan by ID
   */
  async getTreatmentPlan(planId: string): Promise<ApiResponse<TreatmentPlan>> {
    return this.request<TreatmentPlan>(`/treatment-plans/${planId}`, { method: 'GET' })
  }

  // ============= WORK PERFORMED METHODS =============

  /**
   * Get performed procedures for period
   */
  async getPerformedWork(params: {
    startDate: string
    endDate: string
    patientId?: string
    doctorId?: string
  }): Promise<ApiResponse<Procedure[]>> {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
      ...(params.patientId && { patient_id: params.patientId }),
      ...(params.doctorId && { doctor_id: params.doctorId }),
    })

    return this.request<Procedure[]>(`/work-performed?${queryParams}`, { method: 'GET' })
  }

  // ============= PAYMENT METHODS =============

  /**
   * Get payments for period
   */
  async getPayments(params: {
    startDate: string
    endDate: string
    patientId?: string
  }): Promise<ApiResponse<Payment[]>> {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
      ...(params.patientId && { patient_id: params.patientId }),
    })

    return this.request<Payment[]>(`/payments?${queryParams}`, { method: 'GET' })
  }

  /**
   * Get patient's payment history
   */
  async getPatientPayments(patientId: string): Promise<ApiResponse<Payment[]>> {
    return this.request<Payment[]>(`/patients/${patientId}/payments`, { method: 'GET' })
  }

  // ============= PRICE LIST METHODS =============

  /**
   * Get full price list
   */
  async getPriceList(): Promise<ApiResponse<PriceItem[]>> {
    return this.request<PriceItem[]>('/price-list', { method: 'GET' })
  }

  /**
   * Get price for specific service
   */
  async getServicePrice(serviceId: string): Promise<ApiResponse<PriceItem>> {
    return this.request<PriceItem>(`/price-list/${serviceId}`, { method: 'GET' })
  }

  // ============= UTILITY METHODS =============

  /**
   * Clear cache
   */
  clearCache(): void {
    this.requestCache.clear()
  }

  /**
   * Check API connection
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request<{ status: string; version: string }>(
      '/health',
      { method: 'GET' },
      false
    )
  }
}

// Singleton instance
let clinicardsApi: CliniCardsApiService | null = null

export function initCliniCardsApi(config: CliniCardsConfig): void {
  clinicardsApi = new CliniCardsApiService(config)
}

export function getCliniCardsApi(): CliniCardsApiService {
  if (!clinicardsApi) {
    throw new Error('CliniCards API not initialized. Call initCliniCardsApi first.')
  }
  return clinicardsApi
}

export { CliniCardsApiService }
export type {
  Schedule,
  TimeSlot,
  Patient,
  Appointment,
  TreatmentPlan,
  Procedure,
  Payment,
  PriceItem,
  ApiResponse,
}
