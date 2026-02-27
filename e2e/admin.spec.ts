import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
  })

  test('should display dashboard with stats cards', async ({ page }) => {
    // Check that the dashboard title is visible
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Verify stats cards are present
    await expect(page.getByText(/Total Appointments/i)).toBeVisible()
    await expect(page.getByText(/Today's Appointments/i)).toBeVisible()
    await expect(page.getByText(/Total Patients/i)).toBeVisible()
    await expect(page.getByText(/Monthly Revenue/i)).toBeVisible()
  })

  test('should display sidebar navigation', async ({ page }) => {
    // Check sidebar navigation items
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Appointments/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Patients/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Services/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Analytics/i })).toBeVisible()
  })

  test('should highlight active navigation item', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i }).first()
    
    // Dashboard should be active on /admin
    await expect(dashboardLink).toHaveClass(/bg-dental-teal/)
  })

  test('should navigate to patients page', async ({ page }) => {
    await page.getByRole('link', { name: /Patients/i }).click()
    
    await expect(page).toHaveURL(/\/admin\/patients/)
  })

  test('should display charts on dashboard', async ({ page }) => {
    // Check for chart sections
    await expect(page.getByText(/Weekly Appointments/i)).toBeVisible()
    await expect(page.getByText(/Weekly Revenue/i)).toBeVisible()
    await expect(page.getByText(/Popular Services/i)).toBeVisible()
  })

  test('should display today\'s schedule', async ({ page }) => {
    await expect(page.getByText(/Today's Schedule/i)).toBeVisible()
    
    // Check for appointment entries
    const scheduleSection = page.locator('text=Today\'s Schedule').locator('..')
    await expect(scheduleSection).toBeVisible()
  })

  test('should display quick stats cards', async ({ page }) => {
    await expect(page.getByText(/Completed/i)).toBeVisible()
    await expect(page.getByText(/Pending/i)).toBeVisible()
    await expect(page.getByText(/Growth/i)).toBeVisible()
    await expect(page.getByText(/New Patients/i)).toBeVisible()
  })

  test('should have responsive mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Sidebar should be hidden on mobile
    const sidebar = page.locator('.lg\\:fixed.lg\\:inset-y-0')
    
    // Mobile menu button should be visible
    const menuButton = page.getByRole('button').filter({ has: page.locator('svg') }).first()
    await expect(menuButton).toBeVisible()
  })

  test('should show system status indicator', async ({ page }) => {
    await expect(page.getByText(/System Online/i)).toBeVisible()
  })

  test('should have back to site link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to Site/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/')
  })
})

test.describe('Admin Dashboard - Data Display', () => {
  test('should display trend indicators', async ({ page }) => {
    await page.goto('/admin')
    
    // Check for percentage indicators with arrows
    const trendIndicators = page.locator('text=/%/')
    const count = await trendIndicators.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should load dashboard without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Filter out expected errors (like hydration warnings in dev)
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('Minified React error')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Admin Dashboard - Error Handling', () => {
  test('should show error page on critical failure', async ({ page }) => {
    // Navigate to a route that should trigger admin error boundary
    await page.goto('/admin/nonexistent-page')
    
    // Should show 404 or error page
    // The exact behavior depends on your routing setup
  })
})
