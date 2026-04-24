# Dental Story — Architecture Map

**App:** dental-story-webapp v3.0.0
**Stack:** Next.js 16 (App Router) · React 18 · TypeScript · Tailwind 3 · Supabase (SSR + RLS) · Upstash Redis · Resend · Monobank · Sentry · Playwright + Vitest
**Generated:** 2026-04-20 (spot-checked against filesystem)

---

## 1. Top-level layout

```
WebApp/
├── app/                        Next.js App Router — pages, layouts, API route handlers
├── src/                        Components, hooks, services, lib, utils, i18n, views
├── supabase/migrations/        28 SQL migrations (schema + RLS). No functions/ dir.
├── scripts/                    a11y audit, seed/preprod, env linking, turbopack cache clean
├── public/                     Static assets, favicons, manifest, sitemap, web.config
├── e2e/                        Playwright specs (auth-flows, live, smoke)
├── proxy.ts                    Edge middleware — CSP/nonce, security headers, Supabase session refresh
├── instrumentation.ts          Sentry register hook (server + edge)
├── sentry.server.config.ts     Sentry init (Node runtime) — replay + traces
├── sentry.edge.config.ts       Sentry init (Edge runtime) — tunneled via /monitoring
├── next.config.ts              withPWA → withSentryConfig → withBundleAnalyzer; image remotes; workbox caching; .com.ua → .ua redirect
├── tailwind.config.js          Semantic tokens (dental-primary-600, dental-dark, …)
├── playwright*.config.ts       auth / auth.live / auth.links.live / live / base configs
├── vitest.config.ts            Unit tests
└── CLAUDE.md, README.md, CHANGELOG.md
```

Conventions worth noting: there is **no `middleware.ts`** — the file is called `proxy.ts` and is wired through Vercel's Edge runtime. All mutations go through **API route handlers**, not Server Actions (no `"use server"` directive exists anywhere in the repo).

---

## 2. Routes

### 2.1 Public pages

| Route                     | File                                                 |
| ------------------------- | ---------------------------------------------------- |
| `/`                       | `app/page.tsx`                                       |
| `/about`                  | `app/about/page.tsx`                                 |
| `/booking`                | `app/booking/page.tsx`                               |
| `/booking/success`        | `app/booking/success/page.tsx`                       |
| `/booking/payment-result` | `app/booking/payment-result/page.tsx`                |
| `/contact`                | `app/contact/page.tsx`                               |
| `/gallery`                | `app/gallery/page.tsx`                               |
| `/reviews`                | `app/reviews/page.tsx`                               |
| `/services`               | `app/services/page.tsx`                              |
| `/symptom-checker`        | `app/symptom-checker/page.tsx`                       |
| `/privacy-policy`         | `app/privacy-policy/page.tsx`                        |
| `/terms-of-service`       | `app/terms-of-service/page.tsx`                      |
| `/api-docs`               | `app/api-docs/page.tsx`                              |
| `/patient/[id]`           | `app/patient/[id]/page.tsx` (public patient profile) |

Root-level infra: `layout.tsx`, `providers.tsx`, `i18n-provider.tsx`, `app-initializer.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`.

### 2.2 Auth pages

