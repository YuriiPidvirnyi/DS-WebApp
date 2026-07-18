# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

**Always base work on `develop`, never on `main`.**

- Feature branches: `git checkout -b feature/name develop`
- All PRs target `develop`, never `main`
- **Nothing merges into `main` directly.** Releases go: `feature/* → develop`, then a
  `release/*` branch is cut from `develop`, stabilized and tested, and only then merged
  into `main`. Flow: `feature/* → develop → release/* → main`
- **Only exception:** `hotfix/*` may merge straight into `main`, then must be back-merged
  into `develop`
- `develop` is the preprod environment — do NOT propose removing or skipping it

## Common Development Commands

### Build and Development

- `npm run dev` - Start Next.js development server (port 3000, Turbopack)
- `npm run dev:restart` - Free port 3000, clear `.next/dev/cache/turbopack`, then `npm run dev` (see also Claude Code `/restart_ds_web_app`). After the server is **Ready**, open **http://localhost:3000** in **Cursor’s built-in browser** (MCP `cursor-ide-browser` → navigate) so the tab is visible in the editor.
- `npm run dev:kill` / `npm run dev:clear-turbo` - Individual steps used by `dev:restart`
- `npm run build` - Build for production (Next.js)
- `npm run analyze` - Production build with bundle size analysis (`@next/bundle-analyzer`)
- `npm run start` - Start production server

### Code Quality and Testing

