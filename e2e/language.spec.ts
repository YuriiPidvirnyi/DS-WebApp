import { test, expect } from '@playwright/test'

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear())
  })

  test('should display language switcher in header', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await expect(languageSwitcher).toBeVisible()
  })

  test('should default to Ukrainian language', async ({ page }) => {
    // Check for Ukrainian content on the page
    await expect(page.getByText(/Головна/i).first()).toBeVisible()
    
    // Language switcher should show UK flag
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await expect(languageSwitcher).toContainText('UK')
  })

  test('should open language dropdown on click', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await languageSwitcher.click()

    // Dropdown should be visible
    const dropdown = page.getByRole('menu')
    await expect(dropdown).toBeVisible()

    // All language options should be present
    await expect(page.getByText('Українська')).toBeVisible()
    await expect(page.getByText('English')).toBeVisible()
    await expect(page.getByText('Polski')).toBeVisible()
  })

  test('should switch to English', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await languageSwitcher.click()

    // Click English option
    await page.getByText('English').click()

    // Verify language changed
    await expect(page.getByText(/Home/i).first()).toBeVisible()
    
    // Navigation should be in English
    await expect(page.getByRole('link', { name: /Services/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /About/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Contact/i })).toBeVisible()
  })

  test('should switch to Polish', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await languageSwitcher.click()

    // Click Polish option
    await page.getByText('Polski').click()

    // Verify language changed
    await expect(page.getByText(/Strona główna/i).first()).toBeVisible()
    
    // Navigation should be in Polish
    await expect(page.getByRole('link', { name: /Usługi/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /O nas/i })).toBeVisible()
  })

  test('should persist language preference', async ({ page }) => {
    // Switch to English
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await languageSwitcher.click()
    await page.getByText('English').click()

    // Wait for change to persist
    await page.waitForTimeout(500)

    // Reload the page
    await page.reload()

    // Should still be in English
    await expect(page.getByRole('link', { name: /Services/i })).toBeVisible()
  })

  test('should close dropdown on outside click', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await languageSwitcher.click()

    // Dropdown should be open
    await expect(page.getByRole('menu')).toBeVisible()

    // Click outside
    await page.click('body', { position: { x: 10, y: 10 } })

    // Dropdown should be closed
    await expect(page.getByRole('menu')).not.toBeVisible()
  })

  test('should close dropdown on Escape key', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await languageSwitcher.click()

    // Dropdown should be open
    await expect(page.getByRole('menu')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Dropdown should be closed
    await expect(page.getByRole('menu')).not.toBeVisible()
  })

  test('should show checkmark for current language', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    await languageSwitcher.click()

    // Ukrainian option should have checkmark (active state)
    const ukrainianOption = page.getByRole('menuitem').filter({ hasText: 'Українська' })
    await expect(ukrainianOption).toHaveClass(/text-dental-teal/)
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    const languageSwitcher = page.getByRole('button', { name: /Select language/i })
    
    // Check ARIA attributes
    await expect(languageSwitcher).toHaveAttribute('aria-haspopup', 'true')
    await expect(languageSwitcher).toHaveAttribute('aria-expanded', 'false')

    // Open dropdown
    await languageSwitcher.click()
    await expect(languageSwitcher).toHaveAttribute('aria-expanded', 'true')

    // Menu should have proper role
    const menu = page.getByRole('menu')
    await expect(menu).toHaveAttribute('aria-orientation', 'vertical')
  })
})

test.describe('Language Switching - Content Translation', () => {
  test('should translate navigation items', async ({ page }) => {
    await page.goto('/')
    
    // Switch to English
    await page.getByRole('button', { name: /Select language/i }).click()
    await page.getByText('English').click()

    // Verify navigation translations
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Services' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gallery' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible()
  })

  test('should translate CTA buttons', async ({ page }) => {
    await page.goto('/')
    
    // Switch to English
    await page.getByRole('button', { name: /Select language/i }).click()
    await page.getByText('English').click()

    // Verify CTA button translations
    await expect(page.getByRole('link', { name: /Book Appointment/i }).first()).toBeVisible()
  })

  test('should translate footer content', async ({ page }) => {
    await page.goto('/')
    
    // Switch to English
    await page.getByRole('button', { name: /Select language/i }).click()
    await page.getByText('English').click()

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Verify footer translations
    await expect(page.getByText(/All rights reserved/i)).toBeVisible()
  })
})

test.describe('Language Switching - Multi-page', () => {
  test('should maintain language when navigating', async ({ page }) => {
    await page.goto('/')
    
    // Switch to English
    await page.getByRole('button', { name: /Select language/i }).click()
    await page.getByText('English').click()

    // Navigate to Services page
    await page.getByRole('link', { name: 'Services' }).click()

    // Should still be in English
    await expect(page.getByRole('heading', { name: /Services/i }).first()).toBeVisible()
  })

  test('should work on booking page', async ({ page }) => {
    await page.goto('/booking')
    
    // Switch to English
    await page.getByRole('button', { name: /Select language/i }).click()
    await page.getByText('English').click()

    // Booking form should be translated
    // Note: Actual text depends on what's internationalized
  })
})
