import { expect, test } from '@playwright/test'

test.describe('API health check', () => {
  test('GET /api/health returns ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
    expect(body.environment).toBeDefined()
  })

  test('GET /api/doctors returns doctor list', async ({ request }) => {
    const response = await request.get('/api/doctors')
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBeTruthy()
  })

  test('GET /api/services returns service catalog', async ({ request }) => {
    const response = await request.get('/api/services')
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data.services).toBeDefined()
    expect(body.data.categories).toBeDefined()
  })
})
