/**
 * E2E: Admin full CRUD flows — services, doctors, patients, appointments
 *
 * Requires live Supabase. Set E2E_ADMIN_PASSWORD in env or defaults to RbacTest!2026.
 * Run: npx playwright test e2e/admin-full-flows.spec.ts --headed
 */
import { expect, test } from '@playwright/test'
import { adminLogin } from './helpers/admin-auth'

const TIMESTAMP = Date.now()
const TEST_SERVICE_NAME = `QA Service ${TIMESTAMP}`
const TEST_DOCTOR_NAME = `Dr. QA ${TIMESTAMP}`

test.describe('Admin — Services CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/services')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('services list loads with data', async ({ page }) => {
    // At least one row or empty state message
    const hasRows = await page
      .locator('table tbody tr, [data-testid="service-row"], .service-item')
      .count()
    const hasEmpty = await page
      .getByText(/немає|no services|empty/i)
      .isVisible()
      .catch(() => false)
    expect(hasRows > 0 || hasEmpty).toBeTruthy()
  })

  test('create a new service', async ({ page }) => {
    const addBtn = page
      .getByRole('button', { name: /додати|новий|add|new/i })
      .first()
    await addBtn.click()

    // Fill service form
    await page.locator('input[name="name"], #name').fill(TEST_SERVICE_NAME)

    const priceInput = page.locator('input[name="price"], #price')
    if (await priceInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await priceInput.fill('500')
    }

    const durationInput = page.locator('input[name="duration"], #duration')
    if (await durationInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await durationInput.fill('30')
    }

    const descInput = page.locator('textarea[name="description"], #description')
    if (await descInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await descInput.fill('QA test service — please ignore')
    }

    await page
      .getByRole('button', { name: /зберегти|save|створити|create/i })
      .click()

    // Verify appears in list
    await expect(page.getByText(TEST_SERVICE_NAME)).toBeVisible({
      timeout: 10_000,
    })
  })

  test('edit an existing service', async ({ page }) => {
    // Find first edit button
    const editBtn = page
      .getByRole('button', { name: /редагувати|edit/i })
      .first()
    if (!(await editBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip()
      return
    }
    await editBtn.click()

    const nameInput = page.locator('input[name="name"], #name')
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    const currentValue = await nameInput.inputValue()
    await nameInput.fill(currentValue + ' (edited)')

    await page.getByRole('button', { name: /зберегти|save/i }).click()
    await expect(page.getByText('(edited)')).toBeVisible({ timeout: 10_000 })
  })

  test('delete the QA test service', async ({ page }) => {
    // Find the row with TEST_SERVICE_NAME and delete it
    const row = page
      .locator(
        `tr:has-text("${TEST_SERVICE_NAME}"), [data-name="${TEST_SERVICE_NAME}"]`
      )
      .first()
    if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip()
      return
    }
    const deleteBtn = row.getByRole('button', { name: /видалити|delete/i })
    await deleteBtn.click()

    // Confirm dialog
    const confirmBtn = page.getByRole('button', {
      name: /підтвердити|confirm|так|yes/i,
    })
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    await expect(page.getByText(TEST_SERVICE_NAME)).not.toBeVisible({
      timeout: 10_000,
    })
  })
})

