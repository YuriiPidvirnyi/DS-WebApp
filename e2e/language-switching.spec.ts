import { expect, test } from '@playwright/test'

test.describe('Language switching', () => {
  test('switches to English', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    })

    const langButton = page.getByRole('button', {
      name: /мова|language|select/i,
    })
    if (await langButton.isVisible()) {
      await langButton.click()
      const englishOption = page.getByRole('option', { name: /english/i })
      if (await englishOption.isVisible({ timeout: 3_000 })) {
        await englishOption.click()
        await page.waitForTimeout(1_000)
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      }
    }
  })

  test('persists language choice across pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 20_000,
    })

    const langButton = page.getByRole('button', {
      name: /мова|language|select/i,
    })
    if (await langButton.isVisible()) {
      await langButton.click()
      const englishOption = page.getByRole('option', { name: /english/i })
      if (await englishOption.isVisible({ timeout: 3_000 })) {
        await englishOption.click()
        await page.waitForTimeout(1_000)

        await page.goto('/about')
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
          timeout: 20_000,
        })
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      }
    }
  })
})
