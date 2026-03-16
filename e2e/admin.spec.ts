import { test, expect } from '@playwright/test'

// Helper function to login to admin
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.fill('input[type="email"]', 'admin@dentalstory.ua')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin')
}

test.describe('Admin Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { name: /Вхід в систему/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Увійти/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/Невірний email або пароль/i')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/admin/login')
    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.getByRole('button', { name: /показати пароль|приховати пароль/i })
    
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display dashboard with stats cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByText(/Total Appointments/i)).toBeVisible()
    await expect(page.getByText(/Today's Appointments/i)).toBeVisible()
    await expect(page.getByText(/Total Patients/i)).toBeVisible()
    await expect(page.getByText(/Monthly Revenue/i)).toBeVisible()
  })

  test('should display sidebar navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Appointments/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Patients/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Services/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Analytics/i })).toBeVisible()
  })

  test('should highlight active navigation item', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i }).first()
    await expect(dashboardLink).toHaveClass(/bg-dental-teal/)
  })

  test('should navigate to patients page', async ({ page }) => {
    await page.getByRole('link', { name: /Patients/i }).click()
    await expect(page).toHaveURL(/\/admin\/patients/)
  })

  test('should display charts on dashboard', async ({ page }) => {
    await expect(page.getByText(/Weekly Appointments/i)).toBeVisible()
    await expect(page.getByText(/Weekly Revenue/i)).toBeVisible()
    await expect(page.getByText(/Popular Services/i)).toBeVisible()
  })

  test('should display today\'s schedule', async ({ page }) => {
    await expect(page.getByText(/Today's Schedule/i)).toBeVisible()
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
    await page.setViewportSize({ width: 375, height: 667 })
    const menuButton = page.getByRole('button').filter({ has: page.locator('svg') }).first()
    await expect(menuButton).toBeVisible()
  })

  test('should show system status indicator', async ({ page }) => {
    await expect(page.getByText(/System Online/i)).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    await page.getByRole('button', { name: /Вийти/i }).click()
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})

test.describe('Admin Dashboard - Data Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display trend indicators', async ({ page }) => {
    const trendIndicators = page.locator('text=/%/')
    const count = await trendIndicators.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should load dashboard without critical errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('Minified React error')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
