import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display hero section with CTA', async ({ page }) => {
    // Check hero heading
    await expect(page.getByText('Ваша посмішка')).toBeVisible()
    await expect(page.getByText('наша місія')).toBeVisible()
    
    // Check primary CTA button
    const ctaButton = page.getByRole('link', { name: /Записатися на консультацію/i })
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toHaveAttribute('href', '/booking')
  })

  test('should display features section', async ({ page }) => {
    await expect(page.getByText('Чому пацієнти обирають Dental Story')).toBeVisible()
    await expect(page.getByText('Комфортне лікування')).toBeVisible()
    await expect(page.getByText('Безпека та стерильність')).toBeVisible()
    await expect(page.getByText('Досвідчені лікарі')).toBeVisible()
    await expect(page.getByText('Сучасне обладнання')).toBeVisible()
  })

  test('should display services section with cards', async ({ page }) => {
    await expect(page.getByText('Наші послуги')).toBeVisible()
    await expect(page.getByText('Терапевтична стоматологія')).toBeVisible()
    await expect(page.getByText('Хірургічна стоматологія')).toBeVisible()
    await expect(page.getByText('Ортопедична стоматологія')).toBeVisible()
    await expect(page.getByText('Ортодонтія')).toBeVisible()
  })

  test('should display pricing section', async ({ page }) => {
    await expect(page.getByText('Прозорі ціни')).toBeVisible()
    await expect(page.getByText('Базовий огляд')).toBeVisible()
    await expect(page.getByText('Професійна гігієна')).toBeVisible()
    await expect(page.getByText('Комплексна діагностика')).toBeVisible()
  })

  test('should navigate to booking from hero CTA', async ({ page }) => {
    await page.getByRole('link', { name: /Записатися на консультацію/i }).click()
    await expect(page).toHaveURL('/booking')
  })

  test('should navigate to services from services button', async ({ page }) => {
    await page.getByRole('link', { name: /Всі послуги/i }).click()
    await expect(page).toHaveURL('/services')
  })

  test('should display trust indicators in hero', async ({ page }) => {
    await expect(page.getByText('Працюємо зараз')).toBeVisible()
    await expect(page.getByText('Гарантія якості')).toBeVisible()
    await expect(page.getByText('10+ років досвіду')).toBeVisible()
  })

  test('should display stats in hero card', async ({ page }) => {
    await expect(page.getByText('5000+')).toBeVisible()
    await expect(page.getByText('98%')).toBeVisible()
    await expect(page.getByText('10+ років')).toBeVisible()
  })
})

test.describe('Homepage - Navigation', () => {
  test('should have working header navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check all nav links exist
    await expect(page.getByRole('link', { name: 'Головна' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Послуги' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Про нас' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Галерея' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Контакти' })).toBeVisible()
  })

  test('should navigate to each page from header', async ({ page }) => {
    await page.goto('/')
    
    // Services
    await page.getByRole('link', { name: 'Послуги' }).click()
    await expect(page).toHaveURL('/services')
    
    // About
    await page.goto('/')
    await page.getByRole('link', { name: 'Про нас' }).click()
    await expect(page).toHaveURL('/about')
    
    // Contact
    await page.goto('/')
    await page.getByRole('link', { name: 'Контакти' }).click()
    await expect(page).toHaveURL('/contact')
  })

  test('should have phone number in header', async ({ page }) => {
    await page.goto('/')
    const phoneLink = page.getByRole('link', { name: /\+38/ })
    await expect(phoneLink).toBeVisible()
    await expect(phoneLink).toHaveAttribute('href', /tel:/)
  })
})

test.describe('Homepage - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Should have exactly one h1
    const h1s = await page.locator('h1').count()
    expect(h1s).toBe(1)
    
    // h2s should exist for sections
    const h2s = await page.locator('h2').count()
    expect(h2s).toBeGreaterThan(3)
  })

  test('should have skip link', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.getByText(/Перейти до основного/i)
    await expect(skipLink).toBeAttached()
  })

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header[role="banner"]')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })
})

test.describe('Homepage - Mobile', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /меню/i })
    await expect(menuButton).toBeVisible()
    
    // Desktop nav should be hidden
    const desktopNav = page.locator('nav.hidden.md\\:flex')
    await expect(desktopNav).toBeHidden()
  })

  test('should open mobile menu when clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await page.getByRole('button', { name: /Відкрити меню/i }).click()
    
    // Mobile menu should be visible
    await expect(page.locator('#mobile-menu')).toBeVisible()
  })
})
