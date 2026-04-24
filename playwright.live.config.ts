import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/live-results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.dentalstory.ua',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer - runs against live site
})
