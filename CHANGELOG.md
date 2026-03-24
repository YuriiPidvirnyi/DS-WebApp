# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [v2.0.0] - 2026-03-24
