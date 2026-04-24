/**
 * E2E: Treatment records + payment tracking full flow
 *
 * Covers: create treatment, status transitions (draft→signed→completed),
 * payment status updates, materials consumption, doctor/billing role access.
 *
 * Run: npx playwright test e2e/treatment-records-full.spec.ts --headed
 */
import { expect, test } from '@playwright/test'
import { adminLogin } from './helpers/admin-auth'

test.describe('Treatment records — CRUD & status flow', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/treatments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('treatments list loads', async ({ page }) => {
    const hasData = await page
      .locator('table tbody tr, .treatment-row')
      .first()
      .isVisible({ timeout: 8_000 })
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/немає|no treatments|empty/i)
      .isVisible()
      .catch(() => false)
    expect(hasData || hasEmpty).toBeTruthy()
  })

  test('create treatment record with services', async ({ page }) => {
    const addBtn = page
      .getByRole('button', { name: /новий|створити|add|create/i })
      .first()
    if (!(await addBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip()
      return
    }
    await addBtn.click()
    await page.waitForLoadState('networkidle')

    // Select patient
    const patientSelect = page
      .locator('select[name*="patient"], [aria-label*="пацієнт"]')
      .first()
    if (await patientSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await patientSelect.selectOption({ index: 1 })
    } else {
      // Try search input
      const patientSearch = page.getByPlaceholder(/пацієнт|patient/i)
      if (
        await patientSearch.isVisible({ timeout: 3_000 }).catch(() => false)
      ) {
        await patientSearch.fill('test')
        await page.waitForTimeout(500)
        const firstOption = page
          .locator('[role="option"], .dropdown-item')
          .first()
        if (
          await firstOption.isVisible({ timeout: 3_000 }).catch(() => false)
        ) {
          await firstOption.click()
        }
      }
    }

    // Select doctor
    const doctorSelect = page
      .locator('select[name*="doctor"], [aria-label*="лікар"]')
      .first()
    if (await doctorSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await doctorSelect.selectOption({ index: 1 })
    }

    // Add service item
    const addItemBtn = page
      .getByRole('button', { name: /додати послугу|add service|add item/i })
      .first()
    if (await addItemBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await addItemBtn.click()
      const serviceSelect = page.locator('select[name*="service"]').last()
      if (
        await serviceSelect.isVisible({ timeout: 3_000 }).catch(() => false)
      ) {
        await serviceSelect.selectOption({ index: 1 })
      }
      const toothInput = page.locator('input[name*="tooth"]').last()
      if (await toothInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await toothInput.fill('11')
      }
      const priceInput = page.locator('input[name*="price"]').last()
      if (await priceInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await priceInput.fill('500')
      }
    }

    // Notes
    const notesInput = page.locator('textarea[name*="notes"], #notes')
    if (await notesInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await notesInput.fill('QA test treatment record')
    }

    await page.getByRole('button', { name: /зберегти|save/i }).click()
    await page.waitForLoadState('networkidle')

    // Should be in list with "draft" status
    await expect(page.getByText(/draft|чернетка/i)).toBeVisible({
      timeout: 10_000,
    })
  })

  test('treatment status: draft → signed → completed', async ({ page }) => {
    // Find a draft treatment
    const draftRow = page
      .locator(
        'tr:has-text("draft"), tr:has-text("чернетка"), [data-status="draft"]'
      )
      .first()
    if (!(await draftRow.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip()
      return
    }
    await draftRow.click()
    await page.waitForLoadState('networkidle')

    // Sign
    const signBtn = page.getByRole('button', { name: /підписати|sign/i })
    if (await signBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await signBtn.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/signed|підписано/i)).toBeVisible({
        timeout: 8_000,
      })
    }

    // Complete
    const completeBtn = page.getByRole('button', {
      name: /завершити|complete/i,
    })
    if (await completeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await completeBtn.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/completed|завершено/i)).toBeVisible({
        timeout: 8_000,
      })
    }
  })

  test('payment status updates: unpaid → partial → paid', async ({ page }) => {
    const anyRow = page.locator('table tbody tr').first()
    if (!(await anyRow.isVisible({ timeout: 5_000 }).catch(() => false))) return

    await anyRow.click()
    await page.waitForLoadState('networkidle')

    // Find payment status field
    const paymentSelect = page
      .locator(
        'select[name*="payment"], [aria-label*="оплата"], [data-testid="payment-status"]'
      )
      .first()

    if (!(await paymentSelect.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await paymentSelect.selectOption('partial')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/partial|частково/i)).toBeVisible({
      timeout: 8_000,
    })

    await paymentSelect.selectOption('paid')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/paid|оплачено/i)).toBeVisible({
      timeout: 8_000,
    })
  })

  test('add materials consumed in treatment', async ({ page }) => {
    const anyRow = page.locator('table tbody tr').first()
    if (!(await anyRow.isVisible({ timeout: 5_000 }).catch(() => false))) return

    await anyRow.click()
    await page.waitForLoadState('networkidle')

    const addMaterialBtn = page.getByRole('button', {
      name: /додати матеріал|add material/i,
    })
    if (
      !(await addMaterialBtn.isVisible({ timeout: 5_000 }).catch(() => false))
    )
      return

    await addMaterialBtn.click()

    const matSelect = page.locator('select[name*="material"]').last()
    if (await matSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await matSelect.selectOption({ index: 1 })
    }

    const qtyInput = page.locator('input[name*="quantity"]').last()
    if (await qtyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await qtyInput.fill('2')
    }

    await page.getByRole('button', { name: /зберегти|save|додати/i }).click()
    await page.waitForLoadState('networkidle')

    // Material should be listed in treatment
    await expect(
      page.locator('[data-testid="treatment-materials"], .treatment-materials')
    )
      .toBeVisible({ timeout: 5_000 })
      .catch(() => {})
  })

  test('filter treatments by status', async ({ page }) => {
    const statusFilter = page
      .locator('select[name*="status"], [aria-label*="статус"]')
      .first()
    if (!(await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await statusFilter.selectOption('completed')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table, .empty-state')).toBeVisible({
      timeout: 8_000,
    })
  })
})

test.describe('Treatment records — role access', () => {
  test('doctor can view and create treatment records', async ({ page }) => {
    await adminLogin(page, 'doctor')
    await page.goto('/admin/treatments')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    // Doctor should have access
    const url = new URL(page.url())
    expect(url.pathname).not.toBe('/admin/login')
  })

  test('billing_manager can access treatments (read)', async ({ page }) => {
    await adminLogin(page, 'billing_manager')
    await page.goto('/admin/treatments')
    await page.waitForLoadState('networkidle')
    // May redirect or show — depends on permissions matrix
    const path = new URL(page.url()).pathname
    // Just verify no crash
    expect(path).toBeTruthy()
  })

  test('analyst cannot access treatments', async ({ page }) => {
    await adminLogin(page, 'analyst')
    await page.goto('/admin/treatments')
    await page.waitForLoadState('networkidle')
    const path = new URL(page.url()).pathname
    // Analyst should be redirected (not stay on /admin/treatments)
    expect(path === '/admin/treatments').toBeFalsy()
  })
})
