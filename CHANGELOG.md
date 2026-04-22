# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

> Changes on `develop` since `v3.0.0`. Target release: v3.2.0 (after PITR enabled) → v3.3.0 (after legal review + LCP verified = public launch).

### Added

- **Pay-deposit button** on booking success page — reads `paymentConfig` from booking response, POSTs to `/api/payments/create` with CSRF token, redirects to Monobank; visible only when `payment_mode !== 'none'` (C5/A3)
- **Inventory v2 phase 9 — all phases complete**: Склад v2 production-ready with all 9 phases (0–8): posting primitive, warehouses, directories, materials v2, daily ops, calc cards, audits, reports, daily metrics cron
- **cron_runs observability** on `stock-metrics` cron — all 5 cron routes now record start/finish in `cron_runs` table (B4)
- **Payments**: Monobank acquiring integration — `POST /api/payments/create`, `GET /api/payments/status/[invoiceId]`, signed webhook at `/api/payments/monobank-webhook`
- **A/B testing framework** + six-month recall notification system (`/api/cron/recall`, Phase D)
- **Cookie consent** gate for GA4, Vercel Analytics, and Sentry Replay (GDPR alignment)
- **Onboarding tour**: materials step with action links across admin pages
- **Seed pipeline**: EN + PL i18n test patients + auto-reseed preprod on develop merge (`.github/workflows/reseed-preprod.yml`)
- **Shared primitives**: `EmptyState` and `ErrorState` components with cabinet analytics events wired through
- **CI hardening**: SQL schema validation + gitleaks secret scanning workflows
- **Docs**: ROADMAP v1.4 (post-launch plan, phase gates), A/B testing playbook, post-launch backlog, backup/DR runbook, preprod seeding runbook, launch checklist

### Changed

- **Removed CliniCards integration** — slot fetching is now fully internal; `clinicards-client.ts` deleted, admin monitoring page dropped
- **RBAC consolidation**: roles reduced from 10 → 8 canonical roles (`senior_assistant` and `staff` removed via migration `20260409_remove_senior_assistant_and_staff_roles.sql`). Canonical set: `superadmin`, `admin`, `receptionist`, `doctor`, `assistant`, `billing_manager`, `inventory_manager`, `analyst`
- Booking confirmation emails honor the user's UI locale
- `next start` CI heap raised to 4096 MB

### Fixed / Security

- **RLS doctor-scope rewrite** (migration `20260417_fix_doctor_scope_rls_v2.sql`) — `current_doctor_id()` + `is_non_doctor_admin()` helpers; doctors can no longer see all patients / appointments
- **Optimistic-lock guard** on `PATCH /api/appointments/[id]`
- App-layer ownership filter on `/api/cabinet/export` (defense in depth for RLS)
- Ownership check on `DELETE /api/treatment-records/[id]`
- CSRF token required on `/api/materials/[id]/upload-image`
- Monobank webhook: replay-window enforcement and signature verification hardened
- Reminder cron: idempotency keys added; `low_stock_alert` events routed through the shared notifications pipeline
- RBAC: doctors can now access the appointments and treatments admin pages
- Mobile responsive layout + touch-target fixes on public pages
- Missing `routeMeta` i18n key added to `en` and `pl`
- Deprecated husky header removed; permissions tests, Lucide social-icon rendering, and E2E OOM pressure resolved

### Dependencies

- React group bump, Resend 6.12.0, PostCSS 8.5.10, lucide-react 1.8.0, DOMPurify, Prettier, globals, ESLint group, testing group, `@axe-core/playwright`
- `serialize-javascript` override remains pinned to `7.0.4` (GHSA-5c6j-r48x-rmvq)
- CI: `actions/github-script` 7→9, `actions/cache` 4→5

## [3.0.0] - 2026-04-07

### Added