- `npm run lint` - Run ESLint (max 100 warnings allowed)
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking (full project)
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests once with Vitest
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:coverage` - Run tests with coverage

### End-to-End Testing

- `npm run test:e2e:ui-smoke` - Browser smoke: `Select` (contact / booking / reviews) + language dropdown (`e2e/ui-form-controls.smoke.spec.ts`, same dev server as auth mock)
- `npm run test:e2e:auth` - Run auth E2E tests (mocked Supabase)
- `npm run test:e2e:auth:live` - Run auth E2E tests against live Supabase
- `npm run test:e2e:auth:links:live` - Run auth email link tests (live)

### CI (GitHub Actions)

- **`ci.yml`** (push/PR to `main`/`develop`): `lint-and-typecheck` (ESLint + `tsc` + Prettier), `test` (Vitest with coverage), `e2e-ui-smoke`, and `e2e-feature-suites` (booking, cabinet, admin RBAC — mocked Supabase). The production build job was removed — Vercel's GitHub integration is the authoritative build gate.
- **a11y audit**: runs against the Vercel deployment URL in `preview-validate.yml` (on `deployment_status`) and on a weekly schedule in `weekly-a11y.yml` (opens a GitHub issue on violations) — not per-PR.
- **Security audit**: `npm audit --audit-level=moderate` runs weekly in `security-audit.yml` (not per-PR). Other workflows: `schema-validate.yml` (migration naming + dangerous DDL), `secret-scan.yml` (gitleaks), `auto-merge-dependabot.yml`.

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16 App Router (TypeScript)
- **Styling**: Tailwind CSS 4 (CSS-first `@theme` in `src/styles/globals.css`) + CSS custom properties
- **Fonts**: Nunito (headings) + Rubik (body) via `next/font/google`
- **Routing**: Next.js App Router (file-based, `app/` directory)
- **Auth**: Supabase (`@supabase/ssr`) — requires `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: i18next + react-i18next (Ukrainian default, EN + PL lazy-loaded). After hydration, `initializeI18nFromStorage()` in `app/i18n-provider.tsx` **awaits** `setLanguage` so en/pl bundles load before switching language (reduces raw-key flashes).
- **Icons**: Lucide React
- **PWA**: @ducanh2912/next-pwa with Workbox
- **Dependency overrides**: `package.json` → `overrides.serialize-javascript` is pinned to **7.0.4** so the transitive chain `workbox-build` → `@rollup/plugin-terser` does not pull vulnerable `serialize-javascript` ≤7.0.2 ([GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq)). This keeps PWA/Workbox without ripping out `@ducanh2912/next-pwa` or using `npm audit fix --force` to an older plugin version.
- **Monitoring**: Sentry (@sentry/nextjs), Vercel Analytics
- **Email**: Resend (`resend`) — transactional emails (booking confirmation, reminders, cancellation)
- **Cache**: Redis via @upstash/redis (requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- **Testing**: Vitest (unit), Playwright (e2e/auth)

### Key Directory Structure

```
app/                     # Next.js App Router pages
├── layout.tsx           # Root layout (fonts, metadata, providers)
├── page.tsx             # Homepage → renders src/views/Home
├── providers.tsx        # Client-side providers
├── i18n-provider.tsx    # i18n wrapper (client)
├── app-initializer.tsx  # Analytics + reminders init
├── about/               # /about route
├── admin/               # /admin route (auth-protected)
├── api/                 # API routes
├── auth/                # Auth flow (login, sign-up)
├── booking/             # /booking route
├── cabinet/             # Patient cabinet (auth-protected)
├── contact/             # /contact route
├── gallery/             # /gallery route
├── reviews/             # /reviews route
├── services/            # /services route
├── patient/[id]/        # /patient/[id] route
└── symptom-checker/     # AI symptom checker

src/
├── components/          # Reusable UI components
│   ├── ui/              # Basic UI primitives (Button, Input, Logo, etc.)
│   ├── admin/           # Admin-specific components
│   └── providers/       # Context providers
├── contexts/            # React contexts (AdminAuthContext)
├── content/             # Static JSON data (gallery, images)
├── hooks/               # Custom React hooks
├── i18n/                # i18next configuration
├── lib/                 # External service clients (supabase/, redis.ts)
├── locales/             # Translation files (uk, en, pl)
├── services/            # API services and external integrations
├── styles/              # globals.css (Tailwind base + brand CSS vars)
├── types/               # TypeScript types
├── utils/               # Utility functions
├── views/               # Page-level view components (imported by app/ pages)
└── test/                # Test utilities (test-utils.tsx)
```

### Brand System (v2)

Colors defined in the `@theme` block in `src/styles/globals.css` (Tailwind v4 is
CSS-first; there is no `tailwind.config.js`):

| Token                                | HEX       | Usage                           |
| ------------------------------------ | --------- | ------------------------------- |
| `dental.primary`                     | `#AECED3` | Surface fills, card backgrounds |
| `dental.primary-600` / `dental-teal` | `#3f6f79` | CTAs, links, focus rings        |
| `dental.dark` / `dental-navy`        | `#2C3E42` | Headings, dark text             |
| `dental.text`                        | `#4A5E63` | Body copy                       |
| `dental.secondary`                   | `#D1CAC0` | Warm neutral surfaces           |

**Accessibility rule**: Never use white text on Brand Blue (`#AECED3`) — contrast ratio fails WCAG AA.

**Fonts**: Nunito (`--font-nunito`) for headings, Rubik (`--font-rubik`) for body. Both loaded in `app/layout.tsx` via `next/font`.

### Development Patterns

#### Component Architecture

- Pages in `app/` are thin wrappers — actual content in `src/views/`
- UI primitives in `src/components/ui/`
- Next.js App Router handles code splitting automatically
- Error boundaries via `app/global-error.tsx` and `src/components/ErrorBoundary.tsx`
- Floating UI: `ClientFloatingButtons` renders `RadialMenu` + `AccessibilityPanel`

#### State Management

- Form state: React Hook Form + Zod schemas
- Global accessibility prefs: `AccessibilityProvider` (Context)
- API state: custom services with Redis caching in `src/lib/redis.ts`

#### Auth

- Supabase auth via `@supabase/ssr`
- Client: `src/lib/supabase/client.ts`
- Server: `src/lib/supabase/server.ts`
- Middleware: `src/lib/supabase/middleware.ts`
- Guard: All auth calls check env vars before initializing client

#### API Integration

- CliniCards API for available slots only (`src/lib/clinicards-client.ts`)
- Appointments CRUD: Supabase (source of truth)
- Sentry tunnel at `/monitoring`
- Rate limiting in `proxy.ts` middleware (60 req/min per IP)
- OpenAPI docs at `/api-docs`

#### Notifications & Email

- Queue: `notification_events` table in Supabase (type, appointment_id, recipient_email, status, scheduled_at)
- Processor: **Supabase Edge Function** `process-notifications` (Deno), drained every 5 min by `pg_cron` → `pg_net.http_post`; picks up `queued` events where `scheduled_at <= now()`, atomic-claims them, sends via the Resend REST API. Auth = `Authorization: Bearer <NOTIFY_FN_SECRET>` (matches the Vault secret `process_notifications_invoke_secret`); `verify_jwt=false`. See "Scheduled jobs" below.
- Reminder scheduler: `run_reminders_job()` plpgsql producer via `pg_cron` (daily 18:00 UTC), inserts `appointment_reminder` events for tomorrow's appointments, delivered 07:00 UTC
- Templates: `src/lib/email-templates.ts` — branded HTML emails (booking confirmation, reminder, cancellation, admin alert)
- Client: `src/lib/email.ts` — Resend wrapper with graceful fallback when not configured
- On booking: queues `booking_confirmation` (patient) + `new_booking_admin` (admin)
- On cancellation: queues `appointment_cancellation` (patient)
- On completion: queues `review_request` (patient, +2h, one per appointment ever) — post-visit Google review ask via `/r/google?src=email`
- Reminders: auto-scheduled 24h before appointment (deferred via `scheduled_at`)

#### Scheduled jobs (Supabase-native — migrated off Vercel Cron)

All five scheduled jobs run on **`pg_cron`** inside Supabase (not Vercel Cron). Migrations: `20260718_cron_runs_and_producers.sql` (observability table `cron_runs` + producer functions, schedules nothing) and `20260718_cron_schedules.sql` (the five `cron.schedule(...)` calls — the switch).

| pg_cron job              | Cadence (UTC) | Does what                                                                                   |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| `ds-drain-notifications` | `*/5 * * * *` | `pg_net.http_post` → `process-notifications` edge fn (the only sender; calls Resend)        |
| `ds-reminders`           | `0 18 * * *`  | `run_reminders_job()` — queues tomorrow's `appointment_reminder` events (deliver 07:00 UTC) |
| `ds-recall`              | `10 18 * * *` | `run_recall_job()` — 3-touch recall producer                                                |
| `ds-low-stock`           | `0 8 * * 1-5` | `run_low_stock_job()` — weekday low-stock admin alert (recipient from Vault)                |
| `ds-stock-metrics`       | `55 21 * * *` | `run_stock_metrics_job()` — wraps `snapshot_stock_metrics_daily()` for yesterday + today    |

- **Producers** are `SECURITY DEFINER` plpgsql, pure DB work, no HTTP/secret. **Only the sender** touches the network, gated by a Vault-stored bearer.
- **Secrets:** Vault holds `process_notifications_invoke_secret` (== edge-fn `NOTIFY_FN_SECRET`) and `admin_notification_email`. The edge fn also needs `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `SITE_URL` set as function secrets (dashboard/CLI — not settable via `deploy_edge_function`).
- **Observability:** every run writes `public.cron_runs` (status/processed/error/duration). The drain's HTTP outcome is in `net._http_response` + edge `get_logs`, **not** `cron.job_run_details` (pg_net is fire-and-forget). Edge-fn/producer source lives under `supabase/functions/process-notifications/` (keep `_shared/email-templates.ts` in sync with `src/lib/email-templates.ts`).

#### Welcome-pack promo campaign

- Patient intake questionnaire at `/anketa` (`patient_intake_forms` table) with `?promo=&src=` attribution from printed QR codes; staff queue at `/admin/intake`
- Gift redemptions: `promo_redemptions` (one per intake form / known patient), issued via `promo:redeem` permission (incl. receptionist) at `/admin/intake`
- Review funnel: `/r/google?src=<channel>` logs a click (`review_link_clicks`) and 302s to the Google write-review URL; print materials at `/promo/flyer`
- **Compliance invariant: the gift is tied to the questionnaire, never to a review.** Google's UGC policy bans review incentives and review gating — flyer copy (gift) and review-ask copy must stay on separate materials/touchpoints

#### Clinical Records & Inventory

- **Treatment records**: `treatment_records` + `treatment_record_items` tables
  - Admin creates treatment acts linking appointment → patient → doctor → services performed
  - Each item tracks service, tooth number, quantity, price at time of service
  - Status flow: draft → signed → completed
  - Payment tracking: unpaid, partial, paid, waived, refunded
  - Patient views own treatment history at `/cabinet/treatments` (RLS-protected)
  - Admin CRUD at `/admin/treatments` via `/api/treatment-records`
- **Materials catalog**: `materials` table + `material_inventory` for stock levels
  - Categories: composite, filling, instrument, implant, hygiene, anesthesia, other
  - Low-stock alerts when quantity < min_stock_level
  - Admin CRUD at `/admin/materials` via `/api/materials`
- **Material orders**: `material_orders` + `material_order_items`
  - Any staff/assistant can create orders
  - Status flow: draft → pending_approval → approved → ordered → delivered
  - Urgency levels: low, normal, high, critical
  - On delivery: inventory auto-updated
  - Admin/assistant UI at `/admin/orders` via `/api/material-orders`
- **Treatment materials used**: `treatment_materials_used` — tracks which materials were consumed per treatment, registered by assistant
- **Admin roles**: `admin_users.role` supports `superadmin`, `admin`, `doctor`, `receptionist`, `assistant`, `billing_manager`, `inventory_manager`, `analyst` (legacy `staff` rows are grandfathered in)

#### Live Chat

- DB: `chat_sessions` + `chat_messages` tables with Supabase Realtime
- Admin: `useAdminChat` hook + `/admin/chat` page — session list, message history, unread badges
- Patient: `useLiveChat` hook + `LiveChat.tsx` widget — name prompt, auth check, optimistic sends

#### Testing Strategy

- Unit tests: Vitest + @testing-library/react (24 test files, 201 tests)
- Custom render wrapper in `src/test/test-utils.tsx`
- Import `screen`, `waitFor` etc. directly from `@testing-library/react`, not from test-utils
- E2E: Playwright (`e2e/` directory) — auth flows with mocked and live Supabase
- CI runs lint, typecheck, Prettier, unit tests (with coverage), and E2E suites (`.github/workflows/ci.yml`); the production build is gated by Vercel, not CI

### Environment Variables

| Variable                           | Required     | Description                                                                                                                                                                       |
| ---------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`             | No           | Site URL (default: `https://dentalstory.com.ua`)                                                                                                                                  |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`  | No           | GA4 measurement ID                                                                                                                                                                |
| `NEXT_PUBLIC_GOOGLE_PLACE_ID`      | No           | GBP Place ID — powers the tracked write-review redirect `/r/google?src=…` (falls back to the Maps share link)                                                                     |
| `NEXT_PUBLIC_SUPABASE_URL`         | For auth     | Supabase project URL                                                                                                                                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | For auth     | Supabase anon key                                                                                                                                                                 |
| `UPSTASH_REDIS_REST_URL`           | For cache    | Upstash Redis URL                                                                                                                                                                 |
| `UPSTASH_REDIS_REST_TOKEN`         | For cache    | Upstash Redis token                                                                                                                                                               |
| `SENTRY_AUTH_TOKEN`                | No           | For source map upload (skipped if missing)                                                                                                                                        |
| `RESEND_API_KEY`                   | For email    | Resend API key                                                                                                                                                                    |
| `RESEND_FROM_EMAIL`                | No           | Sender address (default: `DentalStory <noreply@dentalstory.com.ua>`)                                                                                                              |
| `ADMIN_NOTIFICATION_EMAIL`         | No           | Email for admin booking alerts                                                                                                                                                    |
| `CRON_SECRET`                      | For payments | Admin bearer for `/api/payments/*` routes (analytics/finalize/invalidate/refund). No longer used by any cron — scheduled jobs moved to Supabase `pg_cron` (see "Scheduled jobs"). |
| `SUPABASE_SERVICE_ROLE_KEY`        | Server-side  | Service role key for server-side Supabase calls (also auto-injected into the `process-notifications` edge fn)                                                                     |
| `MONOBANK_TOKEN`                   | For payments | Monobank acquiring token (test: api.monobank.ua, prod: web.monobank.ua)                                                                                                           |
| `NEXT_PUBLIC_INVENTORY_V2_ENABLED` | No           | Set `true` to expose `/admin/stock` shell (off by default; enable per-env in Vercel)                                                                                              |

### Inventory v2 — posting primitive contract

**All stock mutations flow through `post_stock_document()` / `unpost_writeoff_document()`. Direct `UPDATE` of `material_inventory` or `stock_lots` is forbidden and enforced via RLS.**

Feature flag: `NEXT_PUBLIC_INVENTORY_V2_ENABLED=true` enables `/admin/stock`. Set to `true` in Vercel env per-environment.

#### Phase status (all 8 phases shipped on `develop`)

| Phase | What ships                                                   | Key files                                                                                                |
| ----- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 0     | `clinic_settings`, feature flag, `/admin/stock` shell        | `20260430_clinic_settings.sql`                                                                           |
| 1     | Posting primitive, warehouses, documents hub                 | `20260501_stock_backfill.sql`, `20260501_stock_posting_primitive.sql`, `20260501_stock_posting_rpcs.sql` |
| 2     | Directories (suppliers, brands, categories)                  | `20260515_stock_directories.sql`                                                                         |
| 3     | Materials v2 (barcodes, pack/unit, warehouse matrix)         | `20260522_materials_v2.sql`                                                                              |
| 4     | My-warehouses daily ops (request, transfer, writeoff)        | `20260601_internal_requisitions.sql`                                                                     |
| 5     | Calc cards + treatment auto-writeoff hook                    | `20260605_stock_calc_cards.sql`                                                                          |
| 6     | Inventory audits (INV-YY-NNNNNNN)                            | `20260615_stock_inventory_audits.sql`                                                                    |
| 7     | Reports (balances, history, reorder, writeoff, service-cost) | `20260701_stock_reports.sql`                                                                             |
| 8     | Daily metrics cron, cleanup indexes                          | `20260701_stock_metrics.sql`, `20260710_stock_v2_cleanup.sql`                                            |

#### Stock cron

- `ds-stock-metrics` — `pg_cron` daily at 21:55 UTC (23:55 Kyiv). `run_stock_metrics_job()` calls `snapshot_stock_metrics_daily()` for yesterday + today. Scheduled in `20260718_cron_schedules.sql` (migrated off Vercel Cron — see "Scheduled jobs").

---

## Open limitations

- **Payments**: not wired — clinic accepts payment in-person only for v3. Monobank integration exists in env vars but the flow is not exposed to patients.
- **PITR**: Supabase Pro plan is active (daily backups included), but the Point-in-Time Recovery add-on has not yet been enabled. Enable via Supabase Dashboard → Settings → Add-ons.
- **Legal**: `/privacy-policy` and `/terms-of-service` pages exist but content has not been reviewed by a Ukrainian lawyer. Required before public launch.
- **`src/lib/ab-test.ts`**: previously had a `@vercel/edge-config` "module not found" TypeScript error. **Resolved** — `@vercel/edge-config` is now a declared dependency and `npm run typecheck` passes cleanly. The A/B framework still requires an Edge Config store to be provisioned in Vercel before the feature is active in production.
