# Testing Documentation

**DS-WebApp Testing Guide** - Comprehensive testing strategy, patterns, and best practices.

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Accessibility Testing](#accessibility-testing)
- [Performance Testing](#performance-testing)
- [Visual Regression Testing](#visual-regression-testing)
- [Test Patterns & Best Practices](#test-patterns--best-practices)
- [Mocking Strategies](#mocking-strategies)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Current Test Coverage**: 113/116 tests passing (97.4%)  
**Test Framework**: Vitest + React Testing Library + Playwright  
**Coverage Tool**: Vitest Coverage (v8)  
**E2E Framework**: Playwright  
**A11y Testing**: Axe-core + @axe-core/playwright

### Test Distribution

```
Unit Tests:        85 tests
Integration Tests: 28 tests
E2E Tests:         3 tests
----------------------------
Total:            116 tests
```

---

## Testing Philosophy

### Testing Pyramid

```
       /\
      /E2E\        (Few) - 3 tests - High-level user flows
     /------\
    /Integr.\     (Some) - 28 tests - Component interactions
   /----------\
  /Unit Tests \   (Many) - 85 tests - Functions, hooks, utils
 /--------------\
```

### Core Principles

1. **Write tests that resemble how users interact** - Test behavior, not implementation
2. **Test confidence > 100% coverage** - Focus on critical paths
3. **Fast feedback loops** - Unit tests < 5s, integration < 30s
4. **Maintainable tests** - Avoid brittle selectors, use semantic queries
5. **Isolated tests** - Each test should run independently

---

## Test Types

### 1. Unit Tests

**Purpose**: Test individual functions, hooks, and components in isolation  
**Tool**: Vitest + React Testing Library  
**Location**: `src/**/__tests__/*.test.ts(x)`

**Example**:

```typescript
// src/utils/__tests__/validation.test.ts
import { isValidEmail } from '../validation'

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('validates correct email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
    })

    it('rejects invalid email format', () => {
      expect(isValidEmail('invalid')).toBe(false)
    })
  })
})
```

---

### 2. Integration Tests

**Purpose**: Test component interactions with services, context, routing  
**Tool**: Vitest + React Testing Library  
**Location**: `src/components/__tests__/*.test.tsx`

**Example**:

```typescript
// src/components/__tests__/ContactForm.test.tsx
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import ContactForm from '../ContactForm'
import * as contactsService from '@/services/contacts'

vi.mock('@/services/contacts')

describe('ContactForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    vi.mocked(contactsService.createContact).mockResolvedValue({
      success: true,
      data: { id: '123' }
    })

    render(<ContactForm />)

    await user.type(screen.getByLabelText(/ім'я/i), 'Іван')
    await user.type(screen.getByLabelText(/email/i), 'ivan@example.com')
    await user.click(screen.getByRole('button', { name: /надіслати/i }))

    await waitFor(() => {
      expect(contactsService.createContact).toHaveBeenCalled()
    })
  })
})
```

---

### 3. E2E Tests

**Purpose**: Test complete user workflows in real browser  
**Tool**: Playwright  
**Location**: `tests/e2e/*.spec.ts`

**Example**:

```typescript
// tests/e2e/booking.spec.ts
import { test, expect } from '@playwright/test'

test('user can book appointment', async ({ page }) => {
  await page.goto('/booking')

  // Fill appointment form
  await page.getByLabel(/Ім'я/i).fill('Іван')
  await page.getByLabel(/Прізвище/i).fill('Петренко')
  await page.getByLabel(/Email/i).fill('ivan@example.com')
  await page.getByLabel(/Телефон/i).fill('+380501234567')

  // Select service and date
  await page.getByLabel(/Послуга/i).selectOption('Консультація')
  await page.getByLabel(/Дата/i).fill('2024-12-15')

  // Submit
  await page.getByRole('button', { name: /Записатися/i }).click()

  // Verify success
  await expect(page.getByText(/успішно/i)).toBeVisible()
})
```

---

## Unit Testing

### Testing Utilities

Create reusable utilities in `src/test/test-utils.tsx`:

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </HelmetProvider>
)

const customRender = (
  ui: React.ReactElement,
  options?: RenderOptions
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Testing Hooks

**Pattern**: Use `renderHook` from `@testing-library/react`

```typescript
import { renderHook, act } from '@testing-library/react'
import { useSubmissionCooldown } from '../useSubmissionCooldown'

describe('useSubmissionCooldown', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts cooldown when start() is called', () => {
    const { result } = renderHook(() => useSubmissionCooldown('test', 30))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.isCoolingDown).toBe(true)
    expect(result.current.remainingSec).toBeLessThanOrEqual(30)
  })
})
```

### Testing Async Operations

```typescript
it('handles async data fetching', async () => {
  const mockData = { id: '1', name: 'Test' }
  vi.mocked(apiService.getData).mockResolvedValue(mockData)

  render(<MyComponent />)

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  // Verify data is displayed
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

### Testing Error States

```typescript
it('displays error message on failure', async () => {
  vi.mocked(apiService.getData).mockRejectedValue(
    new Error('Network error')
  )

  render(<MyComponent />)

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

---

## Integration Testing

### Testing Forms

**Pattern**: Test complete form workflows

```typescript
describe('BookingForm', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<BookingForm />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/ім'я обов'язкове/i)).toBeInTheDocument()
    })
  })

  it('formats phone number on blur', async () => {
    const user = userEvent.setup()
    render(<BookingForm />)

    const phoneInput = screen.getByLabelText(/телефон/i)
    await user.type(phoneInput, '0501234567')
    await user.tab()

    await waitFor(() => {
      expect(phoneInput).toHaveValue('+380501234567')
    })
  })
})
```

### Testing with Context

```typescript
import { AccessibilityProvider } from '@/components/AccessibilityProvider'

it('uses accessibility context', () => {
  render(
    <AccessibilityProvider>
      <MyComponent />
    </AccessibilityProvider>
  )

  // Test component behavior with context
})
```

### Testing Routing

```typescript
import { MemoryRouter, Route, Routes } from 'react-router-dom'

it('navigates to booking page', async () => {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
      </Routes>
    </MemoryRouter>
  )

  await user.click(screen.getByRole('link', { name: /book/i }))

  expect(screen.getByText(/booking form/i)).toBeInTheDocument()
})
```

---

## E2E Testing

### Setup

```bash
# Install browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npx playwright test --debug
```

### Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview:e2e',
    port: 4173,
    timeout: 120_000,
  },
})
```

### Page Object Pattern

```typescript
// tests/e2e/pages/BookingPage.ts
import { Page } from '@playwright/test'

export class BookingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/booking')
  }

  async fillPersonalInfo(data: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }) {
    await this.page.getByLabel(/ім'я/i).fill(data.firstName)
    await this.page.getByLabel(/прізвище/i).fill(data.lastName)
    await this.page.getByLabel(/email/i).fill(data.email)
    await this.page.getByLabel(/телефон/i).fill(data.phone)
  }

  async selectService(service: string) {
    await this.page.getByLabel(/послуга/i).selectOption(service)
  }

  async submit() {
    await this.page.getByRole('button', { name: /записатися/i }).click()
  }

  async expectSuccessMessage() {
    await expect(this.page.getByText(/успішно/i)).toBeVisible()
  }
}

// Usage in test
test('book appointment', async ({ page }) => {
  const bookingPage = new BookingPage(page)

  await bookingPage.goto()
  await bookingPage.fillPersonalInfo({
    firstName: 'Іван',
    lastName: 'Петренко',
    email: 'ivan@example.com',
    phone: '+380501234567',
  })
  await bookingPage.selectService('Консультація')
  await bookingPage.submit()
  await bookingPage.expectSuccessMessage()
})
```

### Custom Fixtures

```typescript
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Set authentication token
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'test-token',
        domain: 'localhost',
        path: '/',
      },
    ])

    await use(page)
  },
})
```

---

## Accessibility Testing

### Automated A11y Testing

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/')

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

### Manual A11y Checklist

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces form errors
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators are visible
- [ ] ARIA labels are present on interactive elements
- [ ] Form fields have associated labels
- [ ] Error messages are linked to inputs
- [ ] Skip links are available

### Testing Keyboard Navigation

```typescript
test('form is keyboard accessible', async ({ page }) => {
  await page.goto('/contact')

  // Tab through form fields
  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/name/i)).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/email/i)).toBeFocused()

  // Submit with Enter
  await page.keyboard.press('Enter')
})
```

---

## Performance Testing

### Performance Budgets

Located in `.performance-budgets.json`:

```json
{
  "bundles": {
    "scripts": 250000,
    "styles": 50000,
    "vendor": 250000
  },
  "metrics": {
    "FCP": 1800,
    "LCP": 2500,
    "CLS": 0.1
  }
}
```

### Running Performance Tests

```bash
# Check bundle sizes
npm run perf:check

