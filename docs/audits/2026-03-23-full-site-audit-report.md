# DentalStory WebApp Full Audit Report

Date: 2026-03-23  
Scope: local (`http://localhost:3000`) + production (`https://www.dentalstory.ua`)  
Audit areas: UI/UX, functional flows, accessibility, responsive behavior, performance signals, SEO, security, content and i18n

## 1) Execution Summary

- Completed route/surface inventory and state matrix: `docs/audits/2026-03-23-route-inventory-and-test-matrix.md`.
- Created dedicated test accounts and seeded audit data in Supabase project `exgpwtyrkkhwqqdgqbkz`.
- Ran baseline quality checks:
  - `npm run lint` (pass)
  - `npm run typecheck` (pass)
  - `npm run test` (40/40 pass)
  - `npm run test:e2e:auth` (7/7 pass)
  - `npm run build` (pass; middleware deprecation addressed later via `proxy.ts`)
- Performed browser-based page-by-page sweeps on local and production for public/auth flows.
- Ran dependency security audit (`npm audit --audit-level=moderate`) and header/robots/sitemap runtime checks.

### Follow-up (post-report implementation, 2026-03-23)

- **Tailwind ↔ CSS variables**: `tailwind.config.js` `dental.*` palette (especially `primary-600`/`700`, `muted`, `error*`, `dental-teal` / `dental-green`) was synced with `:root` tokens in `src/styles/globals.css` so utilities like `bg-dental-primary-600` meet WCAG AA for white text (previously config still used legacy `#5A8A94`).
- **A11y automation**: `scripts/a11y-audit.mjs` now defaults to `http://localhost:3000` and spawns `next dev` if Next is not up (no Vite). `@axe-core/playwright` wired in `package.json`.
- **Forms**: `Input` / `Textarea` / `Select` default classes include `text-gray-900` and `placeholder:text-gray-600` where applicable.
- **Axe (Playwright)**: `scripts/a11y-audit.mjs` перевіряє **10** публічних URL (див. секцію **G** у матриці маршрутів); останній локальний прогін — **0** порушень `wcag2a` + `wcag2aa` (переперевіряти після змін UI).
- **`/booking/success` guard**: client redirects to `/booking` if there is no `?ref=` and no `last_booking` in `localStorage`; if only `last_booking` exists, URL is normalized with `?ref=`.
- **Clinic hours**: canonical schedule in `src/config/clinicSchedule.ts` — used by `CONTACT_INFO.workingHours`, JSON-LD (`StructuredData`), and `generateOrganizationSchema` (`seo.ts`); footer i18n strings (uk/en/pl) aligned to **Пн-Пт 9:00–20:00**, **Сб 10:00–18:00**.
- **Reviews list**: `getReviews()` uses `AbortSignal.timeout(15s)` to avoid hanging UI.
- **Dependencies**: `dompurify` bumped (XSS advisory). Transitive **PWA/Workbox** issue (`serialize-javascript` RCE advisory) fixed **without removing PWA**: `package.json` → `overrides` forces `serialize-javascript@7.0.4` for the whole tree; after `npm install`, `npm audit` reports **0** vulnerabilities (re-verify after any `next-pwa`/workbox upgrade).
- **i18n (sign-up)**: aria-labels for показати/сховати пароль використовують існуючі ключі `auth.login.showPassword` / `auth.login.hidePassword` (раніше викликались неіснуючі `auth.showPassword` → сирі ключі в UI).
- **Reviews / API**: `fetch` при `AbortError` (у т.ч. `AbortSignal.timeout` у `getReviews`) мапиться на `APIError` з `code: 'ABORTED'`; сторінка відгуків показує `reviews.list.timeoutError` замість загального `loadError`.
- **Layout UX**: `main` має нижній відступ (`pb-28` / `sm:pb-24`), щоб рідше перекривати контент плаваючим radial/chat (audit: overlap на вузьких екранах).
- **CI**: після `next build` — підняття prod-сервера, `wait-on`, `npm run a11y:audit`; `npm audit` у окремому job без `continue-on-error`.
- **i18n (lazy EN/PL)**: `initializeLanguage()` замінено на **`initializeI18nFromStorage()`** — після гідрації **await** `setLanguage`, щоб бандл мови був у дереві до `changeLanguage` (менше ризику «сирих ключів» на `/services` тощо).
- **Mobile overflow**: кореневий layout `min-w-0 overflow-x-clip`, header `min-w-0 overflow-x-clip`, hero CTA `flex-wrap min-w-0`, у `globals.css` — `min-width: 0` для `.min-h-screen.flex`.
- **Floating UI**: radial / чат / a11y-панель з **safe-area** (`env(safe-area-inset-*)`) для iOS.
- **A11y routes**: `scripts/a11y-audit.mjs` розширено до `/gallery`, `/auth/login`, `/auth/sign-up`, `/privacy-policy`, `/terms-of-service`.
- **CI hardening**: `playwright install chromium --with-deps`; у job **Security Audit** додано **`npm ci`** (раніше audit без lockfile).

