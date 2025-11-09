import { test, expect } from '@playwright/test'

/**
 * Visual regression tests for critical pages
 * Generates screenshots to catch unintended visual changes
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
  })

  test('Homepage - Desktop', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="hero-section"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Homepage - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="hero-section"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Services Page - Desktop', async ({ page }) => {
    await page.goto('/services')
    await page.waitForSelector('[data-testid="services-grid"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('services-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Services Page - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/services')
    await page.waitForSelector('[data-testid="services-grid"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('services-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('About Page - Desktop', async ({ page }) => {
    await page.goto('/about')
    await page.waitForSelector('[data-testid="about-content"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('about-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Gallery Page - Desktop', async ({ page }) => {
    await page.goto('/gallery')
    await page.waitForSelector('[data-testid="gallery-grid"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('gallery-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Contact Page - Desktop', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForSelector('[data-testid="contact-form"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('contact-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('Booking Modal', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Записатися")')
    await page.waitForSelector('[data-testid="booking-modal"]', {
      timeout: 5000,
    })
    await expect(page).toHaveScreenshot('booking-modal.png', {
      animations: 'disabled',
    })
  })

  test('Header - Scrolled State', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)
    const header = page.locator('header')
    await expect(header).toHaveScreenshot('header-scrolled.png', {
      animations: 'disabled',
    })
  })

  test('Footer', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer).toHaveScreenshot('footer.png', {
      animations: 'disabled',
    })
  })

  test('Service Card Hover State', async ({ page }) => {
    await page.goto('/services')
    const firstCard = page.locator('[data-testid="service-card"]').first()
    await firstCard.hover()
    await page.waitForTimeout(300)
    await expect(firstCard).toHaveScreenshot('service-card-hover.png', {
      animations: 'disabled',
    })
  })

  test('Contact Form Validation Error', async ({ page }) => {
    await page.goto('/contact')
    await page.click('button[type="submit"]')
    await page.waitForSelector('.error-message', { timeout: 2000 })
    await expect(page).toHaveScreenshot('contact-form-errors.png', {
      animations: 'disabled',
    })
  })

  test('Navigation Menu - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.click('[data-testid="mobile-menu-button"]')
    await page.waitForSelector('[data-testid="mobile-menu"]', { timeout: 2000 })
    await expect(page).toHaveScreenshot('mobile-menu-open.png', {
      animations: 'disabled',
    })
  })

  test('Language Switcher', async ({ page }) => {
    await page.goto('/')
    const languageSwitcher = page.locator('[data-testid="language-switcher"]')
    await expect(languageSwitcher).toHaveScreenshot('language-switcher.png', {
      animations: 'disabled',
    })
  })

  test('Dark Mode Toggle', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="theme-toggle"]')
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})

test.describe('Component Visual Tests', () => {
  test('Loading Spinner', async ({ page }) => {
    await page.goto('/')
    // Trigger loading state
    await page.evaluate(() => {
      const spinner = document.createElement('div')
      spinner.setAttribute('data-testid', 'loading-spinner')
      spinner.className =
        'animate-spin rounded-full h-12 w-12 border-b-2 border-primary'
      document.body.appendChild(spinner)
    })
    const spinner = page.locator('[data-testid="loading-spinner"]')
    await expect(spinner).toHaveScreenshot('loading-spinner.png', {
      animations: 'disabled',
    })
  })

  test('Success Toast', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const toast = document.createElement('div')
      toast.setAttribute('data-testid', 'success-toast')
      toast.className =
        'fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg'
      toast.textContent = 'Success! Your appointment has been booked.'
      document.body.appendChild(toast)
    })
    const toast = page.locator('[data-testid="success-toast"]')
    await expect(toast).toHaveScreenshot('success-toast.png', {
      animations: 'disabled',
    })
  })

  test('Error Toast', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const toast = document.createElement('div')
      toast.setAttribute('data-testid', 'error-toast')
      toast.className =
        'fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg'
      toast.textContent = 'Error! Something went wrong.'
      document.body.appendChild(toast)
    })
    const toast = page.locator('[data-testid="error-toast"]')
    await expect(toast).toHaveScreenshot('error-toast.png', {
      animations: 'disabled',
    })
  })
})

test.describe('Responsive Layout Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'desktop', width: 1920, height: 1080 },
  ]

  for (const viewport of viewports) {
    test(`Homepage - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.goto('/')
      await page.waitForSelector('[data-testid="hero-section"]', {
        timeout: 5000,
      })
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled',
      })
    })
  }
})
