# DS-WebApp Improvement Plan

Комплексний план покращення веб-сайту Dental Story з дотриманням Git best practices, benchmarking та повним тестуванням.

## 🎯 Цілі

- ⚡ **Performance**: Score 95+ на Lighthouse
- 🔒 **Security**: Впровадити найкращі практики безпеки
- ♿ **Accessibility**: WCAG 2.1 AA compliance
- 🧪 **Testing**: 80%+ code coverage
- 📊 **Monitoring**: Real-time metrics та alerts
- 🚀 **CI/CD**: Автоматизація всіх процесів

## 📋 Phases Overview

| Phase | Назва                    | Тривалість | Пріоритет   |
| ----- | ------------------------ | ---------- | ----------- |
| 1     | Git Strategy & Branching | 2h         | 🔴 Critical |
| 2     | Performance Benchmarking | 3h         | 🔴 Critical |
| 3     | Core Web Vitals          | 4h         | 🟡 High     |
| 4     | Advanced Caching         | 3h         | 🟡 High     |
| 5     | SEO & Analytics          | 2h         | 🟢 Medium   |
| 6     | Accessibility            | 4h         | 🟡 High     |
| 7     | Security Hardening       | 3h         | 🔴 Critical |
| 8     | Testing Suite            | 6h         | 🔴 Critical |
| 9     | CliniCards Tests         | 4h         | 🔴 Critical |
| 10    | Monitoring               | 2h         | 🟡 High     |
| 11    | CI/CD                    | 3h         | 🟡 High     |
| 12    | Documentation            | 2h         | 🟢 Medium   |

**Загальна тривалість**: ~38 годин (5 робочих днів)

---

## Phase 1: Git Strategy & Branching Setup (2h)

### Branching Model

```
main (production)
  └── develop (integration)
      ├── feature/performance-benchmarking
      ├── feature/core-web-vitals
      ├── feature/advanced-caching
      ├── feature/seo-analytics
      ├── feature/accessibility
      ├── feature/security-hardening
      ├── feature/testing-suite
      ├── feature/clinicards-tests
      ├── feature/monitoring
      ├── feature/ci-cd
      └── docs/improvement-docs
```

### Git Workflow

1. **Створення feature branch**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/branch-name
   ```

2. **Робота над feature**:

   ```bash
   # Commit часто, атомарно
   git add .
   git commit -m "feat(scope): description"

   # Push регулярно
   git push origin feature/branch-name
   ```

3. **Створення Pull Request**:
   - Title: `[Feature] Description`
   - Labels: `enhancement`, `ready-for-review`
   - Assign reviewers
   - Link related issues

4. **Merge до develop**:
   ```bash
   # Squash commits
   git checkout develop
   git merge --squash feature/branch-name
   git commit -m "feat: comprehensive description"
   git push origin develop
   ```

### Branch Protection Rules

**main**:

- Require PR reviews (2 approvals)
- Require status checks (tests, lint, build)
- No direct pushes
- No force pushes

**develop**:

- Require status checks
- Allow direct pushes (for hotfixes)

### Commit Convention

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:

```bash
feat(clinicards): add appointment booking
fix(api): handle network timeout
perf(images): implement lazy loading
test(booking): add e2e booking flow
docs(readme): update setup instructions
```

### Pre-commit Hooks

Already configured in `.husky/pre-commit`:

- ESLint
- Prettier
- TypeScript compiler check
- Lint-staged

---

## Phase 2: Performance Benchmarking Infrastructure (3h)

### Lighthouse CI Setup

**1. Install Lighthouse CI**:

```bash
npm install -D @lhci/cli
```

**2. Create `lighthouserc.js`**:

```javascript
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173/'],
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

**3. Add npm scripts**:

```json
{
  "scripts": {
    "lighthouse": "lhci autorun",
    "lighthouse:mobile": "lhci autorun --collect.settings.preset=mobile"
  }
}
```

### Performance Budgets

**Create `performance-budget.json`**:

```json
{
  "timings": {
    "firstContentfulPaint": 1800,
    "largestContentfulPaint": 2500,
    "firstInputDelay": 100,
    "cumulativeLayoutShift": 0.1,
    "totalBlockingTime": 300,
    "speedIndex": 3000
  },
  "resourceSizes": {
    "total": 1000,
    "script": 300,
    "stylesheet": 100,
    "image": 500,
    "font": 100
  }
}
```

### Bundle Size Monitoring

**Install size-limit**:

```bash
npm install -D @size-limit/preset-app
```

**Create `.size-limit.json`**:

```json
[
  {
    "path": "dist/assets/index-*.js",
    "limit": "300 KB"
  },
  {
    "path": "dist/assets/index-*.css",
    "limit": "50 KB"
  }
]
```

### Benchmark Tests

**Create `scripts/benchmark.ts`**:

