// Basic accessibility audit using Playwright + axe (Next.js)
// Usage: npm run dev (or rely on auto-start) then: npm run a11y:install && npm run a11y:audit
// Optional: BASE_URL=http://127.0.0.1:3000 npm run a11y:audit

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

// Vercel Deployment Protection: preview/preprod deployments require auth, so an
// unauthenticated request gets a 401 SSO page. When a Protection Bypass for
// Automation secret is configured, send it on every request so CI can reach the
// deployment. Harmless (empty) for local runs where the var is unset.
// See: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const bypassHeaders = BYPASS_SECRET
  ? {
      'x-vercel-protection-bypass': BYPASS_SECRET,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : {}
const PAGES = [
  '/',
  '/services',
  '/about',
  '/contact',
  '/booking',
  '/gallery',
  '/auth/login',
  '/auth/sign-up',
  '/privacy-policy',
  '/terms-of-service',
]

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET', headers: bypassHeaders })
      if (res.ok) return true
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

;(async () => {
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE)

  // Ensure server is running
  let previewProc = null
  let ok = await waitForServer(BASE)

  // Only auto-start a local dev server for a localhost target. Spawning
  // `next dev` does nothing for a remote deployment URL (CI).
  if (!ok && isLocal) {
    const { spawn } = await import('child_process')
    // Next.js App Router — dev server on 3000 (not Vite)
    previewProc = spawn('npx', ['next', 'dev', '-p', '3000'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
      cwd: process.cwd(),
    })
    ok = await waitForServer(BASE, 90000)
  }

  if (!ok) {
    // Surface the real status so a protected/unreachable deployment is obvious
    // instead of a generic "not reachable" timeout.
    let diag = '. Start manually: npm run dev'
    try {
      const res = await fetch(BASE, { method: 'GET', headers: bypassHeaders })
      diag = ` (HTTP ${res.status})`
      if (res.status === 401) {
        diag +=
          ' — deployment is behind Vercel Protection. Enable "Protection Bypass for Automation" in Vercel and set VERCEL_AUTOMATION_BYPASS_SECRET to that exact value.'
      }
    } catch (e) {
      diag = ` (${e?.message ?? 'fetch failed'})`
    }
    previewProc?.kill('SIGTERM')
    throw new Error(`Next.js not reachable at ${BASE}${diag}`)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ extraHTTPHeaders: bypassHeaders })
  const page = await context.newPage()

  let total = 0
  let failed = 0

  for (const path of PAGES) {
    const url = BASE + path
    console.log(`\nChecking ${url}`)
    await page.goto(url)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const violations = results.violations || []
    total += violations.length

    if (violations.length) {
      failed += violations.length
      for (const v of violations) {
        console.log(`- [${v.impact}] ${v.id}: ${v.description}`)
        console.log(`  Help: ${v.helpUrl}`)
        if (v.nodes?.length) {
          console.log(`  Nodes:`)
          for (const n of v.nodes.slice(0, 3)) {
            console.log(`    - ${n.target?.join(' ')}`)
          }
          if (v.nodes.length > 3)
            console.log(`    ...and ${v.nodes.length - 3} more`)
        }
      }
    } else {
      console.log('  No violations found ✅')
    }
  }

  // Admin accessibility audit (requires A11Y_ADMIN_EMAIL + A11Y_ADMIN_PASSWORD env vars)
  const adminEmail = process.env.A11Y_ADMIN_EMAIL
  const adminPassword = process.env.A11Y_ADMIN_PASSWORD

  if (adminEmail && adminPassword) {
    console.log('\n🔐 Admin a11y audit (authenticated)...')

    const adminContext = await browser.newContext({
      extraHTTPHeaders: bypassHeaders,
    })
    const adminPage = await adminContext.newPage()

    // Log in via the admin login form (selectors match app/admin/login/page.tsx)
    await adminPage.goto(BASE + '/admin/login')
    await adminPage.fill('#email', adminEmail)
    await adminPage.fill('#password', adminPassword)
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL('**/admin', { timeout: 15000 })

    const ADMIN_PAGES = [
      '/admin',
      '/admin/appointments',
      '/admin/patients',
      '/admin/services',
      '/admin/doctors',
      '/admin/materials',
      '/admin/orders',
      '/admin/treatments',
      '/admin/reviews',
      '/admin/analytics',
      '/admin/users',
      '/admin/chat',
    ]

    for (const path of ADMIN_PAGES) {
      const url = BASE + path
      console.log(`\nChecking ${url}`)
      await adminPage.goto(url)
      const results = await new AxeBuilder({ page: adminPage })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      const violations = results.violations || []
      total += violations.length

      if (violations.length) {
        failed += violations.length
        for (const v of violations) {
          console.log(`- [${v.impact}] ${v.id}: ${v.description}`)
          console.log(`  Help: ${v.helpUrl}`)
          if (v.nodes?.length) {
            console.log(`  Nodes:`)
            for (const n of v.nodes.slice(0, 3)) {
              console.log(`    - ${n.target?.join(' ')}`)
            }
            if (v.nodes.length > 3)
              console.log(`    ...and ${v.nodes.length - 3} more`)
          }
        }
      } else {
        console.log('  No violations found ✅')
      }
    }

    await adminContext.close()
  } else {
    console.log(
      '\n⚠️  Admin a11y audit skipped (set A11Y_ADMIN_EMAIL + A11Y_ADMIN_PASSWORD to enable)'
    )
  }

  // Patient cabinet accessibility audit (requires A11Y_PATIENT_EMAIL + A11Y_PATIENT_PASSWORD)
  const patientEmail = process.env.A11Y_PATIENT_EMAIL
  const patientPassword = process.env.A11Y_PATIENT_PASSWORD

  if (patientEmail && patientPassword) {
    console.log('\n🏥 Cabinet a11y audit (patient authenticated)...')

    const cabinetContext = await browser.newContext()
    const cabinetPage = await cabinetContext.newPage()

    await cabinetPage.goto(BASE + '/auth/login')
    await cabinetPage.fill('input[type="email"]', patientEmail)
    await cabinetPage.fill('input[type="password"]', patientPassword)
    await cabinetPage.click('button[type="submit"]')
    await cabinetPage.waitForURL('**/cabinet**', { timeout: 15000 })

    const CABINET_PAGES = [
      '/cabinet',
      '/cabinet/appointments',
      '/cabinet/treatments',
      '/cabinet/payments',
      '/cabinet/profile',
    ]

    for (const path of CABINET_PAGES) {
      const url = BASE + path
      console.log(`\nChecking ${url}`)
      await cabinetPage.goto(url)
      const results = await new AxeBuilder({ page: cabinetPage })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      const violations = results.violations || []
      total += violations.length

      if (violations.length) {
        failed += violations.length
        for (const v of violations) {
          console.log(`- [${v.impact}] ${v.id}: ${v.description}`)
          console.log(`  Help: ${v.helpUrl}`)
          if (v.nodes?.length) {
            console.log(`  Nodes:`)
            for (const n of v.nodes.slice(0, 3)) {
              console.log(`    - ${n.target?.join(' ')}`)
            }
            if (v.nodes.length > 3)
              console.log(`    ...and ${v.nodes.length - 3} more`)
          }
        }
      } else {
        console.log('  No violations found ✅')
      }
    }

    await cabinetContext.close()
  } else {
    console.log(
      '\n⚠️  Cabinet a11y audit skipped (set A11Y_PATIENT_EMAIL + A11Y_PATIENT_PASSWORD to enable)'
    )
  }

  await browser.close()

  console.log(`\nA11y audit finished. Violations: ${failed}`)
  if (failed > 0) process.exitCode = 1

  if (previewProc) previewProc.kill('SIGTERM')
})().catch(e => {
  console.error(e)
  process.exit(1)
})
