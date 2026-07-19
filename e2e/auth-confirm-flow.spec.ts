import { expect, test, type Page, type Route } from '@playwright/test'

const jsonHeaders = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
}

// Structurally valid JWT so supabase-js accepts the mocked session.
function fakeJwt(): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      sub: 'user-1',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'patient@example.com',
      session_id: 'session-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
    'e2e-signature',
  ].join('.')
}

const mockUser = {
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
}

function mockSession() {
  return {
    access_token: fakeJwt(),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'e2e-refresh-token',
    user: mockUser,
  }
}

async function fulfillOptions(route: Route): Promise<boolean> {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
    return true
  }
  return false
}

/** Counts verify calls; resolves them with a mocked session (or an error). */
async function mockVerify(
  page: Page,
  options: { expired?: boolean } = {}
): Promise<() => number> {
  let calls = 0

  await page.route('**/auth/v1/verify**', async route => {
    if (await fulfillOptions(route)) return
    calls += 1

    if (options.expired) {
      await route.fulfill({
        status: 403,
        headers: jsonHeaders,
        body: JSON.stringify({
          code: 403,
          error_code: 'otp_expired',
          msg: 'Email link is invalid or has expired',
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(mockSession()),
    })
  })

  return () => calls
}

test.describe('Click-gated /auth/confirm (prefetch-proof reset)', () => {
  test('GET renders the gate without consuming the token and scrubs the URL', async ({
    page,
  }) => {
    const verifyCalls = await mockVerify(page)

    await page.goto('/auth/confirm?token_hash=e2e-token&type=recovery')

    await expect(
      page.getByRole('button', { name: 'Підтвердити та продовжити' })
    ).toBeVisible()
    await expect(page.getByText('Відновлення пароля')).toBeVisible()

    // Token must be scrubbed from the address bar…
    await expect(page).toHaveURL('/auth/confirm')
    // …and, critically, a bare GET (mail-scanner prefetch) must not have
    // fired a single verify call.
    await page.waitForTimeout(400)
    expect(verifyCalls()).toBe(0)
  })

  test('full recovery: confirm click → set new password → login flash', async ({
    page,
  }) => {
    const verifyCalls = await mockVerify(page)

    await page.route('**/auth/v1/user**', async route => {
      if (await fulfillOptions(route)) return
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify(mockUser),
      })
    })
    let logoutCalls = 0
    await page.route('**/auth/v1/logout**', async route => {
      if (await fulfillOptions(route)) return
      logoutCalls += 1
      await route.fulfill({ status: 204, headers: jsonHeaders, body: '' })
    })

    await page.goto('/auth/confirm?token_hash=e2e-token&type=recovery')
    await page
      .getByRole('button', { name: 'Підтвердити та продовжити' })
      .click()

    await expect(page).toHaveURL('/auth/reset-password')
    expect(verifyCalls()).toBe(1)

    await page.locator('#password').fill('NewSecret123!')
    await page.locator('#confirmPassword').fill('NewSecret123!')
    await page.getByRole('button', { name: 'Оновити пароль' }).click()

    await expect(page).toHaveURL(/\/auth\/login\?passwordReset=success/)
    await expect(
      page.getByText('Пароль оновлено. Увійдіть з новим паролем.')
    ).toBeVisible()
    // The recovery session must be terminated before landing on login —
    // reaching the flash without a sign-out call would leave the user
    // silently authenticated with the one-time recovery session.
    expect(logoutCalls).toBe(1)
  })

  test('rejects an external `next` and falls back to the reset page', async ({
    page,
  }) => {
    await mockVerify(page)

    for (const evil of ['https://evil.example', '//evil.example']) {
      await page.goto(
        `/auth/confirm?token_hash=e2e-token&type=recovery&next=${encodeURIComponent(evil)}`
      )
      await page
        .getByRole('button', { name: 'Підтвердити та продовжити' })
        .click()

      // isSafeInternalPath must discard the external target: the user stays
      // on-origin and lands on the type-derived default, never on evil.example.
      await expect(page).toHaveURL('/auth/reset-password')
      await expect(page.locator('#password')).toBeVisible()
    }
  })

  test('expired token on click shows error with a request-new-link path', async ({
    page,
  }) => {
    await mockVerify(page, { expired: true })

    await page.goto('/auth/confirm?token_hash=used-token&type=recovery')
    await page
      .getByRole('button', { name: 'Підтвердити та продовжити' })
      .click()

    await expect(
      page.getByText(
        'Посилання недійсне або протерміноване. Запросіть нове посилання.'
      )
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Запросити нове посилання' })
    ).toBeVisible()
  })

  test('incomplete link shows invalid-link state, never calls verify', async ({
    page,
  }) => {
    const verifyCalls = await mockVerify(page)

    // Fully empty and both partial combinations: the gate requires
    // token_hash AND type, anything less is an invalid link.
    for (const url of [
      '/auth/confirm',
      '/auth/confirm?token_hash=only-token',
      '/auth/confirm?type=recovery',
    ]) {
      await page.goto(url)
      await expect(
        page.getByText(
          'Посилання пошкоджене або неповне. Запросіть нове посилання.'
        )
      ).toBeVisible()
    }
    expect(verifyCalls()).toBe(0)
  })
})

test.describe('Root forwarder + expired-link bounce', () => {
  test('token_hash landing on the site root is forwarded to the click gate', async ({
    page,
  }) => {
    const verifyCalls = await mockVerify(page)

    await page.goto('/?token_hash=e2e-token&type=recovery')

    await expect(page).toHaveURL('/auth/confirm')
    await expect(
      page.getByRole('button', { name: 'Підтвердити та продовжити' })
    ).toBeVisible()
    expect(verifyCalls()).toBe(0)
  })

  test('otp_expired error on /auth/callback lands on forgot-password with a notice', async ({
    page,
  }) => {
    await page.goto(
      '/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    )

    await expect(page).toHaveURL('/auth/forgot-password')
    await expect(
      page.getByText(
        'Термін дії посилання минув. Введіть email, щоб отримати нове.'
      )
    ).toBeVisible()
  })
})
