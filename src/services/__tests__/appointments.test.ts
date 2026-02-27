import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createAppointment,
  getAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableSlots,
} from '../appointments'
import { api } from '../api'

// Mock the api module
vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  mockAPIResponse: vi.fn((data, delay) => 
    new Promise(resolve => setTimeout(() => resolve({ success: true, data }), delay))
  ),
}))

describe('Appointments Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const mockAppointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        patientPhone: '+380501234567',
        service: 'Cleaning',
        date: '2026-03-15',
        time: '10:00',
        status: 'pending' as const,
        createdAt: new Date(),
      }

      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        data: mockAppointment,
      })

      const result = await createAppointment({
        patientName: 'John Doe',
        patientPhone: '+380501234567',
        service: 'Cleaning',
        date: '2026-03-15',
        time: '10:00',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAppointment)
      expect(api.post).toHaveBeenCalledWith('/appointments', expect.any(Object))
    })

    it('should fallback to mock when API fails', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'))

      const result = await createAppointment({
        patientName: 'John Doe',
        patientPhone: '+380501234567',
        service: 'Cleaning',
        date: '2026-03-15',
        time: '10:00',
      })

      expect(result.success).toBe(true)
      expect(result.data.patientName).toBe('John Doe')
      expect(result.data.status).toBe('pending')
    })
  })

  describe('getAppointment', () => {
    it('should get appointment by ID', async () => {
      const mockAppointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        status: 'confirmed' as const,
      }

      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: mockAppointment,
      })

      const result = await getAppointment('apt-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAppointment)
      expect(api.get).toHaveBeenCalledWith('/appointments/apt-123')
    })

    it('should throw when not implemented', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Not found'))

      await expect(getAppointment('apt-123')).rejects.toThrow('Not implemented')
    })
  })

  describe('getAllAppointments', () => {
    it('should get all appointments', async () => {
      const mockAppointments = [
        { id: 'apt-1', patientName: 'John Doe' },
        { id: 'apt-2', patientName: 'Jane Smith' },
      ]

      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: mockAppointments,
      })

      const result = await getAllAppointments()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(api.get).toHaveBeenCalledWith('/appointments')
    })
  })

  describe('updateAppointmentStatus', () => {
    it('should update appointment status', async () => {
      const mockUpdated = {
        id: 'apt-123',
        status: 'confirmed' as const,
      }

      vi.mocked(api.patch).mockResolvedValueOnce({
        success: true,
        data: mockUpdated,
      })

      const result = await updateAppointmentStatus('apt-123', 'confirmed')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('confirmed')
      expect(api.patch).toHaveBeenCalledWith('/appointments/apt-123/status', {
        status: 'confirmed',
      })
    })
  })

  describe('cancelAppointment', () => {
    it('should cancel appointment', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      const result = await cancelAppointment('apt-123')

      expect(result.success).toBe(true)
      expect(api.delete).toHaveBeenCalledWith('/appointments/apt-123')
    })
  })

  describe('getAvailableSlots', () => {
    it('should get available slots for date', async () => {
      const mockSlots = ['09:00', '10:00', '11:00', '14:00', '15:00']

      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: mockSlots,
      })

      const result = await getAvailableSlots('2026-03-15')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSlots)
      expect(api.get).toHaveBeenCalledWith('/appointments/slots?date=2026-03-15')
    })

    it('should include doctorId in query when provided', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: ['10:00', '11:00'],
      })

      await getAvailableSlots('2026-03-15', 'doc-123')

      expect(api.get).toHaveBeenCalledWith(
        '/appointments/slots?date=2026-03-15&doctorId=doc-123'
      )
    })

    it('should return mock slots on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'))

      const result = await getAvailableSlots('2026-03-15')

      expect(result.success).toBe(true)
      expect(result.data).toContain('09:00')
      expect(result.data).toContain('17:00')
    })
  })
})