# Full performance build
npm run perf:build
```

### Lighthouse CI

```typescript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
  },
}
```

---

## Visual Regression Testing

### Setup with Percy (Recommended)

```bash
# Install Percy
npm install --save-dev @percy/cli @percy/playwright

# Add to playwright.config.ts
import { percySnapshot } from '@percy/playwright'

test('visual regression', async ({ page }) => {
  await page.goto('/')
  await percySnapshot(page, 'Homepage')
})
```

### Setup with Playwright Screenshots

```typescript
test('visual comparison', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    threshold: 0.2,
  })
})
```

### Best Practices

1. **Stabilize animations** before screenshot
2. **Mock dynamic content** (dates, random data)
3. **Test across viewports** (mobile, tablet, desktop)
4. **Use meaningful names** for snapshots

---

## Test Patterns & Best Practices

### Arrange-Act-Assert (AAA)

```typescript
it('increments counter', async () => {
  // Arrange
  const user = userEvent.setup()
  render(<Counter />)

  // Act
  await user.click(screen.getByRole('button', { name: /increment/i }))

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### Query Priority

Use queries in this order:

1. **getByRole** - Accessibility-first approach
2. **getByLabelText** - Form fields
3. **getByPlaceholderText** - If label is unavailable
4. **getByText** - Content
5. **getByTestId** - Last resort

```typescript
// ✅ Good - semantic query
screen.getByRole('button', { name: /submit/i })

// ❌ Bad - implementation detail
screen.getByTestId('submit-button')
```

### Avoid Implementation Details

```typescript
// ❌ Bad - testing implementation
expect(component.state.isLoading).toBe(false)

// ✅ Good - testing behavior
expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
```

### Test Isolation

```typescript
describe('Component', () => {
  beforeEach(() => {
    // Reset state before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })
})
```

---

## Mocking Strategies

### Mocking Services

```typescript
// Mock entire module
vi.mock('@/services/contacts', () => ({
  createContact: vi.fn(),
}))

// Usage in test
const mockCreateContact = vi.mocked(contactsService.createContact)
mockCreateContact.mockResolvedValue({ success: true, data: { id: '123' } })
```

### Mocking Components

```typescript
vi.mock('@/components/Turnstile', () => ({
  default: ({ onVerify }: { onVerify?: (token: string) => void }) => {
    if (onVerify) {
      setTimeout(() => onVerify('mock-token'), 0)
    }
    return <div data-testid="turnstile-mock">Turnstile</div>
  },
}))
```

### Mocking Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('shows message after delay', () => {
  render(<DelayedMessage />)

  // Fast-forward time
  act(() => {
    vi.advanceTimersByTime(3000)
  })

  expect(screen.getByText(/delayed/i)).toBeInTheDocument()
})
```

### Mocking localStorage

```typescript
beforeEach(() => {
  localStorage.clear()
})

