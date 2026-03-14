import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard - E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([{
      name: 'auth-token',
      value: 'test-token',
      url: 'http://localhost:3000',
      path: '/',
    }])

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
  })

  test('admin dashboard loads all widgets', async ({ page }) => {
    // Wait for all stat cards to load
    const statCards = page.locator('[data-testid="stat-card"]')
    await expect(statCards).toHaveCount(4)

    // Check stat values are displayed
    await expect(page.locator('text=Всього записів')).toBeVisible()
    await expect(page.locator('text=Сьогодні')).toBeVisible()
    await expect(page.locator('text=Звернень')).toBeVisible()
  })

  test('stat cards display metrics', async ({ page }) => {
    // Each stat card should have a number value
    const statValues = page.locator('[data-testid="stat-value"]')
    const count = await statValues.count()

    expect(count).toBeGreaterThan(0)

    // Verify metrics are numbers
    for (let i = 0; i < count; i++) {
      const value = await statValues.nth(i).textContent()
      expect(/\d+/.test(value || '')).toBeTruthy()
    }
  })

  test('charts render correctly', async ({ page }) => {
    // Area chart should be visible
    await expect(page.locator('[data-testid="appointments-chart"]')).toBeVisible()

    // Pie chart for services
    await expect(page.locator('[data-testid="services-pie-chart"]')).toBeVisible()

    // Wait for chart animation
    await page.waitForTimeout(1000)
  })

  test('navigation links work', async ({ page }) => {
    // Click on appointments stat
    await page.click('a:has-text("Записи")')
    expect(page.url()).toContain('/admin/appointments')

    // Go back
    await page.goBack()

    // Click on doctors
    await page.click('a:has-text("Лікарі")')
    expect(page.url()).toContain('/admin/doctors')
  })

  test('header controls work', async ({ page }) => {
    // Check for logout button
    const logoutButton = page.locator('button:has-text("Вийти")')
    await expect(logoutButton).toBeVisible()

    // Check for settings button
    const settingsButton = page.locator('button[aria-label*="Налаштування"]')
    await expect(settingsButton).toBeVisible()
  })

  test('today appointments list shows correct data', async ({ page }) => {
    const appointmentsList = page.locator('[data-testid="today-appointments"]')
    await expect(appointmentsList).toBeVisible()

    // If there are appointments, verify structure
    const appointments = page.locator('[data-testid="appointment-item"]')
    const count = await appointments.count()

    if (count > 0) {
      // Each appointment should have patient name, service, time, status
      const firstAppointment = appointments.first()
      await expect(firstAppointment.locator('[data-testid="patient-name"]')).toBeVisible()
      await expect(firstAppointment.locator('[data-testid="appointment-time"]')).toBeVisible()
      await expect(firstAppointment.locator('[data-testid="appointment-status"]')).toBeVisible()
    }
  })

  test('service distribution pie chart displays legend', async ({ page }) => {
    const legend = page.locator('[data-testid="services-legend"]')
    await expect(legend).toBeVisible()

    // Check for legend items
    const legendItems = page.locator('[data-testid="legend-item"]')
    const count = await legendItems.count()

    expect(count).toBeGreaterThan(0)
  })

  test('quick action buttons navigate correctly', async ({ page }) => {
    // Click appointments quick action
    await page.click('a[href="/admin/appointments"]')
    expect(page.url()).toContain('/admin/appointments')

    // Go back to dashboard
    await page.goBack()

    // Click contacts quick action
    await page.click('a[href="/admin/contacts"]')
    expect(page.url()).toContain('/admin/contacts')
  })

  test('responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Dashboard should still be usable
    const statCards = page.locator('[data-testid="stat-card"]')
    await expect(statCards).toHaveCount(4)

    // Stats should be stacked vertically
    const cards = await statCards.all()
    if (cards.length > 0) {
      const firstCard = cards[0]
      const box = await firstCard.boundingBox()
      expect(box?.width).toBeLessThan(375)
    }
  })

  test('update button refreshes data', async ({ page }) => {
    const lastUpdatedTime = await page.locator('[data-testid="last-updated"]').textContent()

    // Click refresh button
    await page.click('button[aria-label*="обновить|Refresh"]')

    // Wait for refresh
    await page.waitForTimeout(1000)

    // Time should have updated
    const newUpdatedTime = await page.locator('[data-testid="last-updated"]').textContent()
    expect(newUpdatedTime).not.toBe(lastUpdatedTime)
  })

  test('handles loading state', async ({ page, context }) => {
    // Slow down network
    await context.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.reload()

    // Should show loading indicators
    const loaders = page.locator('[data-testid="loading"]')
    expect(await loaders.count()).toBeGreaterThan(0)
  })

  test('accessibility - keyboard navigation', async ({ page }) => {
    // Tab through stat cards
    await page.keyboard.press('Tab')

    // Verify focus is visible
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      return !!el && el.getAttribute('data-testid')?.includes('stat')
    })

    // Focus should be on an interactive element
    expect(focused).toBeTruthy()
  })

  test('accessibility - screen reader support', async ({ page }) => {
    // Check for proper ARIA labels
    const statCards = page.locator('[data-testid="stat-card"]')
    
    for (let i = 0; i < await statCards.count(); i++) {
      const card = statCards.nth(i)
      const ariaLabel = await card.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})
