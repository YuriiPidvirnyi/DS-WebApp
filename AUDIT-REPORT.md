# Dental Story WebApp — QA/Audit Report

Date: 2025-10-26
Owner: QA

## Executive summary

- Functional: Core flows working locally (navigation, Contact, Newsletter, Callback, Reviews, PWA/Offline). Booking works with mocks; UI/UX stable.
- Quality improvements delivered:
  - Unified contacts/geo for Kyiv; CONTACT_INFO now reads from env; StructuredData + index.html aligned; OG image added.
  - GA4 switched to canonical snippet; Sentry gated by env; removed missing local font; README/env cleaned; ESLint rules tuned; lint/typecheck/build green.
  - Router -> BrowserRouter (SEO-friendly); Playwright smoke tests and a11y audit pipeline added.
- A11y: added/linked labels and ids in Booking/Reviews/Callback; improved star rating ARIA; audit now reports 0 violations (contrast and ARIA issues resolved).
- Remaining: Optional perf/SEO polish.

## Current state

- Typecheck: PASS
- ESLint: PASS
- Build (Vite + PWA): PASS
- E2E (Playwright): PASS (3/3)
- A11y (axe + Playwright): PASS (0 violations).

## Fixed/implemented (highlights)

1. Contacts/geo unified (Kyiv, Korolyova 10, 02660); OG asset; StructuredData corrected; robots/sitemap already present.
2. Env-driven CONTACT_INFO (VITE_PHONE_NUMBER, etc.); vite-env types extended.
3. GA4 canonical gtag and guards; Sentry init conditioned; Turnstile kept with dev-friendly fallback.
4. Removed missing Stolzl font; preload cleanups.
5. BrowserRouter adoption; + rewrite notes for hosting; dev/preview unaffected.
6. A11y: labels/ids for Booking (service/date/time/firstName/lastName/phone/email/DOB/doctor/reminder/consent), Reviews (all fields), Callback; star ratings use sr-only text.
7. Tests/tooling: Playwright config, smoke spec; axe audit script with auto preview spin-up.

## Outstanding issues

P1 — none (functional blockers not observed locally after fixes).

P2 — none (E2E and a11y now green locally).

P3

- Minor: Remaining content consistency checks post-unification (ensure footer/header reflect env if set).

## Detailed a11y results (axe summary)

- All pages audited: 0 violations (contrast and ARIA resolved).
- All form inputs have labels/accessible names; prior select-name/label violations resolved.

## E2E plan to green (Booking)

1. Force-deterministic mocks in test for:
   - GET /appointments/slots -> static slots array (done)
   - POST /appointments -> resolve immediately with id and status (done)
2. Disable submission cooldown when `import.meta.env.VITE_E2E` or set a test hook to clear cooldown storage (done); ensure navigation after submit by reading router state or programmatically navigate to `/booking/success?ref=id` (already implemented fallback).
3. Stabilize assertion on success: assert heading or any invariant element; increased timeout.

## Quick wins (easy to apply)

- Standardize CTA color tokens: use `bg-teal-800 hover:bg-teal-900 text-white` across.
- Replace `text-blue-100` on dark backgrounds with `text-white`.
- Keep map containers labelled via parent region/heading; avoid ARIA on layout-only nodes inside.
- Add Lighthouse CI to catch regressions (perf/SEO/a11y budgets).

## Deployment notes

- BrowserRouter requires history fallback:
  - Netlify: `_redirects` with `/* /index.html 200`
  - Vercel: rewrites to `index.html`
  - Nginx/Apache: SPA fallback.
- Provide production env vars (VITE*API_URL, VITE_SITE_URL, VITE_GOOGLE*\* IDs, VITE_SENTRY_DSN, VITE_TURNSTILE_SITE_KEY, VITE_ENVIRONMENT).

## How to run

- Dev: `npm run dev`
- Build/preview: `npm run build && npm run preview`
- Lint/typecheck: `npm run lint` / `npm run typecheck`
- E2E: `npm run test:e2e` (auto-builds), UI mode `npm run test:e2e:ui`
- A11y: `npm run a11y:install` (once), then `npm run a11y:audit` (auto-builds)

## Appendix — file changes (key)

- src/utils/constants.ts — unified CONTACT_INFO; env-driven
- src/components/StructuredData.tsx, index.html — synced org/localBusiness/medicalClinic schemas
- src/utils/analytics.ts — canonical GA4
- src/styles/globals.css — removed missing font
- Router: src/main.tsx -> BrowserRouter
- Playwright: playwright.config.ts, e2e/smoke.spec.ts; scripts
- A11y form labels: BookingForm.tsx, Reviews.tsx, CallbackRequest.tsx, Footer.tsx
- Star ratings ARIA: StarRating.tsx, Testimonials.tsx
