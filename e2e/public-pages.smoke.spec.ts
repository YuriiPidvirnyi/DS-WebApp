import { expect, test } from '@playwright/test'

test.describe('Public pages navigation and content', () => {
  test('homepage loads with hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('services page lists dental services', async ({ page }) => {
    await page.goto('/services')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('about page renders clinic info', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('contact page shows form and map', async ({ page }) => {
    await page.goto('/contact')
    await expect(
      page.getByRole('heading', { name: 'Контакти', level: 1 })
    ).toBeVisible({ timeout: 20_000 })
  })

  test('gallery page loads', async ({ page }) => {
    await page.goto('/gallery')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('reviews page displays approved reviews', async ({ page }) => {
    await page.goto('/reviews')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('booking page shows appointment form', async ({ page }) => {
    await page.goto('/booking')
    await expect(
      page.getByRole('heading', { name: 'Запис на прийом', level: 1 })
    ).toBeVisible({ timeout: 25_000 })
  })
})