- **Sidebar navigation**: collapsible sidebar with logo crossfade, social links, section labels, vertical centering, contact section highlight
- **Patient cabinet**: full patient portal with dashboard stats, sidebar layout, reschedule UI, payments page, error boundary
- **Cabinet: cancel & calendar**: patient appointment cancellation API, "Add to calendar" (.ics) download for upcoming appointments
- **Cabinet UX polish**: focus rings, error handling, a11y improvements (mobile sidebar id, avatar link focus ring), email field, missing i18n keys
- **Admin RBAC system**: 7 roles (superadmin, admin, manager, doctor, assistant, receptionist, staff), permission matrix with 20+ permissions, role-filtered navigation
- **Materials ordering system**: full internal inventory workflow
  - Material image upload (Supabase Storage, drag-and-drop, preview)
  - Partial delivery tracking with per-item quantity inputs and progress bars
  - Audit trail on order status changes (timeline UI with admin_audit_logs)
  - Material consumption tracking in treatment records (deduct/add inventory via RPC)
  - Inventory analytics page with KPI cards, spending-by-category pie chart, top-consumed bar chart, stock levels table
  - Low-stock cron alerts via notification_events
- **Database migration**: `20260407_materials_enhancement.sql` — image_url column, approval tracking columns, Supabase Storage bucket, atomic `deduct_inventory`/`add_inventory` RPC functions
- **Testing**: unit tests for AccessibilityPanel and AIAssistant, E2E hydration race fixes for reviews select

### Changed

- Admin navigation filtered by role permissions instead of showing all items
- Treatment record API accepts `materialsUsed` array for consumption tracking
- Materials page fully i18n-ized (removed hardcoded Ukrainian labels)
- Orders page fully i18n-ized (status/urgency labels use i18n key maps)
- Inventory analytics page fully i18n-ized
- Site header, footer, and sidebar hidden on cabinet/admin routes for clean layout
- Replaced emoji+text logos with `Logo` component across branding
- Role permissions enforced on existing API routes (materials, orders, treatments, analytics)

### Fixed

- RBAC nav bug and dead route cleanup
- Admin login page: replaced dark `bg-slate-900` theme with dental brand gradient and `<Logo />` component
- Cabinet reschedule flow (slots parsing, doctorId, timeouts, i18n)
- Cabinet filter logic and defaultValue fallbacks
- Cabinet dashboard email display bug
- E2E reviews select hydration race (toPass retry pattern)
- AI assistant opening correctly when controlled via sidebar
- High-contrast mode non-destructive behavior, reset-all, proper close handling
- Sidebar icon spacing, section gaps, social links visibility, logo rendering
- 80+ missing i18n keys across cabinet, admin users, sidebar, accessibility panel
- Security: bumped serialize-javascript, brace-expansion, picomatch overrides
- Booking: slots fetch now times out after 8s with an error state instead of loading indefinitely when the API hangs
- Hero badge: "Зараз зачинено" now shows next open time inline ("Відкриємося о 09:00")
- Social sidebar: Twitter/X removed from defaults — only shown when `NEXT_PUBLIC_TWITTER_URL` env var is set

### Security

- Role-based permission checks on all admin API routes
- `hasPermission()` guard integrated into materials, orders, treatments, analytics endpoints
- Atomic inventory functions prevent race conditions on stock updates

## [2.0.0] - 2026-03-23

### Added

