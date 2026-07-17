import { expect, test, type Page } from '@playwright/test'

const jsonHeaders = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
}

function mockSupabaseError(
  message: string,
  error = 'invalid_grant'
): Record<string, string> {
  return {
    error,
    error_description: message,
  }
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Увійти' }).click()
}

test.describe('Auth flows', () => {
  test('shows reset success flash on login page', async ({ page }) => {
    await page.goto('/auth/login?passwordReset=success')
    await expect(
      page.getByText('Пароль оновлено. Увійдіть з новим паролем.')
    ).toBeVisible()
  })

  test('maps invalid credentials login error', async ({ page }) => {
    await page.route('**/auth/v1/token**', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
        return
      }

      await route.fulfill({
        status: 400,
        headers: jsonHeaders,
        body: JSON.stringify(mockSupabaseError('Invalid login credentials')),
      })
    })

    await page.goto('/auth/login')
    await fillLoginForm(page, 'patient@example.com', 'wrong-pass')

    await expect(page.getByText('Невірний email або пароль')).toBeVisible()
  })

  test('maps unconfirmed email login error', async ({ page }) => {
    await page.route('**/auth/v1/token**', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
        return
      }

      await route.fulfill({
        status: 400,
        headers: jsonHeaders,
        body: JSON.stringify(mockSupabaseError('Email not confirmed')),
      })
    })

    await page.goto('/auth/login')
    await fillLoginForm(page, 'patient@example.com', 'Secret123!')

    await expect(
      page.getByText('Підтвердіть email, щоб увійти в акаунт.')
    ).toBeVisible()
  })

  test('sends forgot password request via the custom recover endpoint', async ({
    page,
  }) => {
    // The reset flow no longer calls Supabase's /auth/v1/recover (whose email
    // links to the token-burning /verify). It posts to our own /api/auth/recover
    // which mints the token server-side and emails a click-gated /auth/confirm
    // link. Assert the page drives that endpoint and shows success.
    let recoverBody = ''

    await page.route('**/api/auth/recover', async route => {
      recoverBody = route.request().postData() ?? ''
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/auth/forgot-password')
    await page.getByLabel('Email').fill('patient@example.com')
    await page.getByRole('button', { name: 'Надіслати посилання' }).click()

    await expect.poll(() => recoverBody).toContain('patient@example.com')
    await expect(page.getByText('Лист надіслано')).toBeVisible()
  })

  test('handles anti-enumeration signup response', async ({ page }) => {
    let signupPayload = ''
    let signupUrl = ''

    await page.route('**/auth/v1/signup**', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
        return
      }

      const payload = route.request().postDataJSON() as {
        email_redirect_to?: string
        emailRedirectTo?: string
      }
      signupUrl = decodeURIComponent(route.request().url())
      signupPayload = decodeURIComponent(
        payload.email_redirect_to ??
          payload.emailRedirectTo ??
          route.request().postData() ??
          ''
      )

      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          user: {
            id: 'user-1',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'patient@example.com',
            phone: '',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            identities: [],
          },
          session: null,
        }),
      })
    })

    await page.goto('/auth/sign-up')
    await page.locator('#firstName').fill('Іван')
    await page.locator('#lastName').fill('Тест')
    await page.locator('#phone').fill('671234567')
    await page.locator('#email').fill('patient@example.com')
    await page.locator('#password').fill('Secret123!')
    await page.locator('#confirmPassword').fill('Secret123!')
    await page.locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Зареєструватися' }).click()

    await expect
      .poll(() => `${signupPayload} ${signupUrl}`)
      .toContain('/auth/callback?next=/cabinet')
    await expect(page.getByText('Цей email вже зареєстрований')).toBeVisible()
  })

  test('shows invalid reset link state without recovery session', async ({
    page,
  }) => {
    await page.goto('/auth/reset-password')
    await expect(
      page.getByText(
        'Посилання недійсне або протерміноване. Запросіть нове посилання.'
      )
    ).toBeVisible()
  })

  test('shows callback error when code exchange fails', async ({ page }) => {
    await page.route('**/auth/v1/token**', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
        return
      }

      await route.fulfill({
        status: 400,
        headers: jsonHeaders,
        body: JSON.stringify(
          mockSupabaseError('Code exchange failed', 'invalid_request')
        ),
      })
    })

    await page.goto('/auth/callback?code=bad-code&next=/cabinet')

    await expect(
      page.getByText('Не вдалося завершити авторизацію. Спробуйте ще раз.')
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Перейти до входу' })
    ).toBeVisible()
  })
})