## 2) Test Access Provisioned

Created via Supabase MCP:

- Patient:
  - email: `audit.patient+20260323@dentalstory.ua`
  - password: `AuditPass!2026`
  - user_id: `0d26da5d-47d7-4c58-a030-0cbf8f7c4081`
- Admin:
  - email: `audit.admin+20260323@dentalstory.ua`
  - password: `AuditPass!2026`
  - user_id: `080c5197-f45c-4b45-9df9-836939753b9d`
  - role row inserted in `public.admin_users` with role `admin`
- Seeded appointment:
  - appointment_id: `8bfa02f0-f618-429b-b8aa-7d6d7ffaf13d`
  - source: `audit_seed`

## 3) Critical Findings (Must Fix First)

1. **Mobile horizontal overflow (layout break)** _(mitigated in code)_
   - Area: multiple pages on narrow viewport
   - Severity: Critical (at time of audit)
   - Evidence: browser audit found horizontal scroll at ~375px on key screens.
   - Risk: degraded mobile UX and hidden content/tap targets.
   - Recommendation: identify offending container(s), enforce `max-w-full` and `overflow-x-clip` strategy on root wrappers, verify hero/header/floating widgets on 320/360/375 widths.
   - **Update:** root shell + header clipping, flex `min-w-0`, hero CTA wrap; re-verify on real devices after deploy.

2. **Security policy is report-only, not enforced** _(addressed in code)_
   - Area: `middleware.ts`
   - Severity: Critical (at time of audit)
   - Evidence: `Content-Security-Policy-Report-Only` header set, but no enforced `Content-Security-Policy`.
   - Risk: CSP violations are logged only; XSS blast radius remains larger than necessary.
   - Recommendation: graduate policy to enforced CSP (possibly staged rollout route-by-route), keep reporting endpoint in parallel.
   - **Update:** `Content-Security-Policy` is enforced by default; set `CSP_REPORT_ONLY=true` to revert to report-only; report-only header can mirror for monitoring.

3. **Dependency vulnerabilities (moderate/high)** _(largely addressed in repo)_
   - Area: package graph
   - Severity: Critical (at time of audit)
   - Evidence: `npm audit` reports 13 vulnerabilities (4 moderate, 9 high), including `next`, `rollup`, `minimatch`, `flatted`.
   - Risk: known CVEs in production dependency tree.
   - Recommendation: execute controlled upgrades (`npm audit fix` + targeted dependency bumps), then full regression suite.
   - **Update:** `npm audit fix` (non-force) + `dompurify` bump + **`overrides.serialize-javascript: 7.0.4`** to patch the Workbox/`@rollup/plugin-terser` transitive chain while keeping `@ducanh2912/next-pwa`. Re-run `npm audit` after dependency upgrades.

## 4) High Findings

1. **Reviews page perceived as infinite loading in browser sweep**
   - Route: `/reviews`
   - Severity: High
   - Note: code has proper `finally { setLoading(false) }` in `src/views/Reviews.tsx`; likely runtime/data/API behavior rather than obvious client logic deadlock.
   - Recommendation: inspect runtime network for `/api/reviews` response status and payload; add explicit timeout + user-facing fallback if backend hangs.

2. **A11y script not runnable from clean repo state** _(resolved)_
   - Area: `scripts/a11y-audit.mjs`
   - Severity: High (at time of audit)
   - Evidence: fails with `ERR_MODULE_NOT_FOUND` for `@axe-core/playwright`.
   - Risk: declared a11y audit exists but is not executable in CI/dev by default.
   - Recommendation: add `@axe-core/playwright` as dev dependency and wire script into `package.json` (`a11y:audit`) plus CI optional job.
   - **Update:** `@axe-core/playwright` added; `npm run a11y:audit` runs against Next on port 3000.

