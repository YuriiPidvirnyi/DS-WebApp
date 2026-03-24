# Testing Documentation

## Overview

**Framework:** Vitest + React Testing Library (unit/integration), Playwright (E2E), @axe-core/playwright (accessibility)  
**Coverage tool:** Vitest Coverage (v8)  
**Test runner config:** [vitest.config.ts](../vitest.config.ts), [playwright.config.ts](../playwright.config.ts)

### Test Inventory

| Category      | Files    | Tests     | Location                                                           |
| ------------- | -------- | --------- | ------------------------------------------------------------------ |
| Unit / smoke  | 7        | ~40       | `src/**/*.test.{ts,tsx}`                                           |
| E2E (mocked)  | 2        | ~10       | `e2e/auth-flows.spec.ts`, `e2e/ui-form-controls.smoke.spec.ts`     |
| E2E (live)    | 2        | ~10       | `e2e/auth-live.smoke.spec.ts`, `e2e/auth-email-links.live.spec.ts` |
| Accessibility | 1 script | 10 routes | `scripts/a11y-audit.mjs`                                           |

---

## Commands

```bash
# Unit tests
npm run test              # Run once with Vitest
npm run test:watch        # Watch mode
npm run test:coverage     # With v8 coverage

# E2E - mocked auth
npm run test:e2e:auth     # Playwright + mocked Supabase

# E2E - live auth (requires real Supabase credentials)
npm run test:e2e:auth:live
npm run test:e2e:auth:links:live

# E2E - UI smoke (Select components, language dropdown)
npm run test:e2e:ui-smoke

# Accessibility
npm run a11y:audit        # axe-core on 10 public routes
```

---

## Unit & Smoke Tests (Vitest)

All tests live under `src/` and match `src/**/*.test.{ts,tsx}`.

### Test setup

- **Config:** `vitest.config.ts` -- jsdom environment, globals enabled, `@` path alias
- **Setup file:** `src/test/setup.ts` -- imports `@testing-library/jest-dom/vitest`

### Test files

| File                                        | Describe                                                                               | Tests |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ----- |
| `src/lib/redis.test.ts`                     | Redis graceful fallback (no connection)                                                | 5     |
| `src/lib/api-security.test.ts`              | checkRateLimit, rateLimitResponse, validateCSRF, csrfErrorResponse                     | 13    |
| `src/lib/supabase/audit.test.ts`            | Audit log queries, RPC calls                                                           | 3     |
| `src/utils/adminPreferences.test.ts`        | Preference parsing, localStorage, defaults                                             | 5     |
| `src/views/admin/AdminPages.smoke.test.tsx` | Admin page interactions (doctors, services, appointments, reviews, contacts, rollback) | 6     |
| `src/views/auth/AuthPages.smoke.test.tsx`   | Auth flows (login, reset, signup, callback)                                            | 7     |
| `src/services/__tests__/api-abort.test.ts`  | Fetch abort -> APIError mapping                                                        | 1     |

### Mocking patterns

**Supabase client mock** (used by admin/auth smoke tests):

```typescript
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({ select, update, delete: deleteFn })),
    auth: {
      signInWithPassword,
      resetPasswordForEmail,
      signUp,
      exchangeCodeForSession,
    },
  })),
}))
```

**Redis mock** (used by redis.test.ts):

```typescript
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}))
```

**Fetch stub** (used by api-abort.test.ts):

```typescript
vi.stubGlobal(
  'fetch',
  vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
)
```

---

## E2E Tests (Playwright)

### Configurations

| Config file                            | Purpose                                 | Base URL                             |
| -------------------------------------- | --------------------------------------- | ------------------------------------ |
| `playwright.config.ts`                 | Default (not currently used by scripts) | `http://localhost:3000`              |
| `playwright.auth.config.ts`            | Mocked auth + UI smoke tests            | `http://localhost:3000` (dev server) |
| `playwright.auth.live.config.ts`       | Live Supabase auth                      | `http://localhost:3000`              |
| `playwright.auth.links.live.config.ts` | Live email link tests                   | `http://localhost:3000`              |

### Test files

| File                                 | Purpose                                                    | Requires live Supabase |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------- |
| `e2e/auth-flows.spec.ts`             | Login, signup, forgot-password with mocked responses       | No                     |
| `e2e/ui-form-controls.smoke.spec.ts` | Native Select, CustomSelect, LanguageSwitcher interactions | No                     |
| `e2e/auth-live.smoke.spec.ts`        | Real signup/login/reset against Supabase                   | Yes                    |
| `e2e/auth-email-links.live.spec.ts`  | Magic link and email confirmation flows                    | Yes                    |

### Browser matrix

Default Playwright config defines 5 projects: Desktop Chrome, Desktop Firefox, Desktop Safari, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12). Auth configs typically run Chromium only.

---

## Accessibility Testing

`scripts/a11y-audit.mjs` runs axe-core via Playwright on 10 public routes:

```
/, /about, /services, /booking, /contact, /reviews,
/gallery, /auth/login, /auth/sign-up, /privacy-policy, /terms-of-service
```

Tags checked: `wcag2a`, `wcag2aa`. Exit code 1 on any violation.

The script auto-starts `next dev` if no server is detected at `BASE_URL` (default `http://localhost:3000`).

### CI integration

In `.github/workflows/ci.yml`, the build job runs the a11y audit against a production build:

```yaml
- run: npm run start &
- run: npx wait-on http://127.0.0.1:3000
- run: BASE_URL=http://127.0.0.1:3000 npm run a11y:audit
```

---

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:

| Job                  | Steps                              | Depends on               |
| -------------------- | ---------------------------------- | ------------------------ |
| `lint-and-typecheck` | ESLint, TypeScript, Prettier       | --                       |
| `test`               | Vitest unit tests                  | lint-and-typecheck       |
| `build`              | Next.js build, a11y audit          | lint-and-typecheck, test |
| `e2e-ui-smoke`       | Playwright UI smoke                | test                     |
| `security-audit`     | `npm audit --audit-level=moderate` | --                       |

---

## Writing Tests

### Unit test conventions

- Place tests next to source: `src/lib/foo.ts` -> `src/lib/foo.test.ts`
- Exception: service tests go in `src/services/__tests__/`
- Import `screen`, `waitFor` from `@testing-library/react` directly (not from test-utils)
- Use `vi.mock()` for external deps (Supabase, Redis, fetch)

### E2E test conventions

- Place specs in `e2e/` directory
- Name pattern: `feature-name.spec.ts` or `feature-name.smoke.spec.ts`
- Use Playwright fixtures and `expect` assertions
- Keep mocked and live tests in separate files with separate configs
