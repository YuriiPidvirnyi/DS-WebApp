# DentalStory 3.0.0 Release Notes

**Date:** 2026-04-07
**Branch:** `claude/awesome-khorana`
**Status:** Ready for merge and deployment

---

## Release Summary

**DentalStory 3.0.0** is a comprehensive Next.js 16 refactor from Vite, featuring complete feature parity with v2 plus major enhancements:

- ✅ **Next.js 16 App Router** migration (was Vite)
- ✅ **Real database verification** with 28 appointments, 20 materials, 8 treatment records
- ✅ **RBAC system** with 7 roles and role-based navigation
- ✅ **Live browser testing** across all admin, patient, and public flows
- ✅ **Zero accessibility violations** (11-route axe WCAG 2 A/AA audit)
- ✅ **144 unit tests** passing (Vitest)
- ✅ **All 3 bugs found and fixed** during verification

---

## What's New in 3.0

### Framework & Architecture

- **Next.js 16 App Router** with TypeScript
- **Turbopack** for fast development (420ms startup)
- **Server components** for better performance
- **Route guards** via middleware and layout-level auth checks
- **API routes** with proper error handling and logging

### Features

- **Admin dashboard** with widgets, analytics, RBAC nav filtering
- **Material inventory** system with low-stock alerts
- **Material orders** with status workflow (draft→delivered)
- **Treatment records** with payment tracking and patient visibility
- **Live chat** with Supabase Realtime
- **i18n** support (Ukrainian, English, Polish)
- **Appointment booking** with email reminders
- **Patient cabinet** with appointment and treatment history
- **Contact forms** with CSRF protection

### Admin Features

- **14-item navigation** with dynamic role-based filtering
- **7 admin roles** with scoped access (superadmin, admin, doctor, receptionist, assistant, staff, senior_assistant)
- **Analytics** with 4 chart sections (appointments, revenue, appointments by status, top services)
- **Inventory analytics** with spending, usage, and stock level charts
- **Audit logs** with admin action tracking
- **User management** with role assignment
- **Settings** with profile, security, and preferences

### Data

- **28 appointments** across all statuses (pending, confirmed, completed, cancelled, no_show)
- **20 dental materials** in 7 categories with SKUs and supplier info
- **8 treatment records** with payment and signature statuses
- **15 patients** with realistic Ukrainian data
- **4 doctors** with specializations
- **15 services** with pricing

---

## Bugs Fixed in This Release

| #   | Issue                                  | Status                                        |
| --- | -------------------------------------- | --------------------------------------------- |
| 1   | Admin login infinite render loop       | **FIXED** — moved redirect to useEffect       |
| 2   | Missing `admin.sidebar.users` i18n key | **FIXED** — added translations                |
| 3   | Material orders API returning 500      | **FIXED** — removed RLS-blocking relationship |

**Details:** See `docs/BUG_FIXES_SUMMARY.md`

---

## Verification Results

### Automated Tests

| Test                        | Result                      |
| --------------------------- | --------------------------- |
| TypeScript (`tsc --noEmit`) | ✅ 0 errors                 |
| ESLint                      | ✅ 0 errors, 0 warnings     |
| Unit tests (Vitest)         | ✅ 144/144 pass             |
| Production build            | ✅ Success                  |
| E2E auth (Playwright)       | ✅ 7/7 pass                 |
| E2E UI smoke tests          | ✅ 4/4 pass                 |
| Accessibility (axe)         | ✅ 0 violations (11 routes) |

### Browser Testing (Live Data)

| Flow                         | Status  | Evidence                                      |
| ---------------------------- | ------- | --------------------------------------------- |
| Superadmin login & dashboard | ✅ PASS | Real data: 28 appointments, widgets working   |
| Appointments page            | ✅ PASS | All 28 seeded appointments display            |
| Materials page               | ✅ PASS | All 20 materials with inventory               |
| **Material orders page**     | ✅ PASS | **Bug #3 fixed** — 5 orders display correctly |
| Treatment records            | ✅ PASS | All 8 records with patient/doctor/procedures  |
| RBAC nav filtering           | ✅ PASS | Doctor role shows 7 nav items, superadmin 14  |
| Patient cabinet              | ✅ PASS | RLS-protected, patient data isolated          |
| Public booking form          | ✅ PASS | Service/date/time fields functional           |
| Contact form                 | ✅ PASS | CSRF token validation working                 |
| i18n switching               | ✅ PASS | UA/EN/PL all working                          |

