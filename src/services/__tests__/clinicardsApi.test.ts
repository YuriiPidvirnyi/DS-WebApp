import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { initCliniCardsApi, getCliniCardsApi } from '../clinicardsApi'

// Mock fetch
global.fetch = vi.fn()

describe('CliniCardsApiService', () => {
  const mockApiKey = 'test_api_key_123'
  const mockBaseUrl = 'https://api.test.com/v1'

  beforeEach(() => {
    // Reset fetch mock
    vi.clearAllMocks()

    // Initialize API
    initCliniCardsApi({
      apiKey: mockApiKey,
      baseUrl: mockBaseUrl,
      timeout: 5000,
      retries: 2,
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initialization', () => {
    it('should initialize with config', () => {
      const api = getCliniCardsApi()
      expect(api).toBeDefined()
    })

    it('should not throw error when initialized', () => {
      expect(() => {
        getCliniCardsApi()
      }).not.toThrow()
    })
  })

  describe('Schedule API', () => {
    it('should get schedule successfully', async () => {
      const mockSchedule = [
        {
          doctorId: 'doc_1',
          doctorName: 'Dr. Smith',
          specialization: 'Orthodontist',
          date: '2024-01-15',
          timeSlots: [
            { time: '10:00', available: true, duration: 60 },
            { time: '11:00', available: false, duration: 60 },
          ],
        },
      ]

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSchedule,
      })

      const api = getCliniCardsApi()
      const response = await api.getSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockSchedule)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/schedule'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      )
    })

    it('should get schedule for specific doctor', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const api = getCliniCardsApi()
      await api.getSchedule({
        doctorId: 'doc_123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('doctor_id=doc_123'),
        expect.any(Object)
      )
    })

    it('should handle network errors with retry', async () => {
      let callCount = 0
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++
        if (callCount < 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => [],
        })
      })

      const api = getCliniCardsApi()
      const response = await api.getSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(callCount).toBe(2) // Failed once, succeeded on retry
      expect(response.success).toBe(true)
    })

    it('should fail after max retries', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      )

      const api = getCliniCardsApi()
      const response = await api.getSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(response.success).toBe(false)
      expect(response.error).toContain('Network error')
    })

    it('should cache GET requests', async () => {
      const mockData = [{ doctorId: 'doc_1' }]
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const api = getCliniCardsApi()

      // First call
      const response1 = await api.getSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      // Second call (should use cache)
      const response2 = await api.getSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(response1.data).toEqual(mockData)
      expect(response2.data).toEqual(mockData)
      // Should only call fetch once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Patients API', () => {
    it('should create patient', async () => {
      const newPatient = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+380501234567',
        email: 'john@example.com',
      }

      const mockResponse = {
        id: 'pat_123',
        ...newPatient,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const api = getCliniCardsApi()
      const response = await api.createPatient(newPatient)

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/patients'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPatient),
        })
      )
    })

    it('should get patient by phone', async () => {
      const mockPatient = {
        id: 'pat_123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+380501234567',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPatient],
      })

      const api = getCliniCardsApi()
      const response = await api.getPatientByPhone('+380501234567')

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockPatient)
    })

    it('should return null if patient not found', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const api = getCliniCardsApi()
      const response = await api.getPatientByPhone('+380501234567')

      expect(response.success).toBe(true)
      expect(response.data).toBeNull()
    })

    it('should get all patients', async () => {
      const mockPatients = [
        {
          id: 'pat_1',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+380501234567',
        },
        {
          id: 'pat_2',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+380507654321',
        },
      ]

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatients,
      })

      const api = getCliniCardsApi()
      const response = await api.getPatients({ limit: 50, offset: 0 })

      expect(response.success).toBe(true)
      expect(response.data).toEqual({
        patients: mockPatients,
        total: mockPatients.length,
      })
    })

    it('should search patients', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const api = getCliniCardsApi()
      await api.getPatients({ limit: 50, offset: 0, search: 'John' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=John'),
        expect.any(Object)
      )
    })
  })

  describe('Appointments API', () => {
    it('should create appointment', async () => {
      const newAppointment = {
        patientId: 'pat_123',
        doctorId: 'doc_456',
        date: '2024-01-15',
        time: '10:00',
        duration: 60,
        status: 'scheduled' as const,
        notes: 'First visit',
      }

      const mockResponse = {
        id: 'apt_789',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const api = getCliniCardsApi()
      const response = await api.createAppointment(newAppointment)

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockResponse)
    })

    it('should update appointment', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => {},
      })

      const api = getCliniCardsApi()
      const response = await api.updateAppointment('apt_123', {
        status: 'confirmed',
      })

      expect(response.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/apt_123'),
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })

    it('should cancel appointment', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'apt_123', status: 'cancelled' }),
      })

      const api = getCliniCardsApi()
      const response = await api.cancelAppointment('apt_123')

      expect(response.success).toBe(true)
    })
  })

  describe('Treatment Plans API', () => {
    it('should get treatment plans', async () => {
      const mockPlans = [
        {
          id: 'plan_1',
          patientId: 'pat_123',
          patientName: 'John Doe',
          createdDate: '2024-01-01',
          totalCost: 5000,
          status: 'active' as const,
          procedures: [],
        },
      ]

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlans,
      })

      const api = getCliniCardsApi()
      const response = await api.getTreatmentPlans({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockPlans)
    })

    it('should get treatment plan by id', async () => {
      const mockPlan = {
        id: 'plan_1',
        patientId: 'pat_123',
        patientName: 'John Doe',
        createdDate: '2024-01-01',
        totalCost: 5000,
        status: 'active' as const,
        procedures: [
          {
            id: 'proc_1',
            name: 'Cleaning',
            cost: 500,
            quantity: 1,
            completed: true,
          },
        ],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      })

      const api = getCliniCardsApi()
      const response = await api.getTreatmentPlan('plan_1')

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockPlan)
    })
  })

  describe('Payments API', () => {
    it('should get patient payments', async () => {
      const mockPayments = [
        {
          id: 'pay_1',
          patientId: 'pat_123',
          patientName: 'John Doe',
          amount: 1000,
          date: '2024-01-15',
          method: 'cash' as const,
          purpose: 'Treatment',
        },
      ]

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayments,
      })

      const api = getCliniCardsApi()
      const response = await api.getPatientPayments('pat_123')

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockPayments)
    })

    it('should get all payments', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const api = getCliniCardsApi()
      await api.getPayments({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments'),
        expect.any(Object)
      )
    })
  })

  describe('Price List API', () => {
    it('should get price list', async () => {
      const mockPriceList = [
        {
          id: 'price_1',
          categoryId: 'cat_1',
          categoryName: 'Cleaning',
          name: 'Basic Cleaning',
          price: 500,
          duration: 30,
          description: 'Standard cleaning procedure',
        },
      ]

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceList,
      })

      const api = getCliniCardsApi()
      const response = await api.getPriceList()

      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockPriceList)
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      })

      const api = getCliniCardsApi()
      const response = await api.getTreatmentPlan('non_existent')

      expect(response.success).toBe(false)
      expect(response.error).toContain('Resource not found')
    })

    it('should handle 500 errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      })

      const api = getCliniCardsApi()
      const response = await api.getSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(response.success).toBe(false)
    })

    it('should handle timeout', async () => {
      vi.useFakeTimers()
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(
              () => resolve({ ok: true, json: async () => ({}) }),
              10000
            )
          })
      )

      const api = getCliniCardsApi()
      const responsePromise = api.getSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      // Fast-forward time
      vi.runAllTimers()

      const response = await responsePromise
      expect(response.success).toBe(false)

      vi.useRealTimers()
    })

    it('should not retry on 4xx errors', async () => {
      let callCount = 0
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ message: 'Invalid request' }),
        })
      })

      const api = getCliniCardsApi()
      const response = await api.createPatient({
        firstName: 'Test',
        lastName: 'User',
        phone: '+380501234567',
      })

      expect(response.success).toBe(false)
      expect(callCount).toBe(1) // Should not retry
    })
  })
})
