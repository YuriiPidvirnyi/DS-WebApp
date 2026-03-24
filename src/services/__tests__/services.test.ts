import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createContact } from '../contacts'
import { subscribeNewsletter } from '../subscriptions'
import { getReviews, createReview } from '../reviews'
import { sendFormFeedback } from '../feedback'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '../api'

describe('Service layer', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('contacts', () => {
    it('posts contact data to /contacts', async () => {
      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: { id: '123' },
      })

      const result = await createContact({
        name: 'Test',
        phone: '+380501234567',
        email: 'test@test.com',
        message: 'Hello',
        consent: true,
      })

      expect(api.post).toHaveBeenCalledWith('/contacts', expect.any(Object))
      expect(result.success).toBe(true)
    })
  })

  describe('subscriptions', () => {
    it('posts email to /newsletter', async () => {
      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: { subscribed: true },
      })

      const result = await subscribeNewsletter('test@example.com')

      expect(api.post).toHaveBeenCalledWith('/newsletter', {
        email: 'test@example.com',
      })
      expect(result.data!.subscribed).toBe(true)
    })
  })

  describe('reviews', () => {
    it('fetches reviews with timeout signal', async () => {
      vi.mocked(api.get).mockResolvedValue({
        success: true,
        data: { items: [] },
      })

      const result = await getReviews()

      expect(api.get).toHaveBeenCalledWith('/reviews', expect.any(Object))
      expect(result.success).toBe(true)
    })

    it('creates review via POST', async () => {
      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: { created: true, id: 'r1' },
      })

      const result = await createReview({
        name: 'Test',
        rating: 5,
        service: 'Терапія',
        comment: 'Great!',
        wouldRecommend: true,
      })

      expect(api.post).toHaveBeenCalledWith('/reviews', expect.any(Object))
      expect(result.data!.created).toBe(true)
    })
  })

  describe('feedback', () => {
    it('sends form feedback via POST', async () => {
      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: { recorded: true },
      })

      const result = await sendFormFeedback({
        form: 'booking',
        rating: 'up',
      })

      expect(api.post).toHaveBeenCalledWith('/feedback/form', {
        form: 'booking',
        rating: 'up',
      })
      expect(result.data!.recorded).toBe(true)
    })
  })
})
