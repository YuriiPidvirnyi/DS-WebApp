import { defineConfig, devices } from '@playwright/test'

const port = 3000
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  // In CI the workflow starts the server itself (`npm start &` + `wait-on tcp:3000`)
  // before playwright runs, so the managed webServer is skipped entirely — its URL
  // probe reproducibly hung for minutes in main-branch runs despite a Ready server
  // (issue #348). Locally nothing changes: reuseExistingServer picks up a running
  // dev server on :3000, or playwright starts `npm start` itself.
  webServer: process.env.CI
    ? undefined
    : {
        command: `PORT=${port} npm start`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
        env: {
          NEXT_TELEMETRY_DISABLED: '1',
          NEXT_PUBLIC_SITE_URL: baseURL,
          NEXT_PUBLIC_SUPABASE_URL: `${baseURL}/supabase-mock`,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        },
      },
})
