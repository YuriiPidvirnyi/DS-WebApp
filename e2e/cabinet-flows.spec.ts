/**
 * E2E: Patient cabinet flows
 *
 * In mock CI (no live Supabase), tests that all cabinet routes enforce auth
 * and redirect to /auth/login. In preview environments with real auth,
 * additional happy-path tests run via E2E_TEST_EMAIL / E2E_TEST_PASSWORD.
 */
import { expect, test } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''
const hasLiveAuth = Boolean(TEST_EMAIL && TEST_PASSWORD)

// Cabinet routes that require authentication
const PROTECTED_ROUTES = [
  '/cabinet',
  '/cabinet/appointments',
  '/cabinet/profile',
  '/cabinet/treatments',
]

test.describe('Cabinet — auth gate', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects unauthenticated users to auth`, async ({
      page,
    }) => {
      await page.goto(route)
      // Should land on a login/auth page, not the cabinet itself
      await page.waitForURL(url => !url.pathname.startsWith('/cabinet'), {
        timeout: 10_000,
      })
      const dest = new URL(page.url()).pathname
      expect(dest).toMatch(/\/(auth\/login|auth\/sign-up|auth)/)
    })
  }
})

test.describe('Cabinet — authenticated flows', () => {
  test.skip(!hasLiveAuth, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set')

  test.beforeEach(async ({ page }) => {
    // Sign in via the UI
    await page.goto('/auth/login')
    await page.locator('#email').fill(TEST_EMAIL)
    await page.locator('#password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Увійти' }).click()
    await page.waitForURL(url => url.pathname.startsWith('/cabinet'), {
      timeout: 15_000,
    })
  })

  test('dashboard loads with appointment list', async ({ page }) => {
    await page.goto('/cabinet')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('appointments page renders without error', async ({ page }) => {
    await page.goto('/cabinet/appointments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    // Should not show a generic error boundary
    await expect(page.getByText('Щось пішло не так')).not.toBeVisible()
  })

  test('profile page renders with user email', async ({ page }) => {
    await page.goto('/cabinet/profile')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    // Email field should show the logged-in user's email
    await expect(page.getByDisplayValue(TEST_EMAIL)).toBeVisible()
  })

  test('treatments page renders', async ({ page }) => {
    await page.goto('/cabinet/treatments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText('Щось пішло не так')).not.toBeVisible()
  })
})
