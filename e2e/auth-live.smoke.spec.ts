import { expect, test, type Page } from '@playwright/test'

type SignUpOutcome = 'cabinet' | 'sign-up-success' | 'unknown'

const PASSWORD = 'LiveSmoke123!'

interface ApiErrorPayload {
  code?: string
  message?: string
}

async function acceptCookiesIfVisible(page: Page) {
  const acceptButton = page.getByRole('button', { name: 'Прийняти' })
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click()
  }
}

async function waitForSignUpOutcome(page: Page): Promise<SignUpOutcome> {
  const timeoutAt = Date.now() + 25_000
  while (Date.now() < timeoutAt) {
    const url = page.url()
    if (url.includes('/cabinet')) return 'cabinet'
    if (url.includes('/auth/sign-up-success')) return 'sign-up-success'
    await page.waitForTimeout(300)
  }
  return 'unknown'
}

async function waitForPostLoginOutcome(
  page: Page
): Promise<'cabinet' | 'email-not-confirmed' | 'invalid' | 'other'> {
  const timeoutAt = Date.now() + 18_000
  while (Date.now() < timeoutAt) {
    const url = page.url()
    if (url.includes('/cabinet')) return 'cabinet'

    if (
      await page
        .getByText('Підтвердіть email, щоб увійти в акаунт.')
        .isVisible()
        .catch(() => false)
    ) {
      return 'email-not-confirmed'
    }

    if (
      await page
        .getByText('Невірний email або пароль')
        .isVisible()
        .catch(() => false)
    ) {
      return 'invalid'
    }

    await page.waitForTimeout(300)
  }
  return 'other'
}

test('live smoke: auth flow with real Supabase', async ({ page }) => {
  const id = Date.now()
  const smokeEmail = `live.smoke.${id}@gmail.com`

  // 1) Invalid login should show auth-level error, not "unavailable".
  await page.goto('/auth/login')
  await acceptCookiesIfVisible(page)
  await page.locator('#email').fill(`invalid.${id}@example.com`)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Увійти' }).click()

  await expect(page.getByText('Невірний email або пароль')).toBeVisible()
  await expect(
    page.getByText('Авторизація тимчасово недоступна')
  ).not.toBeVisible()

  // 2) Register a fresh user.
  await page.goto('/auth/sign-up')
  await acceptCookiesIfVisible(page)
  await page.locator('#firstName').fill('Live')
  await page.locator('#lastName').fill('Smoke')
  await page.locator('#phone').fill('671234567')
  await page.locator('#email').fill(smokeEmail)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('#confirmPassword').fill(PASSWORD)
  await page.locator('input[type="checkbox"]').check()

  const signUpResponsePromise = page
    .waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        response.url().includes('/auth/v1/signup'),
      { timeout: 20_000 }
    )
    .catch(() => null)

  await page.getByRole('button', { name: 'Зареєструватися' }).click()

  const signUpOutcome = await waitForSignUpOutcome(page)
  const signUpResponse = await signUpResponsePromise
  let signUpResponseDetails = 'No signup response captured'
  let signUpStatus = 0
  let signUpBody: ApiErrorPayload = {}
  if (signUpResponse) {
    signUpStatus = signUpResponse.status()
    try {
      const json = (await signUpResponse.json()) as ApiErrorPayload
      signUpBody = json
      signUpResponseDetails = `${signUpResponse.status()} ${JSON.stringify(json)}`
    } catch {
      signUpResponseDetails = `${signUpResponse.status()} ${await signUpResponse.text()}`
    }
  }

  const signUpRateLimited =
    signUpOutcome === 'unknown' &&
    signUpStatus === 429 &&
    signUpBody.code === 'over_email_send_rate_limit'

  if (signUpRateLimited) {
    // Live verification can hit Supabase email quotas in shared environments.
    // In this case we validate UX fallback and continue with the rest of auth smoke.
    await expect(
      page.getByText('Помилка реєстрації. Спробуйте пізніше.')
    ).toBeVisible()
    console.log(`SIGNUP_RATE_LIMITED: ${signUpResponseDetails}`)
  } else {
    expect(
      signUpOutcome,
      `Expected signup redirect to cabinet/sign-up-success. Response: ${signUpResponseDetails}`
    ).not.toBe('unknown')
  }

  if (signUpOutcome === 'cabinet' && !signUpRateLimited) {
    await expect(page).toHaveURL(/\/cabinet/)
    await page.getByRole('button', { name: 'Вийти' }).click()
    await expect(page).toHaveURL(/\/$/)
  } else if (signUpOutcome === 'sign-up-success') {
    await expect(page).toHaveURL(/\/auth\/sign-up-success/)
    await expect(page.getByText('Реєстрація успішна!')).toBeVisible()
  }

  // 3) Forgot password should accept request for this email.
  let recoverStatus = 0
  let recoverBody: ApiErrorPayload = {}
  const recoverResponsePromise = page
    .waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        response.url().includes('/auth/v1/recover'),
      { timeout: 20_000 }
    )
    .catch(() => null)

  await page.goto('/auth/forgot-password')
  await page.locator('#email').fill(smokeEmail)
  await page.getByRole('button', { name: 'Надіслати посилання' }).click()
  const recoverResponse = await recoverResponsePromise
  if (recoverResponse) {
    recoverStatus = recoverResponse.status()
    try {
      recoverBody = (await recoverResponse.json()) as ApiErrorPayload
    } catch {
      recoverBody = {}
    }
  }

  const recoverRateLimited =
    recoverStatus === 429 && recoverBody.code === 'over_email_send_rate_limit'

  if (recoverRateLimited) {
    await expect(
      page.getByText('Не вдалося надіслати лист. Спробуйте пізніше.')
    ).toBeVisible()
    console.log(
      `RECOVER_RATE_LIMITED: ${recoverStatus} ${JSON.stringify(recoverBody)}`
    )
  } else {
    await expect(page.getByText('Лист надіслано')).toBeVisible()
  }

  // 4) Direct reset page without recovery session should show invalid link state.
  await page.goto('/auth/reset-password')
  await expect(
    page.getByText(
      'Посилання недійсне або протерміноване. Запросіть нове посилання.'
    )
  ).toBeVisible()

  // 5) Callback with invalid code should show callback error state.
  await page.goto(`/auth/callback?code=invalid-${id}&next=/cabinet`)
  await expect(
    page.getByText('Не вдалося завершити авторизацію. Спробуйте ще раз.')
  ).toBeVisible()

  // 6) Login with just-created user: either lands in cabinet (auto-confirm)
  // or shows "email not confirmed" (email-confirm enabled).
  await page.goto('/auth/login')
  await page.locator('#email').fill(smokeEmail)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Увійти' }).click()

  const postLoginOutcome = await waitForPostLoginOutcome(page)
  if (signUpOutcome === 'unknown') {
    expect
      .soft(
        postLoginOutcome,
        'Signup did not complete, so post-login result is informational only.'
      )
      .toBe('invalid')
    return
  }

  expect(['cabinet', 'email-not-confirmed']).toContain(postLoginOutcome)

  if (postLoginOutcome === 'cabinet') {
    await page.getByRole('button', { name: 'Вийти' }).click()
    await expect(page).toHaveURL(/\/$/)
  }
})
