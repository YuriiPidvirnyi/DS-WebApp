import { test, expect } from '@playwright/test'

test.describe('Booking Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking')
    await page.waitForLoadState('networkidle')
  })

  test('complete booking flow from start to finish', async ({ page }) => {
    // Step 1: Select service
    const serviceSelect = page.locator('select[name="service"]')
    await serviceSelect.selectOption('cleaning')
    expect(await serviceSelect.inputValue()).toBe('cleaning')

    // Click next
    await page.click('button:has-text("Далі")')

    // Step 2: Fill personal details
    await page.fill('input[name="firstName"]', 'Іван')
    await page.fill('input[name="lastName"]', 'Петренко')
    await page.fill('input[name="email"]', 'ivan@example.com')
    await page.fill('input[name="phone"]', '+380501234567')

    // Click next
    await page.click('button:has-text("Далі")')

    // Step 3: Select time slot
    const timeSlots = page.locator('button[data-testid="time-slot"]')
    const firstSlot = timeSlots.first()
    await firstSlot.click()

    // Accept terms
    await page.check('input[type="checkbox"]')

    // Submit form
    await page.click('button:has-text("Надіслати заявку")')

    // Verify success message
    await expect(page.locator('text=Заявку успішно надіслано')).toBeVisible()

    // Verify redirect after delay
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/booking/success')
  })

  test('validate email on blur', async ({ page }) => {
    // Go to personal info step
    await page.click('button:has-text("Далі")')

    const emailInput = page.locator('input[name="email"]')
    await emailInput.fill('invalid-email')
    await emailInput.blur()

    // Check for validation error
    await expect(page.locator('text=Невірний формат email')).toBeVisible()
  })

  test('validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    const nextButton = page.locator('button:has-text("Далі")').first()
    await nextButton.click()

    // Should show validation error
    await expect(page.locator('text=Це поле обов\'язкове')).toBeVisible()
  })

  test('navigate between steps', async ({ page }) => {
    // Go to next step
    await page.click('button:has-text("Далі")')

    // Verify we're on step 2
    await expect(page.locator('text=Особисті дані')).toBeVisible()

    // Go back
    await page.click('button:has-text("Назад")')

    // Verify we're back on step 1
    await expect(page.locator('text=Вибір послуги')).toBeVisible()
  })

  test('preserves data when navigating steps', async ({ page }) => {
    // Fill step 1
    const serviceSelect = page.locator('select[name="service"]')
    await serviceSelect.selectOption('cleaning')

    // Go to step 2
    await page.click('button:has-text("Далі")')
    await page.fill('input[name="firstName"]', 'Іван')

    // Go back
    await page.click('button:has-text("Назад")')

    // Service should still be selected
    expect(await serviceSelect.inputValue()).toBe('cleaning')

    // Go to step 2 again
    await page.click('button:has-text("Далі")')

    // Name should still be filled
    expect(await page.inputValue('input[name="firstName"]')).toBe('Іван')
  })

  test('time slots load dynamically', async ({ page }) => {
    const serviceSelect = page.locator('select[name="service"]')
    await serviceSelect.selectOption('consultation')

    // Go to next steps to reach time selection
    await page.click('button:has-text("Далі")')
    await page.fill('input[name="firstName"]', 'Тест')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button:has-text("Далі")')

    // Wait for time slots to load
    await page.waitForSelector('button[data-testid="time-slot"]')
    const slots = page.locator('button[data-testid="time-slot"]')
    const count = await slots.count()

    expect(count).toBeGreaterThan(0)
  })

  test('shows loading state during submission', async ({ page }) => {
    // Fill and submit form quickly
    const serviceSelect = page.locator('select[name="service"]')
    await serviceSelect.selectOption('cleaning')
    await page.click('button:has-text("Далі")')

    await page.fill('input[name="firstName"]', 'Іван')
    await page.fill('input[name="lastName"]', 'Петренко')
    await page.fill('input[name="email"]', 'ivan@example.com')
    await page.fill('input[name="phone"]', '+380501234567')
    await page.click('button:has-text("Далі")')

    const firstSlot = page.locator('button[data-testid="time-slot"]').first()
    await firstSlot.click()

    await page.check('input[type="checkbox"]')

    const submitButton = page.locator('button:has-text("Надіслати заявку")')
    await submitButton.click()

    // Check for loading state
    await expect(submitButton).toHaveAttribute('disabled')
  })

  test('handles API errors gracefully', async ({ page, context }) => {
    // Intercept API and simulate error
    await context.route('**/api/appointments', route => {
      route.abort('failed')
    })

    // Try to complete booking
    const serviceSelect = page.locator('select[name="service"]')
    await serviceSelect.selectOption('cleaning')
    await page.click('button:has-text("Далі")')

    await page.fill('input[name="firstName"]', 'Іван')
    await page.fill('input[name="lastName"]', 'Петренко')
    await page.fill('input[name="email"]', 'ivan@example.com')
    await page.fill('input[name="phone"]', '+380501234567')
    await page.click('button:has-text("Далі")')

    const firstSlot = page.locator('button[data-testid="time-slot"]').first()
    await firstSlot.click()

    await page.check('input[type="checkbox"]')
    await page.click('button:has-text("Надіслати заявку")')

    // Should show error message
    await expect(page.locator('text=Помилка')).toBeVisible()
  })

  test('supports all supported languages', async ({ page }) => {
    // Test Ukrainian
    expect(await page.locator('h1').textContent()).toContain('Запис')

    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.goto('/booking')

    // Should be in English
    expect(await page.locator('h1').textContent()).toContain('Booking')
  })

  test('accessibility - keyboard navigation', async ({ page }) => {
    const serviceSelect = page.locator('select[name="service"]')

    // Tab to service select
    await page.keyboard.press('Tab')
    await expect(serviceSelect).toBeFocused()

    // Open dropdown
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Should select an option
    expect(await serviceSelect.inputValue()).not.toBe('')
  })

  test('accessibility - screen reader text', async ({ page }) => {
    // Check for proper ARIA labels
    const form = page.locator('form')
    expect(await form.getAttribute('role')).toBe('form')

    // Steps should have proper labels
    const steps = page.locator('[data-testid="booking-step"]')
    expect(await steps.count()).toBe(3)

    steps.forEach(async (step, index) => {
      expect(await step.getAttribute('aria-label')).toContain('Крок')
    })
  })
})