3. **Deprecated Next.js middleware convention** _(resolved)_
   - Area: build output
   - Severity: High (at time of audit)
   - Evidence: build warning: middleware file convention deprecated; move to `proxy`.
   - Risk: future framework updates could break behavior.
   - Recommendation: migrate from `middleware.ts` to `proxy` convention per Next.js guidance.
   - **Update:** migrated from `middleware.ts` to `proxy.ts`; build no longer reports this warning.

## 5) Medium Findings

1. **i18n key leakage observed in browser audit** _(root cause fixed for sign-up)_
   - Routes: `/services`, `/auth/sign-up`
   - Severity: Medium
   - Evidence: UI showed raw keys in audit run; locale files do contain related keys, so this is likely namespace resolution/loading mismatch rather than missing text.
   - Recommendation: validate `useTranslation` namespaces per page and ensure keys resolve from active namespace in production bundle.
   - **Update:** `/auth/sign-up` used `t('auth.hidePassword')` / `t('auth.showPassword')`, but strings live under `auth.login.*` (same as `/auth/login`). Updated to `auth.login.hidePassword` / `auth.login.showPassword`. **Additionally:** `initializeI18nFromStorage()` awaits lazy bundle load before switching away from Ukrainian.

2. **Content inconsistency in working hours across UI blocks** _(addressed in code)_
   - Severity: Medium (at time of audit)
   - Evidence: header/footer/contact time ranges reported as inconsistent in browser pass.
   - Recommendation: centralize clinic schedule in a single config source and render everywhere from that source.
   - **Update:** `src/config/clinicSchedule.ts` + aligned `CONTACT_INFO`, schema, SEO helper, footer locales, toast copy.

3. **Direct open of success screen needs stricter guard** _(addressed in code)_
   - Route: `/booking/success`
   - Severity: Medium (at time of audit)
   - Evidence: direct navigation can show generic success state.
   - Recommendation: require booking context/query token; otherwise redirect to `/booking`.
   - **Update:** redirect unless `?ref=` or `localStorage.last_booking` can supply `ref` (see `BookingSuccess.tsx`).

## 6) Low Findings / UX Polish

- Hero and gallery progressive loading experience can be improved (skeletons/placeholders/clearer affordances).
- Floating action elements may overlap content on smaller viewports _(partially mitigated: main bottom padding + safe-area on floating widgets)_.
- CTA hierarchy can be clearer (primary vs secondary emphasis).
- Minor copy polish and consistency opportunities in marketing sections.

## 7) Accessibility, SEO, Security, Performance Snapshot

### Accessibility

- Manual/browser checks indicate keyboard and skip-link foundations are present (`app/layout.tsx` includes skip link).
- Automated a11y: `npm run a11y:audit` (Playwright + axe) passes on key public routes when `npm run dev` is serving `localhost:3000` (see Follow-up above).

### SEO

- `app/layout.tsx` contains metadata + OG + Twitter defaults.
- `app/robots.ts` and `app/sitemap.ts` are present and production-accessible.
- Runtime check:
  - `https://www.dentalstory.ua/robots.txt` responds correctly.
  - `https://www.dentalstory.ua/sitemap.xml` accessible.

### Security

- Positive: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` are set.
- CSP: enforced in root **`proxy.ts`** (Next.js 16 proxy convention) by default; `CSP_REPORT_ONLY=true` restores report-only for troubleshooting.

### Performance

- Build succeeds; no immediate compile-level regressions.
- Lighthouse could not run in current environment due missing Chrome binary.
- Recommend adding CI-compatible Lighthouse (or PageSpeed API) to track LCP/CLS/INP consistently.

## 8) Verification Evidence (Executed)

- `npm run lint` -> pass
- `npm run typecheck` -> pass
- `npm run test` -> pass (40 tests)
- `npm run test:e2e:auth` -> pass (7 tests)
- `npm run build` -> pass (middleware deprecation warning removed after `proxy.ts` migration)
- `node scripts/a11y-audit.mjs` (with dev on :3000) -> pass, 0 axe violations on audited public routes
- `npm audit` / `npm audit --audit-level=moderate` -> pass locally after overrides + fixes _(re-verify on each lockfile change)_
- `curl.exe -I https://www.dentalstory.ua` -> security headers present; re-check CSP after deploy of **`proxy.ts`** changes

