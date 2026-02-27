import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createContact } from '../contacts'
import { api } from '../api'

// Mock the api module
vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
  },
  mockAPIResponse: vi.fn((data, delay) =>
    new Promise(resolve => setTimeout(() => resolve({ success: true, data }), delay))
  ),
}))

describe('Contacts Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createContact', () => {
    it('should create contact successfully', async () => {
      const mockResponse = { id: 'contact-123' }

      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      })

      const result = await createContact({
        name: 'John Doe',
        phone: '+380501234567',
        email: 'john@example.com',
        message: 'Hello, I have a question about services.',
      })

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('contact-123')
      expect(api.post).toHaveBeenCalledWith('/contacts', {
        name: 'John Doe',
        phone: '+380501234567',
        email: 'john@example.com',
        message: 'Hello, I have a question about services.',
      })
    })

    it('should fallback to mock on API failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'))

      const result = await createContact({
        name: 'Jane Smith',
        phone: '+380507654321',
        message: 'I need help with booking.',
      })

      expect(result.success).toBe(true)
      expect(result.data.id).toMatch(/^contact-/)
    })

    it('should include all required fields', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        data: { id: 'contact-456' },
      })

      await createContact({
        name: 'Test User',
        phone: '+380501111111',
        message: 'Test message for contact form.',
      })

      expect(api.post).toHaveBeenCalledWith('/contacts', {
        name: 'Test User',
        phone: '+380501111111',
        message: 'Test message for contact form.',
      })
    })

    it('should handle optional email field', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        data: { id: 'contact-789' },
      })

      const contactWithEmail = {
        name: 'User With Email',
        phone: '+380502222222',
        email: 'user@test.com',
        message: 'Contact with email.',
      }

      await createContact(contactWithEmail)

      expect(api.post).toHaveBeenCalledWith('/contacts', contactWithEmail)
    })
  })
})
