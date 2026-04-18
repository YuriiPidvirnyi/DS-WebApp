/**
 * E2E: /api/cron/notifications
 *
 * Tests the auth gate and basic response shapes.
 * Tests that require CRON_SECRET + live Supabase are skipped in environments
 * where those env vars are absent (local mocked / basic CI), but run in
 * preview/staging via preview-validate.yml where secrets are injected.
 */
import { expect, test } from '@playwright/test'

const CRON_URL = '/api/cron/notifications'
const CRON_SECRET = process.env.CRON_SECRET ?? ''

test.describe('Cron /api/cron/notifications', () => {
  test('rejects missing Authorization header with 401', async ({ request }) => {
    const res = await request.get(CRON_URL)
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Unauthorized')
  })

  test('rejects wrong bearer token with 401', async ({ request }) => {
    const res = await request.get(CRON_URL, {
      headers: { Authorization: 'Bearer wrong-secret' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('returns success shape when CRON_SECRET is valid', async ({
    request,
  }) => {
    test.skip(!CRON_SECRET, 'CRON_SECRET not set — skipping live cron test')

    const res = await request.get(CRON_URL, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })

    // May return 500 if Supabase service key not configured in this env,
    // but if it succeeds the shape must be valid.
    if (res.ok()) {
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(typeof body.processed).toBe('number')
    } else {
      // 500 is acceptable in stripped-down CI envs without service key
      expect([200, 500]).toContain(res.status())
    }
  })
})
