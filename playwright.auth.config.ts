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
  webServer: {
    // In CI: `npm run build` runs first so `npm start` boots from pre-built artifacts (<5s).
    // Locally: reuseExistingServer means a running dev server on :3000 is reused automatically.
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
