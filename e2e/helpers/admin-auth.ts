import type { Page } from '@playwright/test'

export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'RbacTest!2026'

export const ADMIN_EMAILS: Record<string, string> = {
  superadmin:
    process.env.E2E_ADMIN_SUPERADMIN_EMAIL ?? 'rbac.superadmin@dentalstory.ua',
  admin: process.env.E2E_ADMIN_ADMIN_EMAIL ?? 'rbac.admin@dentalstory.ua',
  receptionist:
    process.env.E2E_ADMIN_RECEPTIONIST_EMAIL ??
    'rbac.receptionist@dentalstory.ua',
  doctor: process.env.E2E_ADMIN_DOCTOR_EMAIL ?? 'rbac.doctor@dentalstory.ua',
  assistant:
    process.env.E2E_ADMIN_ASSISTANT_EMAIL ?? 'rbac.assistant@dentalstory.ua',
  billing_manager:
    process.env.E2E_ADMIN_BILLING_EMAIL ?? 'rbac.billing@dentalstory.ua',
  inventory_manager:
    process.env.E2E_ADMIN_INVENTORY_EMAIL ?? 'rbac.inventory@dentalstory.ua',
  analyst: process.env.E2E_ADMIN_ANALYST_EMAIL ?? 'rbac.analyst@dentalstory.ua',
}

export async function adminLogin(page: Page, role: string = 'superadmin') {
  await page.goto('/admin/login')
  await page.locator('#email, input[type="email"]').fill(ADMIN_EMAILS[role])
  await page.locator('#password, input[type="password"]').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /увійти|login|sign in/i }).click()
  await page.waitForURL(
    url => url.pathname.startsWith('/admin') && url.pathname !== '/admin/login',
    {
      timeout: 20_000,
    }
  )
}

export async function adminLogout(page: Page) {
  // Try clicking avatar/logout button
  const logoutBtn = page.getByRole('button', { name: /вийти|logout|sign out/i })
  if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await logoutBtn.click()
  } else {
    // Try navigating to logout route or finding it in dropdown
    const avatar = page
      .locator(
        '[aria-label*="профіль"], [aria-label*="account"], .avatar, [data-testid="user-menu"]'
      )
      .first()
    if (await avatar.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await avatar.click()
      await page.getByRole('button', { name: /вийти|logout/i }).click()
    }
  }
}

export const hasLiveAdmin = Boolean(
  process.env.E2E_ADMIN_SUPERADMIN_EMAIL ||
  process.env.E2E_ADMIN_PASSWORD ||
  true // default creds available
)
