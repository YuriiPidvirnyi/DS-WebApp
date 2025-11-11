# E2E Testing Guide

End-to-end testing documentation for DS-WebApp using Playwright.

## Overview

E2E tests verify complete user flows in a real browser environment, ensuring the application works correctly from the user's perspective.

### Tools

- **Playwright** - Cross-browser test automation
- **Custom Preview Server** - Express-based server with proper SPA fallback

## Running E2E Tests

### Prerequisites

```bash
# Install Playwright browsers (only needed once)
npx playwright install chromium

# Build the application
npm run build
```

### Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/smoke.spec.ts

# Run with debugging
npx playwright test --debug

# Run in headed mode (see browser)
npx playwright test --headed
```

## Test Structure

```
e2e/
├── smoke.spec.ts       # Critical user flows
├── booking.spec.ts     # Booking form tests
└── contact.spec.ts     # Contact form tests
```

### Test Files

#### smoke.spec.ts

Quick tests for critical functionality:

- Home page loads
- Navigation works
- Contact form submits
- Booking flow completes

#### booking.spec.ts

Comprehensive booking form testing:

- Multi-step form validation
- Date/time selection
- Doctor selection
- Form submission
- Success page

#### contact.spec.ts

Contact form validation and submission

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/')

    // Interact
    await page.getByRole('button', { name: 'Click me' }).click()

    // Assert
    await expect(page).toHaveURL('/success')
  })
})
```

### Best Practices

1. **Use Accessible Selectors**

   ```typescript
   // ✅ Good - uses accessible selectors
   await page.getByRole('button', { name: 'Submit' })
   await page.getByLabel('Email')

   // ❌ Bad - brittle selectors
   await page.locator('.btn-primary')
   await page.locator('#email-input')
   ```

2. **Wait for Elements**

   ```typescript
   // Playwright auto-waits, but for custom scenarios:
   await expect(page.getByText('Success')).toBeVisible({ timeout: 5000 })
   ```

3. **Clean State Between Tests**

   ```typescript
   test.beforeEach(async ({ page }) => {
     // Clear localStorage
     await page.addInitScript(() => {
       localStorage.clear()
     })
   })
   ```

4. **Mock API Calls**
   ```typescript
   await page.route('**/api/appointments', async route => {
     await route.fulfill({
       status: 200,
       contentType: 'application/json',
       body: JSON.stringify({ success: true, data: mockData }),
     })
   })
   ```

## Custom Preview Server

The project uses a custom Express-based preview server for E2E tests instead of Vite's default preview server.

### Why Custom Server?

Vite's preview server doesn't properly handle SPA fallback for client-side routes, causing 404 errors when navigating directly to routes like `/booking` or `/contact`.

### Implementation

**Location**: `scripts/preview-server.js`

**Features**:

- Serves static files from `dist/`
- SPA fallback - serves `index.html` for all non-asset routes
- Proper handling of relative paths
- Graceful shutdown

**Usage**:

```bash
# Used automatically by playwright.config.ts
npm run preview:e2e
```

## Configuration

### playwright.config.ts

```typescript
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    command: 'npm run preview:e2e',
    url: 'http://localhost:4173',
    timeout: 120_000,
  },
})
```

### Key Settings

- `timeout: 30_000` - 30s per test
- `expect.timeout: 10_000` - 10s for assertions
- `retries: 2` - Retry flaky tests in CI
- `screenshot: 'only-on-failure'` - Debug failures
- `video: 'retain-on-failure'` - Video evidence

## Debugging

### View Test Results

```bash
# Open HTML report
npx playwright show-report

# View traces
npx playwright show-trace test-results/trace.zip
```

### Common Issues

#### White Screen / Assets Not Loading

**Cause**: Incorrect base path in `vite.config.ts`

**Solution**: Ensure `base: '/'` (not `base: './'`)

```typescript
// vite.config.ts
export default defineConfig({
  base: '/', // ✅ Correct for E2E
  // base: './', // ❌ Causes asset loading issues
})
```

