import { expect, test } from '@playwright/test'

/**
 * Браузерна перевірка ключових контролів (Select, LanguageSwitcher).
 * Запуск: npm run test:e2e:ui-smoke
 * Конфіг: playwright.auth.config.ts (dev + mock Supabase URL).
 */
test.describe('Public UI: selects & language', () => {
  test('contact: callback — Select часу змінює значення', async ({ page }) => {
    await page.goto('/contact')
    await expect(
      page.getByRole('heading', { name: 'Контакти', exact: true, level: 1 })
    ).toBeVisible({ timeout: 20_000 })

    const timeSelect = page.locator('#cb-time')
    await expect(timeSelect).toBeVisible()
    // Use toPass to retry select+assert until RHF hydration stops resetting the value
    await expect(async () => {
      await timeSelect.selectOption('evening')
      await expect(timeSelect).toHaveValue('evening')
    }).toPass({ timeout: 10_000 })
    await timeSelect.selectOption('morning')
    await expect(timeSelect).toHaveValue('morning')
  })

  test('booking: Select послуги та лікаря приймають вибір', async ({
    page,
  }) => {
    await page.goto('/booking')
    await expect(
      page.getByRole('heading', { name: 'Запис на прийом', level: 1 })
    ).toBeVisible({ timeout: 25_000 })

    const service = page.locator('#service')
    await expect(service).toBeVisible({ timeout: 25_000 })
    await service.selectOption({ label: 'Ендодонтія' })
    await expect(service).toHaveValue('Ендодонтія')

    const doctor = page.locator('#doctor')
    await expect(doctor).toBeVisible()
    await doctor.selectOption({ label: 'Ковальчук Микола Іванович' })
    await expect(doctor).toHaveValue('mykola-kovalchuk')
  })

  test('header: LanguageSwitcher — перехід на EN', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Обрати мову' }).click()
    await page.getByRole('option', { name: /English/i }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', {
      timeout: 15_000,
    })
  })
})