## 9) Prioritized Fix Roadmap

### Phase 0 (same day)

- ~~Enforce/roll out CSP~~ (done in repo; verify on production).
- ~~Fix mobile overflow on top public routes~~ _(mitigated: root/header clip, flex `min-w-0`, hero wrap; verify on device)_.
- ~~Make a11y tooling runnable~~ (`@axe-core/playwright` + script; `a11y:audit` green on key routes).

### Phase 1 (1-2 days)

- ~~Resolve dependency vulnerabilities~~ _(current tree: `npm audit` clean; maintain `overrides.serialize-javascript` or upstream workbox fix when upgrading `@ducanh2912/next-pwa`)_.
- ~~Investigate `/reviews` runtime loading behavior and add robust timeout/error UX~~ (15s fetch timeout on `getReviews`).
- ~~Guard `/booking/success` direct access~~.

### Phase 2 (2-4 days)

- ~~Standardize hours/content source and remove text inconsistencies~~ (centralized via `src/config/clinicSchedule.ts` + aligned `ts/json` locales).
- ~~Clean i18n namespace/key resolution in affected screens~~ (sign-up password toggle keys fixed; monitor lazy-locale edge cases).
- ~~Add CI gate: axe audit~~ (runs in `build` job: `next start` + `npm run a11y:audit` via `wait-on`). Performance (Lighthouse/PageSpeed) — still open.

## 10) Cleanup SQL (after audit)

If needed, remove seeded audit users/data:

```sql
delete from public.appointments where source = 'audit_seed';
delete from public.admin_users where id in (
  select id from auth.users where email in ('audit.admin+20260323@dentalstory.ua')
);
delete from public.patients where id in (
  select id from auth.users where email in ('audit.patient+20260323@dentalstory.ua', 'audit.admin+20260323@dentalstory.ua')
);
delete from auth.identities where user_id in (
  select id from auth.users where email in ('audit.patient+20260323@dentalstory.ua', 'audit.admin+20260323@dentalstory.ua')
);
delete from auth.users where email in ('audit.patient+20260323@dentalstory.ua', 'audit.admin+20260323@dentalstory.ua');
```

---

## 11) Статус імплементації (чітко)

**Легенда**

| Символ | Значення                                                    |
| ------ | ----------------------------------------------------------- |
| ✅     | Зроблено в коді / автоматичні перевірки в репо проходять    |
| ⚠️     | Частково (потрібна ручна перевірка або прийнятий компроміс) |
| ❌     | Не робилось / свідомо відкладено                            |
| 🔍     | Тільки після деплою на production або на реальному пристрої |

### A. Знахідки з аудиту (по severity)

