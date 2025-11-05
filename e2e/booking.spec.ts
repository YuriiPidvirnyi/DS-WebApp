import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking')
  })

  test('should complete booking form successfully', async ({ page }) => {
    // Step 1: Select service and date
    await page.selectOption(
      'select[name="service"]',
      'Терапевтична стоматологія'
    )
    await page.fill('input[name="date"]', '2024-12-01')
    await page.selectOption('select[name="time"]', '10:00')
    await page.selectOption('select[name="doctor"]', 'any')
    await page.click('button:has-text("Далі")')

    // Step 2: Fill personal information
    await page.fill('input[name="firstName"]', 'Тестовий')
    await page.fill('input[name="lastName"]', 'Користувач')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="phone"]', '+380501234567')
    await page.fill('input[name="dateOfBirth"]', '1990-01-01')
    await page.click('button:has-text("Далі")')

    // Step 3: Confirm and submit
    await page.check('input[name="consent"]')
    await page.click('button:has-text("Записатися")')

    // Verify success
    await expect(page).toHaveURL(/\/booking\/success/)
    await expect(page.locator('text=/Заявку успішно надіслано/')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button:has-text("Далі")')

    // Check for validation errors
    await expect(page.locator("text=/обов'язков/")).toBeVisible()
  })

  test('should allow doctor selection', async ({ page }) => {
    // Check that doctor dropdown is available
    const doctorSelect = page.locator('select[name="doctor"]')
    await expect(doctorSelect).toBeVisible()

    // Select a specific doctor
    await doctorSelect.selectOption('mykola-kovalchuk')
    await expect(doctorSelect).toHaveValue('mykola-kovalchuk')
  })

  test('should save draft automatically', async ({ page }) => {
    // Fill some fields
    await page.fill('input[name="firstName"]', 'Тест')
    await page.fill('input[name="lastName"]', 'Драфт')

    // Reload the page
    await page.reload()

    // Check if draft is restored
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Тест')
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Драфт')
  })
})
