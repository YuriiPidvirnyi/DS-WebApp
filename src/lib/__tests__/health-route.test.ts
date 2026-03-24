import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/clinicards-client', () => ({
  pingCliniCards: vi.fn(),
  CliniCardsError: class CliniCardsError extends Error {
    code: string
    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  },
}))

import { GET } from '../../../app/api/health/route'
import { pingCliniCards } from '@/lib/clinicards-client'

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.CLINICARDS_API_KEY
  })

  it('returns ok status with basic info', async () => {
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
    expect(body.environment).toBeDefined()
  })

  it('includes upstream status when CLINICARDS_API_KEY is set', async () => {
    process.env.CLINICARDS_API_KEY = 'test-key'
    vi.mocked(pingCliniCards).mockResolvedValue({
      status: 'ok',
      version: '1.0',
    })

    const res = await GET()
    const body = await res.json()

    expect(body.upstream).toEqual({ status: 'ok', version: '1.0' })
  })

  it('returns degraded when CliniCards fails', async () => {
    process.env.CLINICARDS_API_KEY = 'test-key'
    vi.mocked(pingCliniCards).mockRejectedValue(new Error('timeout'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('degraded')
    expect(body.upstream.error).toBe('unreachable')
  })
})
