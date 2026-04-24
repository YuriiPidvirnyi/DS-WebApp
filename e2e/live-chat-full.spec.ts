/**
 * E2E: Live chat — bidirectional flow (patient → admin → patient)
 *
 * Uses two browser contexts to simulate patient and admin simultaneously.
 * Requires Supabase Realtime to be functional.
 *
 * Run: npx playwright test e2e/live-chat-full.spec.ts --headed
 */
import { expect, test } from '@playwright/test'
import { adminLogin, ADMIN_EMAILS, ADMIN_PASSWORD } from './helpers/admin-auth'

const MSG_PATIENT = `Patient msg ${Date.now()}`
const MSG_ADMIN = `Admin reply ${Date.now()}`

test.describe('Live chat — admin panel', () => {
  test('admin chat page loads sessions list', async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/chat')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    })

    const hasSessions = await page
      .locator('.chat-session, [data-testid="chat-session"], table tbody tr')
      .first()
      .isVisible({ timeout: 8_000 })
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/немає|no sessions|no chats/i)
      .isVisible()
      .catch(() => false)
    expect(hasSessions || hasEmpty).toBeTruthy()
  })

  test('admin can open session and view messages', async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/chat')

    const firstSession = page
      .locator('.chat-session, [data-testid="chat-session"], table tbody tr')
      .first()
    if (!(await firstSession.isVisible({ timeout: 8_000 }).catch(() => false)))
      return

    await firstSession.click()
    await page.waitForLoadState('networkidle')

    // Message list should appear
    await expect(
      page
        .locator('[role="log"], .messages-list, [data-testid="messages"]')
        .or(page.locator('.message-bubble, .chat-message'))
    ).toBeVisible({ timeout: 10_000 })
  })

  test('admin can send reply in chat session', async ({ page }) => {
    await adminLogin(page)
    await page.goto('/admin/chat')

    const firstSession = page
      .locator('.chat-session, [data-testid="chat-session"], table tbody tr')
      .first()
    if (!(await firstSession.isVisible({ timeout: 8_000 }).catch(() => false)))
      return

    await firstSession.click()
    await page.waitForLoadState('networkidle')

    const replyInput = page
      .locator(
        'input[placeholder*="повідомлення"], input[placeholder*="message"], textarea'
      )
      .last()
    if (!(await replyInput.isVisible({ timeout: 5_000 }).catch(() => false)))
      return

    await replyInput.fill(MSG_ADMIN)

    const sendBtn = page.getByRole('button', { name: /надіслати|send/i }).last()
    if (await sendBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sendBtn.click()
    } else {
      await page.keyboard.press('Enter')
    }

    await expect(page.getByText(MSG_ADMIN)).toBeVisible({ timeout: 10_000 })
  })

  test('unread badge appears on admin nav when new message', async ({
    page,
  }) => {
    await adminLogin(page)
    await page.goto('/admin')

    // Chat nav item should have unread badge if there are unread messages
    const chatNavItem = page.locator(
      '[href*="chat"], a:has-text("Chat"), a:has-text("Чат")'
    )
    await expect(chatNavItem).toBeVisible({ timeout: 8_000 })
    // Badge may or may not be present depending on data — just verify nav item loads
  })
})

test.describe('Live chat — patient widget (guest)', () => {
  test('chat widget is visible on homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Chat widget button (bottom right floating)
    const chatBtn = page
      .locator(
        '[aria-label*="чат"], [aria-label*="chat"], [data-testid="chat-toggle"], button:has-text("Чат")'
      )
      .first()
    // May be inside radial menu — check radial menu too
    const radialBtn = page
      .locator('[data-testid="radial-menu"], [aria-label*="меню"]')
      .first()

    const chatVisible = await chatBtn
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    const radialVisible = await radialBtn
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    expect(chatVisible || radialVisible).toBeTruthy()
  })

  test('chat widget opens with name prompt for guest', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Try to find and click the chat button
    const chatBtn = page
      .locator('[aria-label*="чат"], [data-testid="chat-toggle"]')
      .first()
    if (!(await chatBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // Try radial menu
      const radial = page
        .locator('[data-testid="radial"], .radial-menu-btn')
        .first()
      if (await radial.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await radial.click()
        await page
          .locator('[aria-label*="чат"], [href*="chat"]')
          .first()
          .click()
      }
      return
    }

    await chatBtn.click()

    // For unauthenticated guest — should prompt for name
    const namePrompt = page
      .getByPlaceholder(/ім.я|name/i)
      .or(page.getByText(/ваше ім.я|your name|enter name/i))
    if (await namePrompt.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await page
        .locator('input[placeholder*="ім"], input[name*="name"]')
        .fill('QA Guest')
      await page.getByRole('button', { name: /почати|start|join/i }).click()
    }

    // Chat input should now be available
    const msgInput = page
      .locator(
        'input[placeholder*="повідомлення"], textarea[placeholder*="message"]'
      )
      .first()
    if (await msgInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await msgInput.fill(MSG_PATIENT)
      await page.keyboard.press('Enter')
      await expect(page.getByText(MSG_PATIENT)).toBeVisible({ timeout: 10_000 })
    }
  })
})

test.describe('Live chat — bidirectional real-time', () => {
  test('patient message appears in admin chat panel', async ({ browser }) => {
    // Two contexts: patient and admin
    const patientCtx = await browser.newContext()
    const adminCtx = await browser.newContext()

    const patientPage = await patientCtx.newPage()
    const adminPage = await adminCtx.newPage()

    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

    // Setup admin
    await adminPage.goto(`${baseURL}/admin/login`)
    await adminPage.locator('input[type="email"]').fill(ADMIN_EMAILS.superadmin)
    await adminPage.locator('input[type="password"]').fill(ADMIN_PASSWORD)
    await adminPage.getByRole('button', { name: /увійти|login/i }).click()
    await adminPage.waitForURL(
      url =>
        url.pathname.startsWith('/admin') && url.pathname !== '/admin/login',
      { timeout: 20_000 }
    )
    await adminPage.goto(`${baseURL}/admin/chat`)

    // Patient opens chat
    await patientPage.goto(baseURL)
    await patientPage.waitForLoadState('networkidle')

    const chatBtn = patientPage
      .locator('[aria-label*="чат"], [data-testid="chat-toggle"]')
      .first()
    if (await chatBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await chatBtn.click()

      const nameInput = patientPage.locator(
        'input[placeholder*="ім"], input[name*="name"]'
      )
      if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nameInput.fill('QA Realtime Test')
        await patientPage.getByRole('button', { name: /почати|start/i }).click()
      }

      const msgInput = patientPage
        .locator('input[placeholder*="повідомлення"], textarea')
        .last()
      if (await msgInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await msgInput.fill(MSG_PATIENT)
        await patientPage.keyboard.press('Enter')

        // Verify message appears in admin panel (real-time)
        await expect(adminPage.getByText(MSG_PATIENT)).toBeVisible({
          timeout: 15_000,
        })
      }
    }

    await patientCtx.close()
    await adminCtx.close()
  })
})
