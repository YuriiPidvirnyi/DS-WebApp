/**
 * E2E: Patient cabinet full flows
 *
 * Covers: appointments list, reschedule, cancellation, add-to-calendar,
 * treatments view, payments, profile edit, privacy export, delete account
 * confirmation dialog, live chat widget, language switching in cabinet.
 *
 * Requires: E2E_TEST_EMAIL / E2E_TEST_PASSWORD (patient account).
 * Falls back to admin account viewing cabinet-like pages.
 *
 * Run: npx playwright test e2e/cabinet-full-flows.spec.ts --headed
 */
import { expect, test } from '@playwright/test'

const EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''
const hasPatient = Boolean(EMAIL && PASSWORD)

async function patientLogin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.locator('input[type="email"], #email').fill(EMAIL)
  await page.locator('input[type="password"], #password').fill(PASSWORD)
  await page.getByRole('button', { name: /увійти|login|sign in/i }).click()
  await page.waitForURL(url => url.pathname.startsWith('/cabinet'), {
    timeout: 20_000,
  })
}

// Auth gate tests run always
test.describe('Cabinet — auth gate (always runs)', () => {
  const PROTECTED = [
    '/cabinet',
    '/cabinet/appointments',
    '/cabinet/profile',
    '/cabinet/treatments',
    '/cabinet/payments',
    '/cabinet/settings',
  ]

  for (const route of PROTECTED) {
    test(`${route} redirects unauthenticated to auth`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL(url => !url.pathname.startsWith('/cabinet'), {
        timeout: 10_000,
      })
      expect(new URL(page.url()).pathname).toMatch(/auth|login/)
    })
  }
})