```typescript
import { performance } from 'perf_hooks'

const benchmarks = {
  'API Call': async () => {
    const start = performance.now()
    await fetch('/api/schedule')
    return performance.now() - start
  },

  'Component Render': async () => {
    const start = performance.now()
    // Render component
    return performance.now() - start
  },
}

// Run and report
```

---

## Phase 3: Core Web Vitals Optimization (4h)

### LCP Optimization (Target: <2.5s)

**Actions**:

1. Image optimization:
   - Convert to WebP/AVIF
   - Implement lazy loading
   - Add `loading="lazy"` attribute
   - Use responsive images (`srcset`)

2. Code splitting:

   ```typescript
   const CliniCardsBooking = lazy(
     () => import('./components/CliniCardsBooking')
   )
   const PatientPortal = lazy(() => import('./components/PatientPortal'))
   ```

3. Preload critical resources:
   ```html
   <link rel="preload" as="image" href="/hero.webp" />
   <link rel="preconnect" href="https://api.cliniccards.com" />
   ```

### FID Optimization (Target: <100ms)

**Actions**:

1. Reduce JavaScript execution time
2. Break up long tasks
3. Use Web Workers for heavy computations
4. Defer non-critical JS

### CLS Optimization (Target: <0.1)

**Actions**:

1. Reserve space for images:

   ```jsx
   <img src="..." width={800} height={600} alt="..." />
   ```

2. Avoid injecting content above existing content
3. Use `transform` animations instead of layout properties
4. Add `min-height` to dynamic containers

---

## Phase 4: Advanced Caching Strategy (3h)

### Service Worker Implementation

**Create `src/sw.ts`**:

```typescript
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies'

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache images (Cache First)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images' })
)

// Cache API (Network First)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({ cacheName: 'api' })
)

// Cache HTML (Stale While Revalidate)
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({ cacheName: 'html' })
)
```

### HTTP Cache Headers

**For static assets**:

```
Cache-Control: public, max-age=31536000, immutable
```

**For HTML**:

```
Cache-Control: no-cache, must-revalidate
```

**For API responses**:

```
Cache-Control: private, max-age=300, stale-while-revalidate=600
```

---

## Phase 5: SEO & Analytics Enhancement (2h)

### Structured Data (JSON-LD)

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "name": "Dental Story",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "вул. Пекарська, 18",
      "addressLocality": "Львів",
      "addressCountry": "UA"
    },
    "telephone": "+380682323838",
    "openingHours": "Mo-Fr 09:00-18:00"
  }
</script>
```

### Meta Tags

```html
<meta name="description" content="..." />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta name="twitter:card" content="summary_large_image" />
```

### XML Sitemap

Auto-generate with priorities and change frequencies.

---

## Phase 6: Accessibility (4h)

### WCAG 2.1 AA Checklist

- [ ] Keyboard navigation for all interactive elements
- [ ] ARIA labels for all buttons/links
- [ ] Alt text for all images
- [ ] Color contrast ratio ≥4.5:1
- [ ] Focus indicators visible
- [ ] Skip to content link
- [ ] Semantic HTML (header, nav, main, footer)
- [ ] Form labels properly associated
- [ ] Error messages accessible
- [ ] Screen reader tested

### Focus Management

```typescript
// Trap focus in modal
const trapFocus = (element: HTMLElement) => {
  const focusable = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  // Implement focus trap
}
```

---

## Phase 7: Security Hardening (3h)

### Content Security Policy

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.cliniccards.com;
  "
/>
```

### Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Input Sanitization

```typescript
import DOMPurify from 'dompurify'

const sanitize = (input: string) => DOMPurify.sanitize(input)
```

---

## Phase 8: Comprehensive Testing Suite (6h)

### Unit Tests (Jest + Testing Library)

**Target**: 80%+ coverage

```typescript
// Example: clinicardsApi.test.ts
describe('CliniCardsApiService', () => {
  it('should fetch schedule', async () => {
    const api = getCliniCardsApi()
    const response = await api.getSchedule({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    })
    expect(response.success).toBe(true)
  })
})
```

### Integration Tests

```typescript
// Example: booking-flow.integration.test.ts
describe('Booking Flow', () => {
  it('should complete full booking', async () => {
    // 1. Select doctor
    // 2. Choose date/time
    // 3. Enter patient info
    // 4. Confirm booking
    // 5. Verify API call
  })
})
```

### E2E Tests (Playwright)

```typescript
// Example: booking.spec.ts
test('should book appointment', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Записатися')
  await page.selectOption('#doctor', 'doc_123')
  await page.click('text=Підтвердити')
  await expect(page.locator('.success')).toBeVisible()
})
```

### Visual Regression Tests

```typescript
// Example: homepage.visual.test.ts
test('homepage matches snapshot', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage.png')
})
```

