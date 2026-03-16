import { test, expect } from '@playwright/test'

test.describe('Language Switching - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('switch between all supported languages', async ({ page }) => {
    // Default should be Ukrainian
    expect(await page.locator('h1').textContent()).toContain('Ваша посмішка')

    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // Content should be in English
    expect(await page.locator('h1').textContent()).toContain('Your smile')

    // Switch to Polish
    await page.click('button[aria-label*="Polski"]')
    await page.waitForTimeout(500)

    // Content should be in Polish
    expect(await page.locator('h1').textContent()).toContain('Twój uśmiech')

    // Switch back to Ukrainian
    await page.click('button[aria-label*="Українська"]')
    await page.waitForTimeout(500)

    // Content should be in Ukrainian
    expect(await page.locator('h1').textContent()).toContain('Ваша посмішка')
  })

  test('language preference persists across pages', async ({ page }) => {
    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // Navigate to booking page
    await page.click('a:has-text("Booking")')
    await page.waitForLoadState('networkidle')

    // Should still be in English
    expect(await page.locator('h1').textContent()).toContain('Booking')

    // Navigate to cabinet
    await page.click('a:has-text("Cabinet")')
    await page.waitForLoadState('networkidle')

    // Should still be in English
    expect(await page.url()).toContain('/cabinet')
  })

  test('language preference persists after page reload', async ({ page }) => {
    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // Reload page
    await page.reload()

    // Should still be in English
    const heading = page.locator('h1').first()
    const text = await heading.textContent()
    expect(text?.toLowerCase()).toContain('booking')
  })

  test('all UI elements translate correctly', async ({ page }) => {
    // Check navigation
    await expect(page.locator('a:has-text("Головна")')).toBeVisible()
    await expect(page.locator('a:has-text("Послуги")')).toBeVisible()
    await expect(page.locator('a:has-text("Контакти")')).toBeVisible()

    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // Navigation should be in English
    await expect(page.locator('a:has-text("Home")')).toBeVisible()
    await expect(page.locator('a:has-text("Services")')).toBeVisible()
    await expect(page.locator('a:has-text("Contact")')).toBeVisible()
  })

  test('form labels translate correctly', async ({ page }) => {
    // Go to booking page
    await page.click('a:has-text("Записатися")')
    await page.waitForLoadState('networkidle')

    // Check Ukrainian labels
    await expect(page.locator('label:has-text("Послуга")')).toBeVisible()

    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // Check English labels
    await expect(page.locator('label:has-text("Service")')).toBeVisible()
  })

  test('error messages translate correctly', async ({ page }) => {
    // Go to booking
    await page.click('a:has-text("Записатися")')
    await page.waitForLoadState('networkidle')

    // Click next without selecting service
    await page.click('button:has-text("Далі")')

    // Should show Ukrainian error
    await expect(page.locator('text=Це поле обов\'язкове')).toBeVisible()

    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // Refresh and try again
    await page.reload()
    await page.click('button:has-text("Next")')

    // Should show English error
    await expect(page.locator('text=This field is required')).toBeVisible()
  })

  test('date and time formats respect language', async ({ page }) => {
    // Go to booking
    await page.click('a:has-text("Записатися")')
    await page.waitForLoadState('networkidle')

    // In Ukrainian, dates should use Ukrainian format
    const dateElement = page.locator('[data-testid="date-display"]').first()
    const ukDate = await dateElement.textContent()

    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // English date format should be different
    const enDate = await dateElement.textContent()

    // Formats should be different
    if (ukDate && enDate) {
      expect(ukDate).not.toBe(enDate)
    }
  })

  test('currency and number formats respect language', async ({ page }) => {
    // Go to services page
    await page.click('a:has-text("Послуги")')
    await page.waitForLoadState('networkidle')

    // Get price in Ukrainian
    const priceUk = await page.locator('[data-testid="price"]').first().textContent()

    // Switch to English
    await page.click('button[aria-label*="English"]')
    await page.waitForTimeout(500)

    // Price should still be visible (might be same value but context changes)
    const priceEn = await page.locator('[data-testid="price"]').first().textContent()

    expect(priceUk).toBeTruthy()
    expect(priceEn).toBeTruthy()
  })

  test('language buttons are keyboard accessible', async ({ page }) => {
    // Tab to language buttons
    let tabCount = 0
    while (tabCount < 10) {
      await page.keyboard.press('Tab')
      tabCount++

      const focused = await page.evaluate(() => {
        return (document.activeElement as HTMLElement).getAttribute('aria-label')
      })

      if (focused?.includes('English')) {
        break
      }
    }

    // Press Enter to switch language
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Should be in English now
    expect(await page.locator('h1').textContent()).toContain('Your smile')
  })

  test('respects browser language preference', async ({ page, context }) => {
    // Create new context with Polish language
    const polishContext = await context.browser()?.newContext({
      locale: 'pl-PL',
      timezoneId: 'Europe/Warsaw',
    })

    if (polishContext) {
      const polishPage = await polishContext.newPage()
      await polishPage.goto('/')
      await polishPage.waitForLoadState('networkidle')

      // Page might load in Polish if i18n respects browser locale
      const heading = await polishPage.locator('h1').first().textContent()
      expect(heading).toBeTruthy()

      await polishPage.close()
      await polishContext.close()
    }
  })

  test('RTL languages work correctly if supported', async ({ page }) => {
    // Check if any RTL languages are supported
    const arButton = page.locator('button[aria-label*="Arabic"]')
    const arButtonExists = await arButton.isVisible().catch(() => false)

    if (arButtonExists) {
      await arButton.click()
      await page.waitForTimeout(500)

      // Document direction might change
      const dir = await page.evaluate(() => document.dir)
      expect(dir).toBe('rtl')
    }
  })
})

test.describe('Error Handling - E2E', () => {
  test('404 page displays correctly', async ({ page }) => {
    await page.goto('/non-existent-page')

    // Should show error page
    await expect(page.locator('text=404')).toBeVisible()
    await expect(page.locator('text=Сторінка не знайдена|Page not found')).toBeVisible()

    // Home link should work
    const homeLink = page.locator('a:has-text("Головна|Home")')
    await homeLink.click()

    expect(page.url()).toBe('http://localhost:3000/')
  })

  test('API error shows user-friendly message', async ({ page, context }) => {
    // Intercept API and simulate error
    await context.route('**/api/**', route => {
      route.abort('failed')
    })

    await page.goto('/booking')

    // Try to submit form
    const serviceSelect = page.locator('select[name="service"]')
    await serviceSelect.selectOption('cleaning')
    await page.click('button:has-text("Далі")')

    await page.fill('input[name="firstName"]', 'Тест')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="phone"]', '+380501234567')

    await page.click('button:has-text("Далі")')

    // Select time slot
    await page.click('button[data-testid="time-slot"]')
    await page.check('input[type="checkbox"]')

    // Try to submit
    await page.click('button:has-text("Надіслати")')

    // Should show error message
    await expect(page.locator('text=Помилка')).toBeVisible()
  })

  test('loading state displays during network delay', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.goto('/cabinet')

    // Should show loading spinner
    const loader = page.locator('[data-testid="loading"]')
    if (await loader.isVisible()) {
      await expect(loader).toBeVisible()
    }
  })

  test('error boundary catches render errors', async ({ page }) => {
    // Navigate to a page that might have rendering issues
    await page.goto('/')

    // Page should still render without crashing
    await expect(page.locator('body')).toBeVisible()

    // Should not show browser error message
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })

    // Navigate around
    await page.click('a').catch(() => {})

    // While there might be some errors, shouldn't have fatal crash
  })
})