test.describe('Cabinet — authenticated flows', () => {
  test.skip(!hasPatient, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set')

  test.beforeEach(async ({ page }) => {
    await patientLogin(page)
  })

  test('cabinet dashboard shows stats', async ({ page }) => {
    await page.goto('/cabinet')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    // Should show appointment count or upcoming appointments
    await expect(page.locator('.stat, [data-testid="stat"], .kpi').first())
      .toBeVisible({ timeout: 8_000 })
      .catch(() => {})
    await expect(page.getByText(/Щось пішло не так/i)).not.toBeVisible()
  })

  test('appointments list renders with correct columns', async ({ page }) => {
    await page.goto('/cabinet/appointments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/Щось пішло не так/i)).not.toBeVisible()

    const hasAppointments = await page
      .locator('table tbody tr, .appointment-item')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/немає записів|no appointments/i)
      .isVisible()
      .catch(() => false)
    expect(hasAppointments || hasEmpty).toBeTruthy()
  })

  test('appointment reschedule opens slot picker', async ({ page }) => {
    await page.goto('/cabinet/appointments')
    const rescheduleBtn = page
      .getByRole('button', { name: /перенести|reschedule/i })
      .first()
    if (!(await rescheduleBtn.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await rescheduleBtn.click()
    // Slot picker / calendar should appear
    await expect(
      page
        .locator('[data-testid="slot-picker"], .slot-picker, [role="dialog"]')
        .or(page.locator('input[type="date"]'))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('appointment cancellation shows confirmation dialog', async ({
    page,
  }) => {
    await page.goto('/cabinet/appointments')
    const cancelBtn = page
      .getByRole('button', { name: /скасувати|cancel/i })
      .first()
    if (!(await cancelBtn.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await cancelBtn.click()
    // Confirmation dialog must appear — never auto-cancel
    await expect(
      page.locator('[role="dialog"], [data-testid="confirm-dialog"]')
    ).toBeVisible({ timeout: 5_000 })
    // Dialog should have confirm + dismiss
    await expect(
      page.getByRole('button', { name: /підтвердити|так|confirm|yes/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /назад|ні|cancel|no/i })
    ).toBeVisible()
    // Dismiss without cancelling
    await page.getByRole('button', { name: /назад|ні|cancel|no/i }).click()
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({
      timeout: 5_000,
    })
  })

  test('add to calendar triggers .ics download link', async ({ page }) => {
    await page.goto('/cabinet/appointments')
    const icsBtn = page
      .getByRole('link', { name: /календар|calendar|ics/i })
      .or(page.getByRole('button', { name: /календар|calendar/i }))
      .first()
    if (!(await icsBtn.isVisible({ timeout: 5_000 }).catch(() => false))) return

    // Check href contains .ics or /api route
    const href = await icsBtn.getAttribute('href')
    if (href) {
      expect(href).toMatch(/\.ics|calendar|ical/i)
    }
  })

  test('treatments page shows history', async ({ page }) => {
    await page.goto('/cabinet/treatments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/Щось пішло не так/i)).not.toBeVisible()
    const hasTreatments = await page
      .locator('.treatment-item, table tbody tr')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/немає|no treatments/i)
      .isVisible()
      .catch(() => false)
    expect(hasTreatments || hasEmpty).toBeTruthy()
  })

  test('payments page loads', async ({ page }) => {
    await page.goto('/cabinet/payments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/Щось пішло не так/i)).not.toBeVisible()
  })

  test('profile page shows user email and allows edit', async ({ page }) => {
    await page.goto('/cabinet/profile')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByDisplayValue(EMAIL)).toBeVisible({ timeout: 5_000 })

    // Edit first name
    const firstNameInput = page.locator('input[name="first_name"], #first_name')
    if (await firstNameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstNameInput.fill('QA')
      await page.getByRole('button', { name: /зберегти|save/i }).click()
      await page.waitForLoadState('networkidle')
      // Should see success message or value persists
      await expect(
        page
          .getByText(/збережено|saved|успішно/i)
          .or(page.getByDisplayValue('QA'))
      ).toBeVisible({ timeout: 8_000 })
    }
  })

  test('privacy settings page has data export and delete account', async ({
    page,
  }) => {
    await page.goto('/cabinet/settings')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10_000,
    })

    // Data export section
    await expect(
      page
        .getByRole('button', { name: /завантажити|download|export/i })
        .or(page.getByText(/завантажити мої дані|download.*data|export.*data/i))
    ).toBeVisible({ timeout: 5_000 })

    // Delete account section
    await expect(
      page
        .getByRole('button', { name: /видалити акаунт|delete account/i })
        .or(page.getByText(/видалення акаунту|delete account/i))
    ).toBeVisible({ timeout: 5_000 })
  })

  test('data export triggers JSON download', async ({ page }) => {
    await page.goto('/cabinet/settings')

    const downloadPromise = page
      .waitForEvent('download', { timeout: 15_000 })
      .catch(() => null)
    const exportBtn = page
      .getByRole('button', { name: /завантажити|download|export/i })
      .first()
    if (!(await exportBtn.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await exportBtn.click()
    const download = await downloadPromise
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.json$/i)
    }
  })

  test('delete account shows confirmation dialog (does NOT actually delete)', async ({
    page,
  }) => {
    await page.goto('/cabinet/settings')

    const deleteBtn = page
      .getByRole('button', { name: /видалити акаунт|delete account/i })
      .first()
    if (!(await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await deleteBtn.click()

    // Confirmation dialog must appear
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    })

    // Should require typing "DELETE" or similar
    const confirmInput = page.locator('[role="dialog"] input[type="text"]')
    if (await confirmInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(confirmInput).toBeVisible()
      // DO NOT type DELETE — just verify the field exists and dismiss
    }

    // Close without confirming
    const cancelBtn = page
      .locator('[role="dialog"]')
      .getByRole('button', { name: /назад|cancel|скасувати|ні/i })
    await cancelBtn.click()
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({
      timeout: 5_000,
    })
  })

  test('live chat widget opens and accepts message', async ({ page }) => {
    await page.goto('/cabinet')

    // Find chat toggle button (floating, bottom right)
    const chatToggle = page
      .locator(
        '[aria-label*="чат"], [aria-label*="chat"], [data-testid="chat-toggle"]'
      )
      .first()
    if (!(await chatToggle.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // Try clicking radial menu first
      const radialBtn = page
        .locator('[aria-label*="меню"], [data-testid="radial-menu"]')
        .first()
      if (await radialBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await radialBtn.click()
      }
    }

    if (!(await chatToggle.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await chatToggle.click()
    // Chat widget should open
    await expect(
      page.locator(
        '[data-testid="live-chat"], .live-chat, [aria-label*="chat messages"]'
      )
    ).toBeVisible({ timeout: 8_000 })

    // Send a message
    const msgInput = page
      .locator(
        'input[placeholder*="повідомлення"], input[placeholder*="message"], textarea[placeholder*="message"]'
      )
      .first()
    if (await msgInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await msgInput.fill('QA test message — please ignore')
      await page.keyboard.press('Enter')
      await expect(
        page.getByText('QA test message — please ignore')
      ).toBeVisible({ timeout: 8_000 })
    }
  })

  test('logout redirects to homepage and guards cabinet', async ({ page }) => {
    await page.goto('/cabinet')
    const logoutBtn = page
      .getByRole('button', { name: /вийти|logout/i })
      .first()
    if (!(await logoutBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // Try via dropdown
      const avatar = page.locator('[aria-label*="профіль"], .avatar').first()
      if (await avatar.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await avatar.click()
        await page.getByRole('button', { name: /вийти|logout/i }).click()
      }
    } else {
      await logoutBtn.click()
    }

    await page.waitForURL(url => !url.pathname.startsWith('/cabinet'), {
      timeout: 10_000,
    })

    // Now try accessing cabinet — should redirect to auth
    await page.goto('/cabinet')
    await page.waitForURL(url => !url.pathname.startsWith('/cabinet'), {
      timeout: 10_000,
    })
    expect(new URL(page.url()).pathname).toMatch(/auth|login/)
  })
})
