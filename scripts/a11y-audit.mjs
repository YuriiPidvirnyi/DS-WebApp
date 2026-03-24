// Basic accessibility audit using Playwright + axe (Next.js)
// Usage: npm run dev (or rely on auto-start) then: npm run a11y:install && npm run a11y:audit
// Optional: BASE_URL=http://127.0.0.1:3000 npm run a11y:audit

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const PAGES = [
  '/',
  '/services',
  '/about',
  '/contact',
  '/booking',
  '/reviews',
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
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return true
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

;(async () => {
  // Ensure server is running
  let previewProc = null
  const ok = await waitForServer(BASE)
  if (!ok) {
    const { spawn } = await import('child_process')
    // Next.js App Router — dev server on 3000 (not Vite)
    previewProc = spawn('npx', ['next', 'dev', '-p', '3000'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
      cwd: process.cwd(),
    })
    const ready = await waitForServer(BASE, 90000)
    if (!ready) {
      previewProc?.kill('SIGTERM')
      throw new Error(
        `Next.js not reachable at ${BASE}. Start manually: npm run dev`
      )
    }
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
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

  await browser.close()

  console.log(`\nA11y audit finished. Violations: ${failed}`)
  if (failed > 0) process.exitCode = 1

  if (previewProc) previewProc.kill('SIGTERM')
})().catch(e => {
  console.error(e)
  process.exit(1)
})
