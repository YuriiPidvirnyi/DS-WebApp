import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The auth gate must reject before any email/Supabase work happens, so the
// heavy dependencies are mocked away entirely.
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  isEmailConfigured: vi.fn(() => false),
}))
vi.mock('@/lib/email-templates', () => ({
  bookingConfirmationEmail: vi.fn(),
  appointmentReminderEmail: vi.fn(),
  appointmentCancellationEmail: vi.fn(),
  newBookingAdminEmail: vi.fn(),
  recallEmail: vi.fn(),
  reviewRequestEmail: vi.fn(),
}))

import { GET } from '../../../app/api/cron/notifications/route'

function makeRequest(authorization?: string) {
  return new NextRequest('http://localhost:3000/api/cron/notifications', {
    method: 'GET',
    ...(authorization ? { headers: { authorization } } : {}),
  })
}

// Ported from e2e/cron-notifications.spec.ts: the auth gate is pure request
// logic, so it belongs in unit tests, not in a browser suite. With CRON_SECRET
// unset (vitest env), the route must 401 both with and without a token —
// callers cannot distinguish "unconfigured" from "wrong token".
describe('GET /api/cron/notifications — auth gate', () => {
  it('rejects a missing Authorization header with 401', async () => {
    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Unauthorized')
  })

  it('rejects a wrong bearer token with 401', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })
})