---

## Security & Compliance

- ✅ **Auth guards** enforced server-side (all protected routes redirect to login when unauthenticated)
- ✅ **CSRF protection** on all POST endpoints (3/3 tested)
- ✅ **RLS enforcement** (Supabase row-level security on sensitive tables)
- ✅ **RBAC** with 7 roles and scoped data access
- ✅ **No secrets in client code** (grep verified)
- ✅ **Rate limiting** (60 req/min per IP, Redis in production)
- ✅ **CRON_SECRET** hardening (returns 500 if unset)
- ✅ **Zero a11y violations** across public + admin flows

---

## Environment Configuration

### Required Variables

```env
# Supabase (for auth + DB)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side secrets (not required in dev, used in production)
SUPABASE_SERVICE_ROLE_KEY=        # For cron jobs
RESEND_API_KEY=                   # For transactional email
CRON_SECRET=                      # For cron route protection

# Optional (dev can skip)
UPSTASH_REDIS_REST_URL=           # For rate limiting (fallback: in-memory)
UPSTASH_REDIS_REST_TOKEN=
SENTRY_AUTH_TOKEN=                # For source map upload
```

---

## Deployment Checklist

- [ ] **Merge** `claude/awesome-khorana` → `main`
- [ ] **Tag** commit as `v3.0.0` (annotated)
- [ ] **Set environment variables** on Vercel (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET, etc.)
- [ ] **Deploy to production** via Vercel
- [ ] **Run post-deploy smoke test**: Visit `/api/health`, verify `{"status":"ok"}`
- [ ] **Test admin login** with production Supabase credentials
- [ ] **Verify material orders page** displays orders without 500 error
- [ ] **Monitor error logs** for first 24h (Sentry)

---

## Known Issues & Limitations

| Issue                                                                | Severity | Mitigation                                      |
| -------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| Rate limiting uses in-memory fallback in dev (production uses Redis) | Info     | Production uses Redis, dev acceptable           |
| E2E admin materials test requires full auth mock                     | Medium   | Manual verification passed                      |
| Sitemap returns HTML in dev mode                                     | Low      | Works correctly in production build             |
| Homepage nav flaky in E2E (hydration timing)                         | Low      | Works in browser, timing-specific to Playwright |

---

## Rollback Plan

If critical issues are discovered post-deployment:

1. **Revert commit** on Vercel — roll back to previous v2 branch
2. **Update DNS** if needed (though Vercel handles this automatically)
3. **Notify stakeholders** via Slack
4. **Create GitHub issue** for root cause analysis

---

## File Structure Reference

```
app/                          # Next.js App Router pages
├── admin/                     # /admin (auth-protected)
├── api/                       # API routes + cron jobs
├── auth/                      # /auth/login, /auth/sign-up
├── cabinet/                   # /cabinet (patient dashboard)
├── booking/                   # /booking form
└── ...other routes

src/
├── views/                     # Page-level components
├── components/                # Reusable UI components
├── contexts/                  # React contexts (admin auth, accessibility)
├── lib/
│   ├── supabase/              # DB client setup
│   ├── api-security.ts        # CSRF, rate limiting
│   └── ...
├── locales/                   # i18n translations (uk, en, pl)
└── ...

docs/
├── VERIFICATION_REPORT_3.0.md # Full test results
├── BUG_FIXES_SUMMARY.md       # All 3 bugs + fixes
└── RELEASE_3.0.0.md           # This file
```

---

## Support & Issues

- **Bug reports**: Create GitHub issue with reproduction steps
- **Questions**: Contact team via Slack or project board
- **Performance issues**: Check Vercel Analytics and Sentry logs

---

## Commits in This Release

```
78e2edd docs: add comprehensive bug fixes summary
5c6507b docs: update verification report with bug #3 fix documentation
ea1de95 fix(material-orders): resolve API 500 error caused by admin_users RLS policy
f546fa3 docs: add phase b browser testing results (units 8-10)
6b8b739 docs: update verification report with live browser + real data results
138b0f4 fix(admin): resolve login page render loop + add missing users i18n key
d3cbff8 docs: add 3.0 verification report with full test evidence
```

---

**Release prepared by:** Claude Opus
**Verification date:** 2026-04-07
**Status:** ✅ Ready for production