| ID  | Тема                                                           | Статус | Коментар                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Mobile horizontal overflow                                     | ⚠️     | У коді: `overflow-x` на root, `min-w-0`, clip у header, wrap у hero CTA, safe-area у floating. **Підтвердження 0px scroll** — лише 🔍 на 320–390px.                                                                                                                                                                                                                                               |
| C2  | CSP report-only                                                | ✅     | У репо: enforced CSP у `proxy.ts` + опція `CSP_REPORT_ONLY`. **Валідація на домені** — 🔍 (`curl`/консоль після деплою).                                                                                                                                                                                                                                                                          |
| C3  | Залежності (npm audit)                                         | ✅     | `npm audit` — 0 у дереві; `serialize-javascript` через `overrides`. Повторно ганяти після **кожного** апдейту `next-pwa`/lockfile.                                                                                                                                                                                                                                                                |
| H1  | `/reviews` «вечне завантаження»                                | ✅     | Таймаут 15s на `getReviews`, `ABORTED` → текст `reviews.list.timeoutError`, retry.                                                                                                                                                                                                                                                                                                                |
| H2  | Скрипт a11y не запускався                                      | ✅     | `@axe-core/playwright`, `npm run a11y:audit`, CI після `build`.                                                                                                                                                                                                                                                                                                                                   |
| H3  | Deprecated `middleware.ts`                                     | ✅     | Міграція на `proxy.ts`.                                                                                                                                                                                                                                                                                                                                                                           |
| M1  | i18n сирі ключі (services / sign-up)                           | ⚠️     | Sign-up: виправлені ключі; lazy EN/PL: `initializeI18nFromStorage()` з await. **Повторний скрін на EN/PL** — 🔍.                                                                                                                                                                                                                                                                                  |
| M2  | Різні години роботи в UI                                       | ✅     | `clinicSchedule.ts` + footer + `CONTACT_INFO` + schema + toast.                                                                                                                                                                                                                                                                                                                                   |
| M3  | `/booking/success` без контексту                               | ✅     | Редірект / нормалізація `?ref=` через `ref` + `last_booking`.                                                                                                                                                                                                                                                                                                                                     |
| L1  | Hero / gallery — skeletons                                     | ❌     | Не в імплементації (polish).                                                                                                                                                                                                                                                                                                                                                                      |
| L2  | Floating overlap vs контент                                    | ⚠️     | `main` pb + safe-area; **не гарантує** повний відсутність у всіх кейсах — 🔍.                                                                                                                                                                                                                                                                                                                     |
| L3  | CTA ієрархія                                                   | ❌     | Не в імплементації (UX polish).                                                                                                                                                                                                                                                                                                                                                                   |
| L4  | Маркетинговий копірайт                                         | ❌     | Не в імплементації.                                                                                                                                                                                                                                                                                                                                                                               |
| L5  | Dropdown / native `<select>` UI (кути, touch, мобільна ширина) | ✅     | **`Select`** (`Input.tsx`): `selectSize` = `default` \| `compact` \| `dense`, `appearance-none` + chevron, узгоджені кути з `Input`/`Textarea` (`rounded-2xl`, touch). **`CustomSelect`**, **`LanguageSwitcher`**: оновлені раніше. **Усі сирі `<select>` у `src/views/admin/*`, `CallbackRequest`** переведені на `Select` + aria/i18n де потрібно. Матриця примітивів: `route-inventory` §F–§H. |

### B. Зрізи (A11y / SEO / Security / Perf)

| Область                         | Статус | Коментар                                                             |
| ------------------------------- | ------ | -------------------------------------------------------------------- |
| A11y (axe, 10 URL)              | ✅     | У CI + локально; **не** покриває cabinet/admin/symptom-checker тощо. |
| SEO (metadata, robots, sitemap) | ✅     | Код + згадані runtime checks на prod у звіті.                        |
| Security headers (без CSP)      | 🔍     | Перевіряли `curl` на prod; після змін **`proxy.ts`** — повторити 🔍. |
| Performance (Lighthouse)        | ❌     | Не автоматизовано в CI; у звіті — рекомендація.                      |

### C. Матриця маршрутів vs автоматизація

| Що                                     | Статус                                                          |
| -------------------------------------- | --------------------------------------------------------------- |
| Повний перелік маршрутів і сценаріїв   | ✅ Документ у `route-inventory-and-test-matrix.md`              |
| **Усі** маршрути з матриці пройшли axe | ❌ Axe лише на **10** публічних URL (секція G матриці)          |
| E2E auth                               | ✅ 7 тестів (обмежений scope)                                   |
| E2E UI smoke (`test:e2e:ui-smoke`)     | ✅ Select на `/contact`, `/booking`, `/reviews` + мова в header |
| Unit tests                             | ✅ 40 тестів (не покривають весь сайт)                          |

### D. Тестові дані Supabase

| Що                        | Статус                                          |
| ------------------------- | ----------------------------------------------- |
| Створення акаунтів + seed | ✅ (описано в §2)                               |
| Видалення після аудиту    | ❌ SQL у §10 — виконай вручну, коли не потрібно |

### Підсумок одним реченням

**Аудит задокументовано повністю; критичні та більшість high/medium пунктів — імплементовані в коді;** залишок — **перевірки на prod/пристроях**, **Lighthouse**, **UX polish**, **непокриті маршрути в axe**, **cleanup SQL** — це не «недоробив», а **явно відкритий хвіст**, тепер зафіксований у таблиці вище.

**Методологія деталізації (після 2026-03-23):** «Повний аудит» вимагає **двох шарів** — маршрути (таблиці A–D у матриці) **і** матрицю UI-примітивів (**§F–§H** у `2026-03-23-route-inventory-and-test-matrix.md`). Без другого шару не гарантується перевірка дропдаунів, інпутів і спільних контролів поза сторінковим «окном».
