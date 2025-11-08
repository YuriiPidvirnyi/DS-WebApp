import { test, expect } from '@playwright/test'

test.describe.skip('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
  })

  test('should display all contact information', async ({ page }) => {
    // Check if contact info is visible
    await expect(page.locator('text=/068 232 38 38/')).toBeVisible()
    await expect(page.locator('text=/info@dentalstory.ua/')).toBeVisible()
    await expect(page.locator('text=/вулиця Сумська, 10/')).toBeVisible()

    // Check working hours
    await expect(page.locator('text=/Пн-Пт: 09:00-21:00/')).toBeVisible()
    await expect(page.locator('text=/Сб: 09:00-18:00/')).toBeVisible()
  })

  test('should submit contact form', async ({ page }) => {
    // Fill the contact form
    await page.fill('input[name="name"]', 'Тестовий Користувач')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="phone"]', '+380501234567')
    await page.selectOption('select[name="subject"]', 'Консультація')
    await page.fill('textarea[name="message"]', 'Це тестове повідомлення')
    await page.check('input[name="consent"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Check success message
    await expect(
      page.locator('text=/успішно відправлено|дякуємо/i')
    ).toBeVisible()
  })

  test('should expand FAQ items', async ({ page }) => {
    // Find first FAQ item
    const faqButton = page
      .locator('button')
      .filter({ hasText: 'Чи потрібно записуватися заздалегідь?' })
      .first()
    await faqButton.click()

    // Check if answer is visible
    await expect(
      page.locator('text=/ми працюємо за попереднім записом/i')
    ).toBeVisible()

    // Click again to collapse
    await faqButton.click()

    // Check if answer is hidden
    await expect(
      page.locator('text=/ми працюємо за попереднім записом/i')
    ).not.toBeVisible()
  })

  test('should display Google Map', async ({ page }) => {
    // Check if map container exists
    const mapContainer = page.locator('#map, iframe[title*="карт"], .GoogleMap')
    await expect(mapContainer).toBeVisible()
  })

  test('should have working phone links', async ({ page }) => {
    const phoneLink = page.locator('a[href^="tel:"]').first()
    await expect(phoneLink).toBeVisible()
    await expect(phoneLink).toHaveAttribute('href', /tel:\+380/)
  })

  test('should have working email links', async ({ page }) => {
    const emailLink = page.locator('a[href^="mailto:"]').first()
    await expect(emailLink).toBeVisible()
    // Check href matches email pattern instead of hardcoded value
    const emailHref = await emailLink.getAttribute('href')
    expect(emailHref).toMatch(/^mailto:[\w.-]+@[\w.-]+\.\w+$/)
  })

  test('should show emergency contact info', async ({ page }) => {
    await expect(page.locator('text=/екстрена допомога/i')).toBeVisible()
    await expect(page.locator('text=/068 232 38 38/')).toBeVisible()
  })
})
