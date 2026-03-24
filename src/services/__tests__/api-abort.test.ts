import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, APIError } from '../api'

describe('fetchAPI abort handling', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps AbortError to APIError with code ABORTED', async () => {
    const err = await api.get('/health').catch(e => e)
    expect(err).toBeInstanceOf(APIError)
    expect((err as APIError).code).toBe('ABORTED')
    expect((err as APIError).statusCode).toBe(0)
  })
})
