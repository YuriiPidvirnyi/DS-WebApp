import { describe, it, expect } from 'vitest'

import { GET } from '../../../app/api/health/route'

describe('GET /api/health', () => {
  it('returns ok status with basic info', async () => {
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
    expect(body.environment).toBeDefined()
  })
})
