import { expect, test, type Page } from '@playwright/test'

/**
 * Smoke tests for the 3.0 materials ordering workflow pages.
 * All tests mock Supabase auth so no live DB is required.
 */

// Playwright config sets NEXT_PUBLIC_SUPABASE_URL to this mock origin at test time
const SUPABASE_URL = 'http://127.0.0.1:3000/supabase-mock'

const jsonHeaders = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
}

async function mockAdminAuth(page: Page) {
  await page.route(`${SUPABASE_URL}/auth/v1/user`, async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
      return
    }
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        id: 'admin-user-id-1',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'admin@dentalstory.ua',
        phone: '',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { name: 'Test Admin' },
        identities: [],
      }),
    })
  })

  await page.route(`${SUPABASE_URL}/rest/v1/admin_users*`, async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
      return
    }
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify([
        {
          role: 'superadmin',
          display_name: 'Test Admin',
          doctor_id: null,
          phone: null,
          specialization: null,
        },
      ]),
    })
  })
}

async function stubDataApis(page: Page) {
  await Promise.all([
    page.route('**/api/materials*', route =>
      route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ data: [], total: 0 }),
      })
    ),
    page.route('**/api/material-orders*', route =>
      route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ data: [], total: 0 }),
      })
    ),
    page.route('**/api/admin/inventory-analytics*', route =>
      route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          data: {
            totalMaterials: 0,
            lowStockCount: 0,
            totalSpent: 0,
            pendingOrders: 0,
            topConsumed: [],
            ordersByMonth: [],
            stockLevels: [],
          },
        }),
      })
    ),
  ])
}

test.describe('Admin: materials ordering workflow', () => {
  let jsErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    jsErrors = []
    page.on('pageerror', err => jsErrors.push(err.message))
    await mockAdminAuth(page)
    await stubDataApis(page)
  })

  test('materials page renders with page heading', async ({ page }) => {
    await page.goto('/admin/materials')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Матеріали/i })).toBeVisible(
      { timeout: 20_000 }
    )

    expect(jsErrors).toHaveLength(0)
  })

  test('orders page renders with page heading', async ({ page }) => {
    await page.goto('/admin/orders')
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', { name: /Замовлення/i })
    ).toBeVisible({ timeout: 20_000 })

    expect(jsErrors).toHaveLength(0)
  })

  test('inventory analytics page renders heading', async ({ page }) => {
    await page.goto('/admin/analytics/inventory')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Аналітика/i })).toBeVisible(
      { timeout: 20_000 }
    )

    expect(jsErrors).toHaveLength(0)
  })
})