- Supabase authentication with `@supabase/ssr` (login, signup, password reset, email callbacks)
- Patient cabinet with appointment history, profile management, treatment records
- Admin dashboard with 15 sub-pages (analytics, appointments, doctors, services, patients, materials, orders, treatments, reviews, contacts, chat, settings)
- Admin role management via `admin_users` table (superadmin, admin, staff, doctor, assistant)
- Admin audit log with restore capabilities
- Treatment records system (draft -> signed -> completed) with per-service line items
- Materials inventory management with low-stock alerts
- Material orders workflow (draft -> pending_approval -> approved -> ordered -> delivered)
- Live chat between patients and admins via Supabase Realtime
- AI chat assistant powered by AI SDK (`@ai-sdk/react`)
- AI symptom checker with recommendation engine
- Smart recommendations component
- Email notifications via Resend (booking confirmation, reminders, cancellation, admin alerts)
- Vercel Cron jobs for notification processing (every 5 min) and daily reminder scheduling
- Micro-feedback system on forms (thumbs up/down)
- Newsletter subscription system
- Appointment reminder preferences (per-appointment opt-in/out)
- Cloudflare Turnstile CAPTCHA integration
- Rate limiting via Upstash Redis (edge + per-route)
- CSRF protection on all mutation endpoints
- Content Security Policy enforcement in edge middleware (`proxy.ts`)
- Security headers (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- PWA support via `@ducanh2912/next-pwa` with Workbox runtime caching
- Offline fallback page
- Accessibility panel (font size, contrast, language)
- Radial menu for floating actions
- Cookie consent banner
- Before/after gallery component
- Price calculator for dental services
- Video testimonials component
- FAQ accordion component
- Google Maps integration with Lviv clinic location
- Structured data (JSON-LD) for SEO
- Open Graph image generation
- Sitemap and robots.txt generation
- i18n lazy loading for EN and PL bundles with hydration-safe initialization
- `initializeI18nFromStorage()` to prevent raw-key flashes after language switch
- `CustomSelect` component for accessible dropdowns
- `Select` primitive with `selectSize` variants (default, compact, dense)
- Sentry integration (server, edge, client) with tunnel route at `/monitoring`
- Vercel Analytics and Speed Insights
- Performance metrics component (Web Vitals)
- Resource preloader for critical assets
- SVG filters for visual effects
- Git hooks: Husky + lint-staged (pre-commit), commitlint (commit-msg)
- GitHub Actions CI (lint, typecheck, unit tests, build, a11y audit, security audit, UI smoke E2E)
- Claude Code Review and Claude Code Action GitHub workflows
- Dependabot configuration for npm and GitHub Actions
- Pull request template
- Accessibility audit script (`scripts/a11y-audit.mjs`) covering 10 public routes
- E2E tests: auth flows (mocked), auth live smoke, email links live, UI form controls smoke
- Unit tests: API security, Redis, Supabase audit, admin preferences, admin/auth page smoke, API abort handling

### Changed

- Migrated from Vite to Next.js 16 App Router with Turbopack
- Replaced Axios HTTP client with native `fetch` wrapper (`src/services/api.ts`)
- Moved from JWT-based admin claims to `admin_users` table membership
- Replaced `middleware.ts` with `proxy.ts` for edge middleware
- Updated clinic location to Lviv (Sumska 10)
- Updated contact details (phone: 068 232 38 38, email: info@dentalstory.ua)
- Updated working hours (Mon-Fri 09:00-20:00, Sat 10:00-18:00)
- Switched to `@ducanh2912/next-pwa` for PWA (replacing older PWA setup)
- Pinned `serialize-javascript` to 7.0.4 via overrides to fix GHSA-5c6j-r48x-rmvq

### Fixed

- Mobile horizontal overflow on narrow viewports (root shell + header clipping)
- CSP enforcement (previously report-only)
- i18n sign-up page aria-labels using correct translation keys
- Reviews page timeout handling (AbortSignal.timeout with dedicated error message)
- Floating UI safe-area insets for iOS
- Layout bottom padding to prevent radial menu overlap

## [1.0.0] - 2024-10-29

### Added

- Initial release of Dental Story WebApp
- Core pages: Home, Services, About, Gallery, Contact, Booking
- Booking system with multi-step form
- Contact forms with Cloudflare Turnstile protection
- Gallery with image categories
- Service listings with descriptions
- Responsive design for all devices
- PWA support
- SEO optimization with meta tags and structured data
- Accessibility features (ARIA labels, keyboard navigation)
- Performance monitoring with Web Vitals
- Error tracking with Sentry integration
- Analytics integration