---

## Phase 9: CliniCards Integration Tests (4h)

### Unit Tests Coverage

**clinicardsApi.ts** (100% coverage):

```typescript
describe('CliniCardsApi', () => {
  describe('Schedule', () => {
    it('should get schedule')
    it('should handle network errors')
    it('should retry on failure')
    it('should cache GET requests')
  })

  describe('Patients', () => {
    it('should create patient')
    it('should find patient by phone')
    it('should get all patients')
  })

  describe('Appointments', () => {
    it('should create appointment')
    it('should update status')
    it('should cancel appointment')
  })

  // ... more tests
})
```

### Component Tests

```typescript
describe('CliniCardsBooking', () => {
  it('should render all steps')
  it('should navigate between steps')
  it('should validate patient info')
  it('should submit booking')
  it('should handle errors')
})

describe('PatientPortal', () => {
  it('should load patient data')
  it('should display treatment plans')
  it('should show payment history')
  it('should switch between tabs')
})

describe('PriceListDisplay', () => {
  it('should render price categories')
  it('should filter by category')
  it('should search items')
  it('should export to CSV')
})
```

### E2E Booking Flow

```typescript
test('complete booking flow', async ({ page }) => {
  // 1. Navigate to booking
  await page.goto('/booking')

  // 2. Select doctor
  await page.selectOption('#doctor', 'Dr. Smith')
  await page.click('button:has-text("Далі")')

  // 3. Choose date
  await page.click('[data-date="2024-02-01"]')

  // 4. Choose time
  await page.click('[data-time="10:00"]')
  await page.click('button:has-text("Далі")')

  // 5. Fill patient info
  await page.fill('#firstName', 'Іван')
  await page.fill('#lastName', 'Петренко')
  await page.fill('#phone', '+380501234567')
  await page.click('button:has-text("Підтвердити")')

  // 6. Verify success
  await expect(page.locator('.success-message')).toBeVisible()
})
```

---

## Phase 10: Monitoring & Alerting (2h)

### Sentry Integration

```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
})
```

### Custom Dashboards

- Performance metrics (LCP, FID, CLS)
- Error rates by page
- API call statistics
- User engagement metrics

### Alerts Configuration

- Error rate > 5% → Slack notification
- API response time > 2s → Email alert
- CliniCards API down → PagerDuty alert

---

## Phase 11: CI/CD Pipeline (3h)

### GitHub Actions Workflows

**`.github/workflows/ci.yml`**:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.js'
```

### Automated Updates

**Dependabot configuration**:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
```

---

## Phase 12: Documentation (2h)

### Files to Create

1. **CONTRIBUTING.md**: How to contribute
2. **CODE_OF_CONDUCT.md**: Community standards
3. **PULL_REQUEST_TEMPLATE.md**: PR checklist
4. **ISSUE_TEMPLATE.md**: Bug/feature templates
5. **DEPLOYMENT.md**: How to deploy
6. **ADR/**: Architectural decisions

---

## 📊 Success Metrics

| Metric                 | Current | Target | Status |
| ---------------------- | ------- | ------ | ------ |
| Lighthouse Performance | 78      | 95+    | 🔴     |
| Test Coverage          | 0%      | 80%+   | 🔴     |
| Bundle Size            | 450KB   | <300KB | 🟡     |
| LCP                    | 3.2s    | <2.5s  | 🟡     |
| FID                    | 120ms   | <100ms | 🟡     |
| CLS                    | 0.15    | <0.1   | 🟡     |
| Security Score         | 85      | 95+    | 🟡     |
| Accessibility          | 88      | 95+    | 🟡     |

---

## 🚀 Execution Timeline

### Week 1 (Days 1-2)

- Phase 1: Git Strategy
- Phase 2: Benchmarking
- Phase 3: Web Vitals

### Week 2 (Days 3-4)

- Phase 4: Caching
- Phase 5: SEO
- Phase 6: Accessibility
- Phase 7: Security

### Week 3 (Day 5)

- Phase 8: Testing Suite
- Phase 9: CliniCards Tests

### Week 4 (Final)

- Phase 10: Monitoring
- Phase 11: CI/CD
- Phase 12: Documentation

---

## ✅ Definition of Done

Для кожної фази:

- [ ] Код написано та протестовано
- [ ] Тести пройдені (unit + integration + e2e)
- [ ] Документація оновлена
- [ ] PR створено та змержено
- [ ] CI/CD checks пройдені
- [ ] Performance benchmarks OK
- [ ] Code review completed

---

## 📚 Resources

- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Jest](https://jestjs.io/)
- [Playwright](https://playwright.dev/)
- [Sentry](https://sentry.io/)

---

**Last Updated**: 2024-01-09  
**Status**: 🟢 Ready to Start  
**Owner**: DS-WebApp Team