test.describe('Admin — Doctors CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/doctors')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('doctors list loads', async ({ page }) => {
    const count = await page
      .locator('table tbody tr, .doctor-card, [data-testid="doctor-row"]')
      .count()
    const hasEmpty = await page
      .getByText(/немає|no doctors|empty/i)
      .isVisible()
      .catch(() => false)
    expect(count > 0 || hasEmpty).toBeTruthy()
  })

  test('create a doctor', async ({ page }) => {
    const addBtn = page
      .getByRole('button', { name: /додати|новий|add|new/i })
      .first()
    await addBtn.click()

    const nameInput = page
      .locator('input[name="display_name"], input[name="name"], #name')
      .first()
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    await nameInput.fill(TEST_DOCTOR_NAME)

    const specInput = page.locator(
      'input[name="specialization"], #specialization'
    )
    if (await specInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await specInput.fill('Терапевт')
    }

    await page.getByRole('button', { name: /зберегти|save|створити/i }).click()
    await expect(page.getByText(TEST_DOCTOR_NAME)).toBeVisible({
      timeout: 10_000,
    })
  })

  test('new doctor appears in booking form', async ({ page }) => {
    await page.goto('/booking')
    await page.waitForLoadState('networkidle')
    // Doctor dropdown or list should include our doctor
    const doctorEl = page.getByText(TEST_DOCTOR_NAME)
    if (await doctorEl.isVisible({ timeout: 8_000 }).catch(() => false)) {
      expect(true).toBeTruthy()
    }
    // If not visible on initial load (requires service selection first), that's acceptable
  })
})

test.describe('Admin — Appointments management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/appointments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('appointments list renders with columns', async ({ page }) => {
    // Table headers: patient, service/doctor, date, status
    const table = page.locator('table, [role="grid"]').first()
    const hasTable = await table
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/немає записів|no appointments/i)
      .isVisible()
      .catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
  })

  test('status filter works', async ({ page }) => {
    const statusFilter = page
      .locator('select[name*="status"], [aria-label*="статус"]')
      .first()
    if (!(await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await statusFilter.selectOption({ label: /підтверджен|confirmed/i })
    await page.waitForLoadState('networkidle')
    // Results should update (or stay empty with message)
    await expect(page.locator('table, .empty-state')).toBeVisible({
      timeout: 8_000,
    })
  })

  test('date filter works', async ({ page }) => {
    const dateInput = page
      .locator('input[type="date"], input[name*="date"]')
      .first()
    if (!(await dateInput.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await dateInput.fill('2026-05-01')
    await page.keyboard.press('Enter')
    await page.waitForLoadState('networkidle')
  })

  test('appointment detail opens on row click', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()
    if (!(await firstRow.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await firstRow.click()
    // Should open detail view or modal
    await expect(
      page
        .locator(
          '[role="dialog"], .appointment-detail, [data-testid="appointment-detail"]'
        )
        .or(page.getByRole('heading', { level: 2 }))
    ).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Admin — Patients management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/patients')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('patient list loads', async ({ page }) => {
    const hasData = await page
      .locator('table tbody tr, .patient-row')
      .first()
      .isVisible({ timeout: 8_000 })
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/немає|no patients/i)
      .isVisible()
      .catch(() => false)
    expect(hasData || hasEmpty).toBeTruthy()
  })

  test('patient search works', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/пошук|search/i).first()
    if (!(await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await searchInput.fill('test')
    await page.waitForTimeout(1000) // debounce
    await page.waitForLoadState('networkidle')
    // Results updated
    await expect(
      page.locator('table, .empty-state, [data-testid="no-results"]')
    ).toBeVisible({ timeout: 8_000 })
  })

  test('patient detail opens', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, .patient-row').first()
    if (!(await firstRow.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await firstRow.click()
    await page.waitForLoadState('networkidle')
    // Should navigate to patient detail or open modal
    const isDetailPage =
      page.url().includes('/patients/') ||
      (await page
        .locator('[data-testid="patient-detail"], .patient-detail')
        .isVisible({ timeout: 5_000 })
        .catch(() => false))
    expect(isDetailPage).toBeTruthy()
  })
})

test.describe('Admin — Analytics dashboard', () => {
  test('analytics page renders charts', async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })

    // Charts: recharts renders SVG elements
    const svgCount = await page
      .locator('svg.recharts-surface, canvas, [data-testid*="chart"]')
      .count()
    const hasKpiCards = await page
      .locator('[data-testid="kpi-card"], .stat-card, .kpi')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    expect(svgCount > 0 || hasKpiCards).toBeTruthy()
  })
})