#### SPA Routes Return 404

**Cause**: Preview server doesn't serve index.html for client-side routes

**Solution**: Use custom preview server (`npm run preview:e2e`)

#### Tests Timeout

**Causes**:

- Slow application startup
- Network requests not mocked
- Heavy computation blocking main thread

**Solutions**:

- Increase timeout in config
- Mock slow API calls
- Optimize application bundle

#### Flaky Tests

**Common causes**:

- Race conditions
- Timing issues
- Network dependencies

**Solutions**:

```typescript
// Use explicit waits
await expect(element).toBeVisible()

// Mock network
await page.route('**/api/**', ...)

// Clean state
await page.addInitScript(() => localStorage.clear())
```

## CI/CD Integration

E2E tests run automatically in CI via GitHub Actions.

### Workflow

```yaml
# .github/workflows/ci.yml
e2e-tests:
  steps:
    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Build application
      run: npm run build

    - name: Run E2E tests
      run: npx playwright test

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
```

### CI Optimizations

1. **Install only Chromium** (faster than all browsers)
2. **Retry flaky tests** (`retries: 2` in CI)
3. **Parallel execution** (disabled for stability)
4. **Upload artifacts** (screenshots, videos, traces)

## Performance

### Test Execution Time

- Smoke tests: ~30-60s
- Full suite: ~2-5min
- CI (with retries): ~5-10min

### Optimization Tips

1. **Mock API calls** - Avoid real network requests
2. **Minimize waits** - Use Playwright's auto-waiting
3. **Reuse browser context** - When safe
4. **Run critical tests first** - Fail fast

## Examples

### Complete User Flow

```typescript
test('user can book appointment', async ({ page }) => {
  // Navigate to booking
  await page.goto('/booking')

  // Step 1: Select service and time
  await page.selectOption('select[name="service"]', 'cleaning')
  await page.fill('input[name="date"]', '2024-12-25')
  await page.selectOption('select[name="time"]', '10:00')
  await page.click('button:has-text("Next")')

  // Step 2: Enter personal info
  await page.fill('input[name="firstName"]', 'John')
  await page.fill('input[name="lastName"]', 'Doe')
  await page.fill('input[name="email"]', 'john@example.com')
  await page.fill('input[name="phone"]', '+380501234567')
  await page.click('button:has-text("Next")')

  // Step 3: Confirm
  await page.check('input[name="consent"]')
  await page.click('button:has-text("Book")')

  // Verify success
  await expect(page).toHaveURL(/\/booking\/success/)
  await expect(page.getByText('Booking confirmed')).toBeVisible()
})
```

### Form Validation

```typescript
test('validates required fields', async ({ page }) => {
  await page.goto('/contact')

  // Try to submit empty form
  await page.click('button[type="submit"]')

  // Check error messages
  await expect(page.getByText('Name is required')).toBeVisible()
  await expect(page.getByText('Email is required')).toBeVisible()

  // Fill form
  await page.fill('input[name="name"]', 'John Doe')
  await page.fill('input[name="email"]', 'john@example.com')

  // Error should disappear
  await expect(page.getByText('Name is required')).not.toBeVisible()
})
```

### API Mocking

```typescript
test('handles API errors gracefully', async ({ page }) => {
  // Mock API error
  await page.route('**/api/appointments', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    })
  })

  await page.goto('/booking')
  // ... submit form ...

  // Verify error handling
  await expect(page.getByText('Something went wrong')).toBeVisible()
})
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI Integration](https://playwright.dev/docs/ci)

## Maintenance

### Regular Tasks

- [ ] Review and update selectors when UI changes
- [ ] Add tests for new features
- [ ] Remove tests for deprecated features
- [ ] Update mocks when API changes
- [ ] Monitor test execution time
- [ ] Fix flaky tests immediately

### Health Metrics

- **Pass rate**: >95% expected
- **Flakiness**: <5% acceptable
- **Execution time**: <5min for full suite
- **Coverage**: All critical user flows