it('saves data to localStorage', () => {
  render(<MyComponent />)

  const stored = localStorage.getItem('key')
  expect(stored).toBe('value')
})
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Test Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

**Problem**: Tests exceed 5s timeout

**Solutions**:

- Increase timeout: `test('...', async () => {...}, 10000)`
- Use `waitFor` for async operations
- Check for infinite loops

#### 2. Flaky Tests

**Problem**: Tests pass/fail randomly

**Solutions**:

- Use `waitFor` instead of fixed delays
- Mock timers properly
- Ensure test isolation
- Avoid race conditions

#### 3. "Element not found"

**Problem**: `Unable to find element`

**Solutions**:

- Use `waitFor` for async rendering
- Check query priority (use getByRole)
- Verify element is actually rendered
- Use `screen.debug()` to inspect DOM

#### 4. E2E Tests Fail Locally

**Problem**: E2E tests work in CI but not locally

**Solutions**:

- Check `baseURL` in playwright.config.ts
- Ensure preview server is running
- Clear browser cache
- Check for hardcoded URLs

---

## Code Coverage

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
})
```

### What to Cover

- ✅ Business logic functions
- ✅ Form validation
- ✅ Error handling
- ✅ User interactions
- ✅ API calls
- ❌ UI styling
- ❌ Third-party libraries
- ❌ Type definitions

---

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing Guide](https://www.a11y-101.com/testing)

---

**Last Updated**: 2024-11-09  
**Test Coverage**: 97.4% (113/116 passing)  
**Framework**: Vitest + Playwright + Axe
