/**
 * E2E: Admin RBAC — route access gates
 *
 * Two layers of coverage:
 * 1. Unauthenticated access to any /admin/* route → redirect to /admin/login
 *    (runs in all environments, no secrets needed)
 * 2. Per-role access assertions against the permissions matrix
 *    (skipped unless E2E_ADMIN_* credentials are provided, i.e. preview env)
 */
import { expect, test, type Page } from '@playwright/test'
import { canAccessNavItem, type AdminRole } from '../src/lib/permissions'

// ─── Unauthenticated gate ────────────────────────────────────────────────────

const ADMIN_ROUTES = [
  '/admin',
  '/admin/appointments',
  '/admin/patients',
  '/admin/treatments',
  '/admin/materials',
  '/admin/orders',
  '/admin/analytics',
  '/admin/chat',
  '/admin/settings',
  '/admin/users',
]

test.describe('Admin — unauthenticated gate', () => {
  for (const route of ADMIN_ROUTES) {
    test(`${route} redirects to /admin/login`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL(url => url.pathname === '/admin/login', {
        timeout: 15_000,
        waitUntil: 'commit',
      })
      expect(new URL(page.url()).pathname).toBe('/admin/login')
    })
  }
})

// ─── Role-based access (live env only) ──────────────────────────────────────

// Credentials map: role → {email, password}
// Set E2E_ADMIN_<ROLE>_EMAIL and E2E_ADMIN_<ROLE>_PASSWORD as secrets.
type RoleCreds = { email: string; password: string }
function getRoleCreds(role: AdminRole): RoleCreds | null {
  const prefix = `E2E_ADMIN_${role.toUpperCase()}`
  const email = process.env[`${prefix}_EMAIL`] ?? ''
  const password = process.env[`${prefix}_PASSWORD`] ?? ''
  return email && password ? { email, password } : null
}

async function adminLogin(
  page: Page,
  { email, password }: RoleCreds
): Promise<void> {
  await page.goto('/admin/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /увійти/i }).click()
  await page.waitForURL(url => url.pathname.startsWith('/admin'), {
    timeout: 15_000,
  })
}

// Roles that have at least one credential set
const ROLES_WITH_CREDS = (
  [
    'superadmin',
    'admin',
    'receptionist',
    'doctor',
    'assistant',
    'billing_manager',
    'inventory_manager',
    'analyst',
  ] as AdminRole[]
).filter(r => getRoleCreds(r) !== null)

test.describe('Admin — per-role route access', () => {
  test.skip(
    ROLES_WITH_CREDS.length === 0,
    'No E2E_ADMIN_*_EMAIL / _PASSWORD credentials set — skipping RBAC tests'
  )

  for (const role of ROLES_WITH_CREDS) {
    test.describe(`role: ${role}`, () => {
      test.beforeEach(async ({ page }) => {
        const creds = getRoleCreds(role)!
        await adminLogin(page, creds)
      })

      for (const route of ADMIN_ROUTES) {
        const shouldAccess = canAccessNavItem(role, route)

        test(`${route} — ${shouldAccess ? 'allowed' : 'denied'}`, async ({
          page,
        }) => {
          await page.goto(route)
          await page.waitForLoadState('networkidle', { timeout: 10_000 })

          const currentPath = new URL(page.url()).pathname

          if (shouldAccess) {
            // Should stay on the route (or a sub-route), not bounce to login/403
            expect(currentPath).not.toBe('/admin/login')
            expect(currentPath).not.toMatch(/\/403|\/forbidden|\/unauthorized/)
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
              timeout: 8_000,
            })
          } else {
            // Should be redirected away from the restricted page
            const redirected =
              currentPath === '/admin/login' ||
              currentPath.match(/\/403|\/forbidden|\/unauthorized/) !== null ||
              currentPath === '/admin' // some roles get redirected to dashboard
            expect(redirected).toBeTruthy()
          }
        })
      }
    })
  }
})
