import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'

const INITIAL_PASSWORD = 'LiveLink123!'
const UPDATED_PASSWORD = 'LiveLink456!'
const E2E_AUTH_SECRET =
  process.env.E2E_AUTH_HELPERS_SECRET ?? 'local-e2e-auth-secret'

type GenerateLinkPayload = {
  type: 'signup' | 'recovery'
  email: string
  password?: string
  next?: string
}

type GenerateLinkResponse = {
  actionLink: string | null
  hashedToken: string | null
  redirectTo: string | null
  verificationType: string | null
  error?: string
}

type PreflightResponse = {
  enabled: boolean
  hasSupabaseConfig: boolean
  error?: string
}

async function acceptCookiesIfVisible(page: Page) {
  const acceptButton = page.getByRole('button', { name: 'Прийняти' })
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click()
  }
}

async function createAuthLink(
  request: APIRequestContext,
  payload: GenerateLinkPayload
): Promise<string> {
  const response = await request.post('/api/e2e/auth-links', {
    headers: {
      'x-e2e-auth-secret': E2E_AUTH_SECRET,
    },
    data: payload,
  })

  const body = (await response.json().catch(() => ({}))) as GenerateLinkResponse
  expect(
    response.ok(),
    `Failed to generate ${payload.type} link: ${response.status()} ${JSON.stringify(body)}`
  ).toBeTruthy()
  expect(
    body.actionLink,
    `${payload.type} link is missing actionLink`
  ).toBeTruthy()

  return body.actionLink as string
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login')
  await acceptCookiesIfVisible(page)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('form button[type="submit"]').click()
}

async function clearSession(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()
}

test('live email links: signup callback and recovery reset flow', async ({
  page,
  request,
}) => {
  const preflightResponse = await request.get('/api/e2e/auth-links', {
    headers: {
      'x-e2e-auth-secret': E2E_AUTH_SECRET,
    },
  })

  if (preflightResponse.status() === 404) {
    test.skip(true, 'E2E auth helper route is disabled')
  }

  const preflightBody = (await preflightResponse
    .json()
    .catch(() => ({}))) as PreflightResponse
  expect(
    preflightResponse.status(),
    `Preflight failed: ${preflightResponse.status()} ${JSON.stringify(preflightBody)}`
  ).toBe(200)

  if (!preflightBody.hasSupabaseConfig) {
    test.skip(
      true,
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for live email links'
    )
  }

  const id = Date.now()
  const email = `live.link.${id}@gmail.com`

  // 1) Generate real signup link and finish confirmation callback -> cabinet.
  const signupActionLink = await createAuthLink(request, {
    type: 'signup',
    email,
    password: INITIAL_PASSWORD,
    next: '/cabinet',
  })

  await page.goto(signupActionLink)
  await acceptCookiesIfVisible(page)
  await expect(page).toHaveURL(/\/cabinet/, { timeout: 25_000 })

  // 2) Generate real recovery link and reset to a new password.
  await clearSession(page)

  const recoveryActionLink = await createAuthLink(request, {
    type: 'recovery',
    email,
    next: '/auth/reset-password',
  })

  await page.goto(recoveryActionLink)
  await acceptCookiesIfVisible(page)
  await expect(page).toHaveURL(/\/auth\/reset-password/, { timeout: 25_000 })

  await page.locator('#password').fill(UPDATED_PASSWORD)
  await page.locator('#confirmPassword').fill(UPDATED_PASSWORD)
  await page.locator('form button[type="submit"]').click()

  await expect(page).toHaveURL(/\/auth\/login\?passwordReset=success/, {
    timeout: 20_000,
  })

  // 3) New password works.
  await login(page, email, UPDATED_PASSWORD)
  await expect(page).toHaveURL(/\/cabinet/, { timeout: 20_000 })

  // 4) Old password must fail.
  await clearSession(page)
  const invalidLoginResponsePromise = page
    .waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        response.url().includes('/auth/v1/token?grant_type=password'),
      { timeout: 20_000 }
    )
    .catch(() => null)

  await login(page, email, INITIAL_PASSWORD)

  const invalidLoginResponse = await invalidLoginResponsePromise
  expect(invalidLoginResponse?.status()).toBe(400)
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 })
})
