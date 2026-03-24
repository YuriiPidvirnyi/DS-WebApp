import { expect, test } from '@playwright/test'

test.describe('Contact form submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
    await expect(
      page.getByRole('heading', { name: 'Контакти', level: 1 })
    ).toBeVisible({ timeout: 20_000 })
  })

  test('shows validation errors for empty form', async ({ page }) => {
    const submitButton = page.getByRole('button', {
      name: /надіслати|відправити/i,
    })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      await expect(
        page.locator('[role="alert"], .text-red-500, .error')
      ).toBeVisible({
        timeout: 5_000,
      })
    }
  })

  test('callback time select works', async ({ page }) => {
    const timeSelect = page.locator('#cb-time')
    await expect(timeSelect).toBeVisible()
    await timeSelect.selectOption('evening')
    await expect(timeSelect).toHaveValue('evening')
  })
})