| Route                   | File                                | Notes                       |
| ----------------------- | ----------------------------------- | --------------------------- |
| `/auth/login`           | `app/auth/login/page.tsx`           | Patient sign-in             |
| `/auth/sign-up`         | `app/auth/sign-up/page.tsx`         |                             |
| `/auth/sign-up-success` | `app/auth/sign-up-success/page.tsx` |                             |
| `/auth/callback`        | `app/auth/callback/page.tsx`        | OAuth / email link exchange |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` |                             |
| `/auth/reset-password`  | `app/auth/reset-password/page.tsx`  |                             |

### 2.3 Patient cabinet — `app/cabinet/`

Auth-guarded by `CabinetLayoutClient.tsx` (wrapped by `layout.tsx`). Has `loading.tsx` + `error.tsx`.

| Route                   | File                                |
| ----------------------- | ----------------------------------- |
| `/cabinet`              | `app/cabinet/page.tsx`              |
| `/cabinet/appointments` | `app/cabinet/appointments/page.tsx` |
| `/cabinet/profile`      | `app/cabinet/profile/page.tsx`      |
| `/cabinet/treatments`   | `app/cabinet/treatments/page.tsx`   |
| `/cabinet/payments`     | `app/cabinet/payments/page.tsx`     |
| `/cabinet/settings`     | `app/cabinet/settings/page.tsx`     |

### 2.4 Admin console — `app/admin/`

Guarded by `AdminLayoutClient.tsx` + the `useAdminAuth()` / `useAdminPageAccess()` hooks. Admin identity lives in `admin_users` with a role column; RBAC matrix is centralized in `src/lib/permissions.ts`.

| Route                    | File                                 | Typical role required |
| ------------------------ | ------------------------------------ | --------------------- |
| `/admin/login`           | `app/admin/login/page.tsx`           | public (sign-in)      |
| `/admin`                 | `app/admin/page.tsx`                 | any admin             |
| `/admin/analytics`       | `app/admin/analytics/page.tsx`       | admin / analyst       |
| `/admin/appointments`    | `app/admin/appointments/page.tsx`    | admin / doctor        |
| `/admin/patients`        | `app/admin/patients/page.tsx`        | admin                 |
| `/admin/doctors`         | `app/admin/doctors/page.tsx`         | admin                 |
| `/admin/services`        | `app/admin/services/page.tsx`        | admin                 |
| `/admin/treatments`      | `app/admin/treatments/page.tsx`      | doctor+               |
| `/admin/materials`       | `app/admin/materials/page.tsx`       | inventory_manager+    |
| `/admin/orders`          | `app/admin/orders/page.tsx`          | assistant+            |
| `/admin/contacts`        | `app/admin/contacts/page.tsx`        | admin                 |
| `/admin/reviews`         | `app/admin/reviews/page.tsx`         | admin                 |
| `/admin/chat`            | `app/admin/chat/page.tsx`            | admin                 |
| `/admin/email-templates` | `app/admin/email-templates/page.tsx` | superadmin            |
| `/admin/users`           | `app/admin/users/page.tsx`           | superadmin            |
| `/admin/settings`        | `app/admin/settings/page.tsx`        | superadmin            |
| `/admin/data-quality`    | `app/admin/data-quality/page.tsx`    | analyst+              |
| `/admin/health`          | `app/admin/health/page.tsx`          | superadmin            |

### 2.5 API route handlers — `app/api/` (42 files)

**Public**

- `GET /api/doctors`, `GET /api/services`, `GET /api/appointments/slots`
- `POST /api/contacts`, `POST /api/reviews`, `POST /api/newsletter`, `POST /api/feedback/form`
- `POST /api/turnstile/verify`, `GET /api/health`
- `POST /api/payments/create`, `GET /api/payments/status/[invoiceId]`, `POST /api/payments/monobank-webhook` (service-role)

**Authenticated (patient)**

- `GET|POST /api/appointments`, `GET|PATCH|DELETE /api/appointments/[id]`
- `GET /api/appointments/[id]/summary`, `POST /api/appointments/[id]/reminder-preference`
- `PATCH /api/appointments/[id]/reschedule`, `PATCH /api/appointments/[id]/cancel`
- `POST /api/ai/chat` (streamed), `GET /api/ai/recommendations`
- `POST /api/cabinet/delete-account` (GDPR), `GET /api/cabinet/export` (GDPR)

**Admin-gated** (via `requireRole()` in `src/lib/api-role-guard.ts`)

- `/api/admin/analytics`, `/api/admin/inventory-analytics`, `/api/admin/data-quality`, `/api/admin/health`, `/api/admin/cron-health`, `/api/admin/export`, `/api/admin/audit-logs`
- `/api/admin/users`, `/api/admin/users/[id]`
- `/api/materials`, `/api/materials/[id]`, `/api/materials/[id]/upload-image`
- `/api/material-orders`, `/api/material-orders/[id]`
- `/api/treatment-records`, `/api/treatment-records/[id]`

**Cron** (Vercel Cron, `CRON_SECRET` header)

- `POST /api/cron/notifications` — drain `notification_events` queue (every 5 min)
- `POST /api/cron/reminders` — schedule tomorrow's reminders (daily 18:00 UTC)
- `POST /api/cron/low-stock-alerts` — inventory below `min_stock_level`

**E2E helper**

- `GET /api/e2e/auth-links` — issue test magic links (local/preview only)

---

## 3. Server Actions

None. A recursive grep for `"use server"` and `'use server'` across `src/` and `app/` returns zero matches. The codebase intentionally uses REST-style route handlers plus a thin client service layer (`src/services/*`) for all mutations.

---

## 4. Supabase layer

### 4.1 Migrations (`supabase/migrations/`, 28 files)

| Date       | File                                                   | Purpose                                                                                                                           |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| genesis    | `00000000000000_full_schema.sql`                       | Base schema: doctors, services, appointments, patients, reviews, contact_submissions, working_hours, chat_sessions, chat_messages |
| 2026-03-18 | `20260318_live_chat.sql`                               | Realtime chat tables + pub/sub                                                                                                    |
| 2026-03-20 | `20260320_admin_users.sql`                             | `admin_users` with role column                                                                                                    |
| 2026-03-21 | `20260321_admin_audit_and_restore.sql`                 | Audit log table + restore safeguards                                                                                              |
| 2026-03-21 | `20260321_align_rls_admin_checks.sql`                  | Standardize RLS to use `is_admin()`                                                                                               |
| 2026-03-21 | `20260321_clinical_and_inventory.sql`                  | Treatment records, materials, inventory, material_orders                                                                          |
| 2026-03-21 | `20260321_expand_notification_events.sql`              | Extend notification type enum                                                                                                     |
| 2026-03-21 | `20260321_notification_scheduled_at.sql`               | Deferred notifications                                                                                                            |
| 2026-03-22 | `20260322_remove_legacy_admin_claim.sql`               | Drop deprecated JWT `is_admin` claim                                                                                              |
| 2026-03-23 | `20260323_admin_restore_safeguards.sql`                | Re-apply admin RLS after bulk op                                                                                                  |
| 2026-03-23 | `20260323_admin_users_add_missing_columns.sql`         | Role constraint validation                                                                                                        |
| 2026-03-23 | `20260323_admin_users_rls_policies.sql`                | self-read + admin-manage                                                                                                          |
| 2026-03-23 | `20260323_appointment_reminder_preferences.sql`        | Per-appointment reminder opt-out                                                                                                  |
| 2026-03-23 | `20260323_feedback_and_notification_events.sql`        | `form_feedback_events`, `notification_events` queue                                                                               |
| 2026-03-24 | `20260324_security_linter_hardening.sql`               | Supabase Security Linter fixes                                                                                                    |
| 2026-04-06 | `20260406_role_expansion.sql`                          | receptionist, billing_manager, inventory_manager, analyst                                                                         |
| 2026-04-07 | `20260407_materials_enhancement.sql`                   | Image URL + storage location on materials                                                                                         |
| 2026-04-08 | `20260408_add_billing_manager_role.sql`                | Billing manager permissions                                                                                                       |
| 2026-04-08 | `20260408_add_inventory_and_analyst_roles.sql`         | Inventory + analyst permissions                                                                                                   |
| 2026-04-08 | `20260408_chat_role_based_access.sql`                  | Chat RLS by role                                                                                                                  |
| 2026-04-08 | `20260408_fix_doctor_scope_rls.sql`                    | Doctor sees only own appointments                                                                                                 |
| 2026-04-09 | `20260409_fix_rls_jwt_to_function.sql`                 | Use `auth.uid()` instead of JWT parsing                                                                                           |
| 2026-04-09 | `20260409_remove_senior_assistant_and_staff_roles.sql` | Consolidate roles                                                                                                                 |
| 2026-04-17 | `20260417_fix_doctor_scope_rls_v2.sql`                 | Refine doctor scope RLS                                                                                                           |
| 2026-04-18 | `20260418_notification_events_processing_status.sql`   | `processing_status`, `attempts`, `error`                                                                                          |
| 2026-04-19 | `20260419_payment_system.sql`                          | `payment_configs`, `payments`, Monobank fields                                                                                    |
| 2026-04-19 | `20260419_cron_runs.sql`                               | Track cron execution history                                                                                                      |
| 2026-04-20 | `20260420_ai_usage.sql`                                | AI token usage + cost log                                                                                                         |

There is also `RESEED_PHASE_1_CRITICAL.sql` at the repo root (one-off reseed script, not under migrations). No `supabase/functions/` directory — all background work runs via Vercel Cron hitting API routes.

### 4.2 Tables by domain

**Clinical core**

- `doctors` — public read (is_active), admin_all
- `services` — public read (is_active), admin_all
- `working_hours` — public read, admin_all
- `appointments` — own_read, insert_public (guest bookings allowed), own_update, admin_all

**Users**

- `patients` (PK = `auth.users.id`) — own_read / own_update / own_insert
- `admin_users` (PK = `auth.users.id`) — self_read, admin_manage (via `is_admin()`)

**Chat**

- `chat_sessions` — select/insert/update scoped by role
- `chat_messages` — select/insert scoped by role

**Clinical records & inventory**

- `treatment_records` — patient_select (own), admin_all
- `treatment_record_items` — patient_select (own), admin_all
- `materials` — admin_all
- `material_inventory` — admin_all
- `material_orders`, `material_order_items` — scoped by creator / admin

**UGC & feedback**

- `reviews` — public_read (status='approved'), insert_public, admin_all
- `contact_submissions` — insert_public, admin_all
- `form_feedback_events` — insert_public

**System**

- `notification_events` — insert (service_role), admin_read
- `payment_configs` — select_public
- `payments` — insert_anon (create invoice), update_service_role (webhook), select_own
- `ai_usage` — service_insert, admin_read
- `cron_runs` — service_insert
- `newsletter_subscribers` — insert_public

### 4.3 RLS policy patterns

- **Public-read gates**: `is_active = true` (doctors/services/working_hours), `status = 'approved'` (reviews).
- **Own data**: every patient-facing table uses `auth.uid() = patient_id` (or PK-is-user-id).
- **Admin check**: centralized `is_admin()` / `is_admin_actor()` SQL functions query `admin_users` membership — replacing earlier JWT-claim approach (`20260322_remove_legacy_admin_claim.sql`, `20260409_fix_rls_jwt_to_function.sql`).
- **Doctor scope**: doctors see only appointments/records where `doctor_id = auth.uid()` (`20260408_fix_doctor_scope_rls.sql`, refined by v2).
- **Service role bypass**: Monobank webhook, cron processors, AI usage logging all use the service-role client and bypass RLS deliberately.

### 4.4 Key functions & triggers

- `handle_new_user()` — auto-create `patients` row on `auth.users` insert
- `is_admin()`, `is_admin_actor()` — admin membership check used across RLS
- `update_chat_session_on_message()` — trigger updates `last_message`, `unread_count`
- `set_payment_configs_updated_at()` — timestamp trigger

### 4.5 Edge Functions

None. The project intentionally standardizes on Vercel Cron + API routes rather than Supabase Edge Functions.

---

## 5. Key components & modules

### 5.1 Components (`src/components/`)

- **Booking**: `BookingForm.tsx`, `booking/BookingStepPersonal.tsx`, `booking/BookingStepService.tsx`, `booking/BookingSummary.tsx`, `booking/EditableField.tsx`
- **Admin**: `admin/AdminModal.tsx`, `admin/CronHealthWidget.tsx`, `admin/OnboardingTour.tsx`
- **AI / Chat**: `AIAssistant.tsx` (Vercel AI SDK streaming), `SmartRecommendations.tsx`, `LiveChat.tsx` (Supabase Realtime)
- **UI primitives**: `ui/Button.tsx`, `Input`, `Card`, `CustomSelect`, `DatePicker`, `Spinner`, `LoadingOverlay`, `AnimatedCard`, `LiveRegion` (a11y announcements)
- **A11y / nav**: `AccessibilityPanel.tsx`, `AccessibilityProvider.tsx`, `LanguageSwitcher.tsx`, `ClientFloatingButtons.tsx`, `RadialMenu.tsx`, `SiteHeader`, `Footer`, `SidebarNav`, `MobileTabBar`
- **Content**: `HeroSection`, `FAQ`/`FAQAccordion`, `BeforeAfterGallery`, `VideoTestimonials`, `GoogleMap`, `PriceCalculator`, `StarRating`
- **Forms**: `ContactForm`, `CallbackRequest`, `NewsletterSubscribe`, `ReminderSettings`, `MicroFeedback`, `Turnstile` (Cloudflare CAPTCHA)
- **System**: `ErrorBoundary`, `CookieConsent`, `StructuredData` (JSON-LD), `PerformanceMetrics`, `ResourcePreloader`, `LazyImage`, `Logo`, `SVGFilters`, `providers/ToastProvider`

### 5.2 Hooks (`src/hooks/`)

`useAdminAuth`, `useAdminPageAccess`, `useAdminPreferences`, `useAdminChat`, `useAccessibility`, `useAnalytics`, `useCSRF`, `useSubmissionCooldown`, `useFocusTrap`, `useScrollAnimation`, `useLiveChat`.

### 5.3 Services (`src/services/`)

Thin fetch wrappers over API routes: `api.ts` (base + CSRF), `appointments.ts`, `contacts.ts`, `doctors.ts`, `feedback.ts`, `reminders.ts`, `subscriptions.ts`.

### 5.4 Lib (`src/lib/`)

**Supabase**: `supabase/client.ts` (browser), `supabase/server.ts` (SSR), `supabase/middleware.ts` (session refresh), `supabase/admin.ts` (service-role), `supabase/audit.ts`.
**Security**: `api-security.ts` (rate limit, CSRF, response helpers), `api-role-guard.ts` (`requireRole()`), `permissions.ts` (role→permission matrix), `role-based-access.ts`.
**Infra**: `redis.ts` (Upstash + in-memory fallback), `email.ts` (Resend), `email-templates.ts`, `ai-usage.ts` (token/cost logging + daily IP budget), `monobank.ts` (webhook validation), `clinicards-client.ts`, `review-stats.ts`, `pagination.ts`.
**Tests**: `*.test.ts` colocated for `audit`, `redis`, `api-security`, `permissions`.

### 5.5 i18n

`src/i18n/` + `src/locales/{uk,en,pl}.json`. Default `uk`. Client-side init via `app/i18n-provider.tsx`; languages lazy-loaded after hydration through `initializeI18nFromStorage()` to avoid raw-key flash. Notably, `optimizePackageImports` in `next.config.ts` **excludes** i18next (intentional).

### 5.6 Views / Utils / Types

- `src/views/` — page-level composites (`Home`, `Gallery`, `Booking`, `NotFound`, `admin/*`, `patient/PatientDashboard`).
- `src/utils/` — `constants.ts` (CONTACT_INFO, SITE_INFO), `sentry.ts`, `logger.ts`, `validationSchemas.ts` (Zod), `turnstileVerify.ts`, `adminPreferences.ts`, `cookieConsent.ts`.
- `src/types/index.ts` — shared TypeScript types.

---

## 6. Cross-cutting infrastructure

### 6.1 Auth flow

1. Sign-up/login hits Supabase auth via the browser client.
2. Email link / OAuth callback lands on `/auth/callback` → exchanges code for session cookies.
3. **Every request** passes through `proxy.ts`, which calls `updateSession()` from `src/lib/supabase/middleware.ts` to refresh tokens and re-set HTTP-only cookies.
4. Server code reads the session via `src/lib/supabase/server.ts` (SSR client); RLS enforces access using `auth.uid()`.
5. Admin auth is a second check on top of a valid session — membership in `admin_users` + role — enforced in RLS (`is_admin()`) and at the API layer (`requireRole()` / `useAdminPageAccess`).

### 6.2 Rate limiting

Upstash Redis via `src/lib/redis.ts`; `checkRateLimit(request, limit, windowMs)` in `src/lib/api-security.ts` is invoked from API handlers. Default 60 req/min/IP; returns `429` + `Retry-After`. In-memory Map fallback if Redis is unavailable.

### 6.3 CSRF

`useCSRF()` on the client sets `X-CSRF-Token`; `validateCSRF()` checks it on POST/PATCH/DELETE. GET/HEAD/OPTIONS exempt.

### 6.4 Turnstile (Cloudflare CAPTCHA)

Widget via `components/Turnstile.tsx`; server verification at `/api/turnstile/verify` and inside `src/utils/turnstileVerify.ts`. Used on booking and contact forms.

### 6.5 Sentry

`instrumentation.ts` branches on runtime: loads `sentry.server.config.ts` or `sentry.edge.config.ts`. `onRequestError` captures RSC errors. Replay sample ~10%, `tracesSampleRate` ~0.1. Events are tunneled through `/monitoring` to dodge ad-blockers (route excluded from middleware matcher). Source maps uploaded at build time via `withSentryConfig`.

### 6.6 Security headers (`proxy.ts`)

Per-request CSP nonce, HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying geolocation/mic/camera, COOP `same-origin`.

### 6.7 Email & notifications

- Provider: **Resend**, wrapped in `src/lib/email.ts` with graceful degradation.
- Templates in `src/lib/email-templates.ts`: booking confirmation (patient + admin), reminder (T-24h, Kyiv-morning scheduled), cancellation, admin alert.
- Queue: inserts go into `notification_events` with optional `scheduled_at`. Drained every 5 min by `/api/cron/notifications` using `processing_status` + `attempts` to avoid double-sends.

### 6.8 Reminders & alerts (cron)

- `/api/cron/reminders` (daily 18:00 UTC) — enqueue reminders for tomorrow's appointments.
- `/api/cron/notifications` (every 5 min) — drain queue.
- `/api/cron/low-stock-alerts` (daily) — compare `material_inventory.current_quantity` vs `materials.min_stock_level`; queue alerts.
- All cron hits write a row to `cron_runs` for observability via `/admin/cron-health`.

### 6.9 AI

- Routes: `/api/ai/chat` (streamed), `/api/ai/recommendations`. Tools expose `getServices`, `getDoctors`, `getWorkingHours`.
- Client: `AIAssistant.tsx` via `useChat` from `@ai-sdk/react`.
- Usage logging in `src/lib/ai-usage.ts` — hashes client IP (SHA-256), records tokens + cost to `ai_usage`, enforces daily per-IP budget.

### 6.10 Payments (Monobank)

Flow: `/api/payments/create` calculates price + `payment_configs` mode (none / deposit / full) → creates Monobank invoice → client redirects. Monobank posts back to `/api/payments/monobank-webhook` (service-role), which updates `payments.status` and flips `appointments.is_paid`. Status poll at `/api/payments/status/[invoiceId]`. Webhook signature validated via `src/lib/monobank.ts`.

### 6.11 Caching

- **Redis (Upstash)**: 30–120 s TTL for analytics, services, doctors; invalidated on admin edits.
- **PWA / Workbox**: Google Fonts CacheFirst 1y; remote images CacheFirst 30d; API NetworkFirst 10s / 24h stale; static assets SWR 7d; HTML NetworkFirst with 24h stale.
- **Vercel Edge**: static 1y immutable; public API 60s / 300s SWR; admin API no-store; service worker no-cache.

### 6.12 Testing & QA

- **Vitest** for unit (colocated `*.test.ts` in `src/lib/`, `src/utils/`, `src/views/auth/`).
- **Playwright** suites with separate configs: `playwright.config.ts` (default), `playwright.auth.config.ts` (mocked Supabase), `playwright.live.config.ts` + `playwright.auth.live.config.ts` + `playwright.auth.links.live.config.ts` (hit a real env).
- **A11y**: `scripts/a11y-audit.mjs` with `@axe-core/playwright` — CI audits ~10 public routes against WCAG 2.1 AA.
- **Lint**: ESLint w/ `--max-warnings 100`; Prettier; commitlint; husky prepare hook.

---

## 7. At-a-glance request lifecycle

1. Browser → Vercel Edge → **`proxy.ts`**: rate-limit headers, CSP nonce, security headers, refresh Supabase session cookies.
2. Next.js router → layout tree (root `layout.tsx` → group layout → page). Admin/cabinet groups add client-side guards (`AdminLayoutClient` / `CabinetLayoutClient`).
3. Mutations → **client service** (`src/services/*`) → **API route handler** (`app/api/**/route.ts`):
   - `checkRateLimit` → `validateCSRF` → (optional) `requireRole` → Supabase server client → RLS enforces scope.
4. Async work → insert into `notification_events` → Vercel Cron drains → Resend.
5. Observability → Sentry (exceptions, RSC errors, Web Vitals), Vercel Analytics, `cron_runs`, `ai_usage`, admin audit logs.

---

_This map is a living document. If routes/tables drift, regenerate it the same way: verify with a filesystem scan, then update this file._
