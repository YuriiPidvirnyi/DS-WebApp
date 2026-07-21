# DentalStory v3.x — Architecture Review & Exhaustive Development Plan

**Document version:** 1.0
**Created:** 2026-04-20
**Scope:** `origin/develop` only
**Reviewer:** independent pass (complements [ROADMAP.md](./ROADMAP.md) v1.4)
**Product version at review time:** v3.0.1 on `main`, v3.1.x-candidate on `develop`
**Branch state:** `develop` is 30 commits ahead of `main` — 166 files changed, +9403 / −9644

> This document does **not** replace [ROADMAP.md](./ROADMAP.md). It is the delta audit: what ROADMAP v1.4 already covers is referenced, not repeated; the body focuses on findings and tasks the roadmap misses. Treat this as the input for a future `ROADMAP.md` v1.5.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Verified state of `develop`](#2-verified-state-of-develop-what-actually-shipped)
3. [New findings beyond ROADMAP v1.4](#3-new-findings-beyond-roadmap-v14-the-delta)
4. [Revised exhaustive development plan](#4-revised-exhaustive-development-plan)
5. [Sequencing & dependency graph](#5-sequencing--dependency-graph)
6. [Definition of done (per phase)](#6-definition-of-done-per-phase)
7. [Open questions requiring human decision](#7-open-questions-requiring-human-decision)
8. [Immediate next 5 actions](#8-immediate-next-5-actions-this-week)
9. [Out of scope](#9-what-this-plan-does-not-touch)
10. [Functional inventory — public surface](#10-functional-inventory--public-surface)
11. [Functional inventory — admin surface](#11-functional-inventory--admin-surface)
12. [Operational-functionality backlog (phase-mapped)](#12-operational-functionality-backlog-phase-mapped)
13. [Product-vision & innovation backlog (v4+)](#13-product-vision--innovation-backlog-v4)
14. [Brand, design & UI/UX maturity track](#14-brand-design--uiux-maturity-track)
15. [CI/CD architecture — current, gaps, target](#15-cicd-architecture--current-gaps-target)
16. [Testing strategy](#16-testing-strategy)
17. [Non-functional requirements (public + admin)](#17-non-functional-requirements-public--admin)
18. [Data architecture, KPIs & BI](#18-data-architecture-kpis--bi)
19. [Integration & extension architecture](#19-integration--extension-architecture)
20. [Security threat model, compliance & regulatory](#20-security-threat-model-compliance--regulatory)
21. [DR, business continuity & operational runbooks](#21-dr-business-continuity--operational-runbooks)
22. [Team, capacity, hiring & full budget](#22-team-capacity-hiring--full-budget)
23. [Risk register](#23-risk-register)
24. [Growth, marketing, content & SEO architecture](#24-growth-marketing-content--seo-architecture)
25. [Mobile & cross-platform strategy](#25-mobile--cross-platform-strategy)
26. [i18n / l10n & multi-market strategy](#26-i18n--l10n--multi-market-strategy)
27. [Release, versioning & documentation architecture](#27-release-versioning--documentation-architecture)
28. [Master consolidated timeline](#28-master-consolidated-timeline)

---

## 1. Executive summary

- ROADMAP v1.4 is **accurate at the high level** but **optimistic on verification rigor**. Phase A items 1/1b/1c/2/4/5/6/7/8 shipped as commits, but several claim "idempotency / guard / fix" without structural tests that would keep them from regressing.
- Four parallel audits (API · DB · Frontend · Testing+CI+Observability) surfaced **≈60 findings**; **≈40% are not covered by ROADMAP v1.4**. These are the delta below.
- The two highest-risk surfaces on `develop` are:
  1. the **new monobank payment stack** (`20260419_payment_system.sql`, `app/api/payments/*`) — public endpoints, signature verification, webhook-replay risk;
  2. the **RLS / SECURITY DEFINER plumbing** introduced by `20260417_fix_doctor_scope_rls_v2.sql` — works in RLS context but is fragile if called from app code and has **no regression test**.
- Confidence score for "production-grade": **7.2 / 10** (v1.0 said 6.5 → +0.7 from Phase A). Path to 9.0+ = Phase B hardening + the 40% delta in §3.

---

## 2. Verified state of `develop` (what actually shipped)

### ✅ Solid on develop (evidenced in tree)

- 8-role RBAC consolidated — [src/lib/permissions.ts:18-27](../src/lib/permissions.ts)
- RLS doctor-scope rewrite — [supabase/migrations/20260417_fix_doctor_scope_rls_v2.sql:23-131](../supabase/migrations/20260417_fix_doctor_scope_rls_v2.sql)
- Cron idempotency v1 (claim pattern, stuck-row recycler) — [app/api/cron/notifications/route.ts](../app/api/cron/notifications/route.ts) + [supabase/migrations/20260418_notification_events_processing_status.sql](../supabase/migrations/20260418_notification_events_processing_status.sql)
- `cron_runs` observability table — [supabase/migrations/20260718_cron_runs_and_producers.sql](../supabase/migrations/20260718_cron_runs_and_producers.sql) (the original `20260419_cron_runs.sql` was never applied and was superseded during the Supabase pg_cron migration) + `/admin/health`, `/admin/data-quality`, `CronHealthWidget`
- AI token budget table & daily guard — [supabase/migrations/20260420_ai_usage.sql](../supabase/migrations/20260420_ai_usage.sql), [src/lib/ai-usage.ts](../src/lib/ai-usage.ts)
- Monobank payment pipeline — [supabase/migrations/20260419_payment_system.sql](../supabase/migrations/20260419_payment_system.sql), `app/api/payments/{create,monobank-webhook,status/[invoiceId]}/route.ts`
- i18n parity & completeness tests — [src/test/i18n-parity.test.ts](../src/test/i18n-parity.test.ts), [src/test/i18n-completeness.test.ts](../src/test/i18n-completeness.test.ts)
- Weekly a11y GHA, security-audit GHA, preview-validate GHA, Dependabot grouping
- Cabinet privacy endpoints — [app/api/cabinet/export/route.ts](../app/api/cabinet/export/route.ts), [app/api/cabinet/delete-account/route.ts](../app/api/cabinet/delete-account/route.ts), `CabinetSettingsPage`
- Worktree env auto-linking — `.husky/post-checkout` + [scripts/link-env.mjs](../scripts/link-env.mjs)
- Structured logger — [src/utils/logger.ts](../src/utils/logger.ts)
- 13-module preprod seed — [scripts/seed/preprod/](../scripts/seed/preprod/)

### 🟡 Landed but fragile (ship-claims exceed proof)

- Cron idempotency is **claim-based only** — no DB-level UNIQUE on `(appointment_id, type, scheduled_at)`. A concurrent cron run can still duplicate under pathological claim-rollback.
- Structured logger exists but is **used in only ~10 / 42 API routes**; the rest still `console.*`.
- Sentry has `sendDefaultPii: false` but **no custom `beforeSend` scrubber** for email/phone/patient names that appear inside request bodies.
- `preview-validate.yml` runs E2E on the real Vercel URL but with `continue-on-error: true` — advisory, **non-blocking**.
- `vitest.config.ts` thresholds are `lines:15, functions:13` — coverage gate is cosmetic.

### ❌ Not shipped (roadmap & audit both agree)

- Supabase PITR verification / restore drill (ROADMAP B5).
- Changesets-based release (still manual `package.json` bumps, `release.yml` wired).
- Vercel AI Gateway migration (ROADMAP B1 second half).
- Vercel BotID / Rolling Releases / Skew Protection adoption decisions (ROADMAP §10).

---

## 3. New findings beyond ROADMAP v1.4 (the delta)

Ranked by severity. These are items the roadmap does **not** cover; they feed Phase A′ / B' below.

### 3.1 🟥 Blockers (must fix before next tag)

| #      | Finding                                                                                                                                                                                                                                                                   | Source                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **N1** | **`payments/status/[invoiceId]` is public + enumerable.** No auth gate; anyone with an invoice UUID reads status/amount. Brute-force-able.                                                                                                                                | `app/api/payments/status/[invoiceId]/route.ts:1-60` |
| **N2** | **`cabinet/export` does not filter by user at the query level.** It calls `supabase.from('patients').select('*')` and trusts RLS to scope rows. If an RLS policy regresses (as doctor-scope did until April), this becomes a full-clinic export.                          | `app/api/cabinet/export/route.ts:36-41`             |
| **N3** | **Monobank webhook logs via raw `console.warn` on bad signature** — the "no raw console" invariant from Phase A7 regresses on the hottest security surface.                                                                                                               | `app/api/payments/monobank-webhook/route.ts:35`     |
| **N4** | **`treatment_materials_used` has no audit trigger**, unlike peer clinical tables. Staff can delete evidence of material consumption + cost without audit trail.                                                                                                           | `20260321_clinical_and_inventory.sql:206-232`       |
| **N5** | **Cron notifications idempotency is state-based, not key-based.** Concurrent cron runs can both claim the same row if one crashes mid-UPDATE. Needs DB-level UNIQUE on `(appointment_id, type, COALESCE(scheduled_at, created_at))` + `ON CONFLICT DO NOTHING` on insert. | `app/api/cron/notifications/route.ts:297-346`       |
| **N6** | **No schema / contract test suite.** Zero CI checks that migrations apply to a sandbox DB, that Supabase types match TS, or that Zod matches DB columns. Every RLS fix and every column rename is untestable.                                                             | `.github/workflows/ci.yml` (absent)                 |
| **N7** | **No secret scanning in CI or pre-commit.** `.husky/pre-commit` runs lint-staged only; no Gitleaks/TruffleHog. First leaked key won't be caught until it's already public.                                                                                                | workflows, `.husky/*`                               |
| **N8** | **Delete-account does not invalidate existing JWTs.** `auth.admin.deleteUser` + `patients.status='deleted'`, but tokens issued in the previous hour still authenticate.                                                                                                   | `app/api/cabinet/delete-account/route.ts:53-87`     |

### 3.2 🟧 High (required for Phase B exit)

| #       | Finding                                                                                                                                                                                                                                                       | Source                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **N9**  | `preview-validate.yml` uses `continue-on-error: true` on E2E against the deployment URL — job reports ✅ even when smoke fails. Should block PR merge.                                                                                                        | `.github/workflows/preview-validate.yml:37-44`                                     |
| **N10** | Playwright `fullyParallel: false` + `retries: 2` masks flakiness and doubles CI time.                                                                                                                                                                         | `playwright.config.ts:14-15`                                                       |
| **N11** | Admin list routes accept unbounded `pageSize`. No server-side cap; an authenticated call can ask for 100 k rows.                                                                                                                                              | `app/api/admin/users/route.ts:32-38`, `app/api/treatment-records/route.ts:132-158` |
| **N12** | `materials/[id]/upload-image` has no MIME allowlist, no dimension check, no virus scan, no per-user quota. Inventory role can fill Supabase Storage.                                                                                                          | `app/api/materials/[id]/upload-image/route.ts:13-14`                               |
| **N13** | Appointments POST queues notifications fire-and-forget (`.then()` not awaited), so confirmation can silently never enter the queue if Supabase is slow.                                                                                                       | `app/api/appointments/route.ts:181-192`                                            |
| **N14** | `treatment-records` POST does N+1 inventory RPC in a `for...of` loop.                                                                                                                                                                                         | `app/api/treatment-records/route.ts:326-346`                                       |
| **N15** | `payments` table has an unrestricted UPDATE RLS policy (`USING(true)`), relying entirely on service-role bypass. If any future handler updates with anon key, free-for-all.                                                                                   | `20260419_payment_system.sql:47-72`                                                |
| **N16** | `admin_users` has no UNIQUE constraint on `id`. Dual-row admin records are not prevented; `current_doctor_id()` uses `LIMIT 1` with undefined ordering → non-determinism.                                                                                     | `20260320_admin_users.sql:4-10`                                                    |
| **N17** | Realtime `chat_messages` policy doesn't handle soft-deleted sessions. No `chat_sessions.deleted_at` column, no exclusion in policy.                                                                                                                           | `20260318_live_chat.sql:64-100`                                                    |
| **N18** | `is_admin()` vs `is_admin_actor()` used interchangeably across migrations. Audit policies use actor; treatment policies use is_admin. Semantics differ on JWT-forgery edge cases.                                                                             | multiple migrations                                                                |
| **N19** | 6 admin pages over 800 LOC doing CRUD + list + filter + form inline. `AdminSettingsPage` 1030, `AdminTreatmentsPage` 1017, `AdminOrdersPage` 878, `AdminServicesPage` 875, `AdminDoctorsPage` 811, `PatientManagement` 778. No shared `useAdminList<T>` hook. | `src/views/admin/*.tsx`                                                            |
| **N20** | Modal primitive missing focus trap, `aria-modal`, focus-return on close. Keyboard users get stuck.                                                                                                                                                            | `src/components/admin/AdminModal.tsx`                                              |
| **N21** | Sentry has no `beforeSend` PII scrubber for request bodies. `sendDefaultPii: false` protects headers, not payloads.                                                                                                                                           | `sentry.server.config.ts:6-17`                                                     |
| **N22** | Monobank webhook has no unique-invoice idempotency check before state transition; replayed webhook could flip `paid→refunded→paid`.                                                                                                                           | `app/api/payments/monobank-webhook/route.ts`                                       |
| **N23** | No bundle-size regression gate in CI. `@next/bundle-analyzer` is installed but never runs in CI to compare deltas.                                                                                                                                            | `next.config.ts:4-8`, workflows                                                    |
| **N24** | `ai_usage` grows unbounded, no retention, no `billing_manager` read policy (analysts only), so finance can't see spend.                                                                                                                                       | `20260420_ai_usage.sql:4-33`                                                       |
| **N25** | `service_id` on appointments is `ON DELETE SET NULL` — deleting a service silently nulls historical appointment cost data → breaks invoicing. Switch to `services.is_active` soft-delete; FK becomes `RESTRICT`.                                              | `00000000000000_full_schema.sql`                                                   |
| **N26** | Missing indexes likely to matter at preprod volume: `treatment_records(patient_id, created_at DESC)`, `notification_events(status, scheduled_at)`, `ai_usage(ip_hash, created_at)`, `appointments(doctor_id, start_time)`.                                    | migrations                                                                         |

### 3.3 🟨 Medium

| #       | Finding                                                                                                                                                                | Source                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **N27** | Turnstile verify returns `{success:true}` when secret is unset, not gated to `NODE_ENV==='development'`.                                                               | `app/api/turnstile/verify/route.ts:18-24`        |
| **N28** | Reminder cron only filters `guest_email` — registered patients without `guest_email` get no reminder.                                                                  | `app/api/cron/reminders/route.ts:113-115`        |
| **N29** | Low-stock cron deduplicates per-day instead of per-material.                                                                                                           | `app/api/cron/low-stock-alerts/route.ts:131-148` |
| **N30** | Newsletter, reviews, feedback form patterns not all on RHF+Zod; at least some hand-rolled `useState`.                                                                  | `src/components/NewsletterSubscribe.tsx`, et al. |
| **N31** | Admin pages re-implement fetch/pagination/sort per page; no shared hook.                                                                                               | all admin views                                  |
| **N32** | `deduct_inventory()` / `add_inventory()` are SQL functions without SECURITY DEFINER, audit insert, or admin check. Overdraw race possible under concurrent treatments. | `20260407_materials_enhancement.sql:27-46`       |
| **N33** | `notification_events` has no CHECK `(status IN ('sent','failed')) ↔ processed_at IS NOT NULL`. Stuck `queued` rows live forever.                                       | `20260321_expand_notification_events.sql`        |
| **N34** | Feedback route swallows `42P01/PGRST205/42501` and returns `{success:true, recorded:false}` — silent data loss.                                                        | `app/api/feedback/form/route.ts:88-94`           |
| **N35** | `reviews` GET hard-codes `.limit(50)` with no pagination.                                                                                                              | `app/api/reviews/route.ts:58`                    |
| **N36** | `email-templates.ts` has no unit tests despite 6 templates × 3 locales.                                                                                                | `src/lib/email-templates.ts`                     |
| **N37** | `useReminders`/`useLiveChat`/`useAdminChat` Realtime subscriptions — cleanup patterns mixed.                                                                           | `src/hooks/*`                                    |
| **N38** | `StructuredData.tsx` — Dentist JSON-LD needs re-verification post-canonical flip to `dentalstory.ua`.                                                                  | `src/components/StructuredData.tsx`              |
| **N39** | CI `lint-and-typecheck` / `test` / `e2e-ui-smoke` / `e2e-feature-suites` each run `npm ci --legacy-peer-deps` without shared cache.                                    | `.github/workflows/ci.yml:38-171`                |

### 3.4 🟩 Low / cleanup

| #       | Finding                                                                                             | Source                                |
| ------- | --------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **N40** | FK cascades & `ON DELETE` choices on `payments`/`appointments` should be reviewed holistically.     | `20260419_payment_system.sql`         |
| **N41** | `LazyImage` exists but `BeforeAfterGallery`, `VideoTestimonials` still use raw `<img>`.             | `src/components`                      |
| **N42** | `@commitlint` installed; husky DEPRECATED warning on `post-checkout` suggests hook scripts drifted. | `.husky/*`                            |
| **N43** | No `pre-push` typecheck.                                                                            | `.husky/*`                            |
| **N44** | 3× arbitrary `bg-[...]` literals (e.g. `TableSkeleton`). Token coverage otherwise strong.           | `src/components/ui/TableSkeleton.tsx` |
| **N45** | `payment_configs` has no admin-write RLS — only service role can change deposit %.                  | `20260419_payment_system.sql:41-45`   |

---

## 4. Revised exhaustive development plan

Roadmap's A/B/C/D structure is preserved. Items already shipped on develop are listed in §2 above. This plan adds **A′** (hardening) and new items inside B/C.

### Phase A′ — Harden what Phase A shipped · **Week 1** · tag `v3.1.1`

Target: close the 8 blockers in §3.1. One PR per task unless noted.

#### A′-1 · Lock down payment surface (N1, N3, N15, N22) — ~1.5 days

- [ ] Auth-gate `GET /api/payments/status/[invoiceId]`: require `patient_id = auth.uid() OR is_non_doctor_admin()` at the route layer. Return `404` (not `403`) on mismatch to avoid enumeration.
- [ ] Replace `console.warn` at `monobank-webhook/route.ts:35` with `logger.warn`; add a signature-failure counter.
- [ ] Tighten `payments` UPDATE RLS in a new migration `20260421_payments_rls_tighten.sql`:
  ```sql
  WITH CHECK (
    status IN ('created','pending')
    AND appointment_id IN (SELECT id FROM appointments WHERE patient_id = auth.uid())
    OR public.is_non_doctor_admin()
  );
  ```
- [ ] Add webhook idempotency table:
  ```sql
  CREATE TABLE payment_webhook_events (
    invoice_id text NOT NULL,
    event_hash text NOT NULL,
    received_at timestamptz DEFAULT now(),
    PRIMARY KEY (invoice_id, event_hash)
  );
  ```
  Hash raw body; reject duplicate hashes.
- [ ] Unit tests — `monobank-webhook.test.ts`: signature ok/ko, replay rejected, bad body rejected, idempotent double-delivery.

#### A′-2 · RLS belt-and-braces for cabinet/export (N2) — ~0.5 day

- [ ] Change `cabinet/export/route.ts` to filter explicitly: `.eq('id', user.id)` on patients, `.eq('patient_id', user.id)` on appointments/reviews/chat_sessions. RLS is the suspenders; the belt is in code.
- [ ] Playwright E2E `e2e/cabinet-export.spec.ts` — seed two patients, log in as A, assert export contains only A's ids.

#### A′-3 · Idempotent notification queueing (N5, N13) — ~1 day

- [ ] Migration `20260421_notification_events_unique.sql` — `UNIQUE (appointment_id, type, COALESCE(scheduled_at, created_at))`; back-fill with pg sanity script.
- [ ] `app/api/appointments/route.ts:181-192`: `await` the notification insert; on failure Sentry.captureException + retry-once; if still failing, return 201 with `sentry_tag: "booked_but_no_email_queued"`.
- [ ] Update `cron/notifications` to `INSERT ... ON CONFLICT DO NOTHING` for self-healing.

#### A′-4 · Clinical audit coverage (N4) — ~0.5 day

- [ ] Migration `20260421_audit_treatment_materials_used.sql` — attach `capture_admin_audit_log()` trigger to INSERT/UPDATE/DELETE on `treatment_materials_used`. Same for `payments`, `treatment_records`.

#### A′-5 · Account deletion: token revocation (N8) — ~0.5 day

- [ ] After `auth.admin.deleteUser`, call `auth.admin.signOut(userId, 'global')` via service role so active JWTs are revoked server-side.
- [ ] Unit test with mocked Supabase admin client.

#### A′-6 · Raw-console sweep + logger adoption — ~1 day

- [ ] ESLint rule `no-console: error` in `app/` and `src/lib/` (allowlist only `logger.ts`).
- [ ] Replace remaining `console.*` across the 32 API routes that still use it.

#### A′-7 · Secret scanning + schema test infra (N6, N7) — ~1 day

- [ ] `.github/workflows/secrets.yml` — Gitleaks on every PR, fail on high; `.gitleaks.toml` tuned to ignore `docs/` fixtures.
- [ ] `pre-commit` step: `gitleaks protect --staged` husky hook.
- [ ] `.github/workflows/schema.yml` — spin up throwaway Supabase docker, run every migration in order, assert RLS enabled on every PHI/PII table, assert idempotency (apply twice).

**Phase A′ exit criteria**

- All §3.1 blockers merged with tests.
- `npm run test -- --coverage` shows `src/lib` ≥50% (waypoint toward 80%).
- Gitleaks job green on develop + main.
- `schema.yml` job green against live develop migrations.
- Tag `v3.1.1`.

---

### Phase B — Production readiness · **Weeks 2-4** · tag `v3.2.0`

Roadmap items still owed, re-ordered by dependency. ✂ = already landed on develop (moved to §2).

| Item                         | Status                      | Notes / finer actions                                                                                                 |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **B1** AI cost & abuse       | ✂ daily-budget shipped      | Open: per-IP-isolated bucket, Vercel AI Gateway for observability + kill switch. ~1.5 days.                           |
| **B2** Storybook             | ✂ closed as N/A             | —                                                                                                                     |
| **B3** i18n drift            | ✂ test shipped              | Open: floating-UI Cyrillic strings sweep (ROADMAP §18.1). ~0.5 day.                                                   |
| **B4** Cron observability    | ✂ `cron_runs` shipped       | Open: 24h-no-run Sentry rule; end-to-end "booked → email delivered" trace. ~1 day.                                    |
| **B5** Backup & DR           | ❌ not started              | Verify PITR on Supabase (requires paid tier). Write `docs/RUNBOOKS.md#restore`. Quarterly drill. ~1.5 days + ongoing. |
| **B6** Public POST hardening | partial                     | Audit 7 public POST routes; add Vercel BotID as edge pre-filter. Close N27, N34. ~1 day.                              |
| **B7** Seed story            | ✂ 13-module preprod shipped | Open: `seed:preprod:refresh` sliding-window (roadmap §16.7). ~0.5 day.                                                |
| **B8** Admin UX polish       | partial                     | ~0.5 day.                                                                                                             |
| **B9** Performance pass      | not run                     | Bundle analyze, recharts lazy audit, LCP/INP from Speed Insights RUM. Close N23 + N41. ~1.5 days.                     |
| **B10** SEO + canonical      | ✂ shipped                   | Open: StructuredData verification post-canonical flip (N38). ~0.5 day.                                                |

**New in Phase B** (audit delta):

| ID        | Task                                                                                                                                                                    | Effort |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **B-N1**  | Central `withListLimit(MAX=200)` helper in `src/lib/api-security.ts`; apply to 11 admin list routes. Closes N11.                                                        | 0.5 d  |
| **B-N2**  | Upload safety: MIME allowlist, `sharp` dimension check, per-admin quota counter, antivirus via Supabase Edge Function. Closes N12.                                      | 1 d    |
| **B-N3**  | `admin_users` id uniqueness + collapse `is_admin` / `is_admin_actor` to single canonical function. Closes N16, N18.                                                     | 0.5 d  |
| **B-N4**  | Realtime chat soft-delete: `chat_sessions.deleted_at`, update RLS + realtime filter. Closes N17.                                                                        | 0.5 d  |
| **B-N5**  | Index pack migration `20260422_perf_indexes.sql`. Closes N26.                                                                                                           | 0.5 d  |
| **B-N6**  | Sentry `beforeSend` scrubber: hash email/phone/names in payload + breadcrumbs. Session Replay at `replaysSessionSampleRate: 0.05` with `maskAllText: true`. Closes N21. | 0.5 d  |
| **B-N7**  | Services soft-delete: `services.is_active`, views hide inactive, no hard deletes. Closes N25.                                                                           | 1 d    |
| **B-N8**  | Inventory SECURITY DEFINER: rewrite `deduct_inventory`/`add_inventory` in plpgsql with audit insert, role check, `SELECT FOR UPDATE`. Closes N32.                       | 0.5 d  |
| **B-N9**  | Bundle regression gate GHA: compare `.next/analyze/client.json` vs main; fail if >5 % growth on first-load JS. Closes N23.                                              | 0.5 d  |
| **B-N10** | Playwright `fullyParallel: true` + isolate auth via storage-state fixtures per role. Drop `continue-on-error` on `preview-validate.yml`. Closes N9, N10.                | 0.5 d  |

**Phase B exit criteria**

- All §3.2 high-severity findings closed.
- CI median PR ≤ 3 min; preview-validate is blocking.
- Bundle size tracked; no regression on develop.
- PITR verified + restore runbook present.
- Tag `v3.2.0`.

---

### Phase C — Polish & launch · **Weeks 5-7** · tag `v3.3.0`

Roadmap Phase C items that still stand:

1. **C1** — Admin-scope a11y audit with authed axe run. Close modal focus-trap (N20). ~1 d.
2. **C2** — Unified `<EmptyState>` / `<ErrorState>` / `<Skeleton>` primitives; audit all `/admin/*` and `/cabinet/*`. ~1.5 d.
3. **C3** — Mobile audit 320–1440 on Home/Booking/Cabinet/Admin + floating-UI z-index tier (ROADMAP §18.1). ~1 d.
4. **C4** — Email template polish (en/pl translator-reviewed; typed React components; preview page shipped). Close N36 with unit tests per template. ~1.5 d.
5. **C5** — Analytics events — 15-event taxonomy. Emit via `@vercel/analytics` `track()` + Sentry breadcrumb. Build Vercel dashboard. ~1 d.
6. **C6** — Admin onboarding tour verification post-RBAC. ~0.5 d.
7. **C7** — Privacy/legal final pass (lawyer review, cookie consent gating). Export/delete already shipped; requires A′-2. ongoing.
8. **C8** — Launch checklist: extend `docs/LAUNCH.md` with rollback + on-call rotation. ~0.5 d.

**New Phase-C items (audit delta):**

- **C-N1** — Admin refactor-in-place: extract `useAdminList<T>` hook + shared filter/pagination/sort; apply to top 3 largest admin pages as pilot (N19, N31). Surgical, not a rewrite. ~2 d.
- **C-N2** — Form harmonization: move remaining forms (contact, newsletter, feedback, review-submission, admin edits) to RHF+Zod via `useAppForm` wrapper (N30). ~1.5 d.
- **C-N3** — Error-boundary coverage for dynamic-imported chunks (`LiveChat`, `AIAssistant`, `BookingForm`) + Sentry breadcrumb (ROADMAP §18.1). ~0.5 d.
- **C-N4** — Observability adoption sweep: every API route uses `logger`, every mutation emits a structured event. Closes 32/42-route gap. ~1 d.

**Phase C exit criteria**

- WCAG 2.1 AA externally audited (roadmap open q #5).
- Every email lands uk/en/pl, tested in Gmail/Outlook/Apple Mail.
- Speed Insights LCP/CLS/INP all "good" on top-5 pages.
- Tag `v3.3.0` → **public launch**.

---

### Phase D — Post-launch hardening · **Weeks 8+** · `v3.4.0`+

Roadmap D1–D6 mostly shipped on develop; remaining items:

- **D2** — RUM trace-id propagation Vercel → Sentry.
- **D7** (new) — **Vercel Queues** pilot for email delivery. Replace `cron/notifications` polling. ~2 d.
- **D8** (new) — **Rolling Releases** for production traffic (10 → 50 → 100 % over 30 min) for any release touching payments/auth. ~0.5 d.
- **D9** (new) — **AI Gateway migration** finishes B1's second half. ~1 d.
- **D10** (new) — Coverage lift plan: monthly `+10 %` on `src/lib` thresholds until 80 %. ongoing.

---

## 5. Sequencing & dependency graph

```
A′-1  payments lockdown  ─┐
A′-2  cabinet export     ─┼──► any Phase-B work touching patient data
A′-3  notif idempotency  ─┘
A′-4  audit trigger      ── independent
A′-5  token revocation   ── independent
A′-6  console sweep      ── ESLint blocks future regressions
A′-7  schema + secrets CI ─► blocks Phase B (safety net)

(A′ complete → cut v3.1.1)

B-N3  admin_users unique ─► B-N5 index pack
B-N7  services soft-delete ─► B1 AI Gateway (uses admin-config table)
B-N4  chat soft-delete ─┐
B-N6  sentry scrubber  ─┼─► B9 performance pass (clean data for RUM)
B-N2  upload safety    ─┘

(B complete → cut v3.2.0)

C-N1  useAdminList refactor ─► C2 empty/error/loading states sweep
C-N2  form harmonization    ─► C4 email templates
C-N3  error boundaries      ── independent
C-N4  logger adoption       ── tail of A′-6

(C complete → cut v3.3.0 → LAUNCH)
```

---

## 6. Definition of done (per phase)

| Area                                 | A′ exit          | B exit                | C exit (launch)                                                     |
| ------------------------------------ | ---------------- | --------------------- | ------------------------------------------------------------------- |
| Unit coverage (`src/lib`, `app/api`) | ≥ 50 %           | ≥ 65 %                | ≥ 80 %                                                              |
| E2E critical flows                   | 5 suites         | 9 suites              | 12 suites (adds payment, chat round-trip, treatment sign → cabinet) |
| CI median PR time                    | ≤ 5 min          | ≤ 3 min               | ≤ 3 min                                                             |
| `console.*` in `app/` + `src/lib/`   | 0 (ESLint-gated) | 0                     | 0                                                                   |
| Blocking preview-validate            | advisory         | **blocking**          | blocking                                                            |
| Secret scanning                      | GHA + pre-commit | + weekly full history | + quarterly external                                                |
| Sentry PII                           | default off      | scrubber active       | scrubber + replay + trace IDs                                       |
| RLS regression tests                 | ad-hoc           | per-table snapshot    | per-table + role matrix                                             |
| Supabase PITR                        | verified         | restore drilled       | restore drilled quarterly                                           |

---

## 7. Open questions requiring human decision

ROADMAP §14 list stands. This review adds:

8. **Webhook replay window** — how long do we cache `payment_webhook_events` entries before GC? 30 days proposed (N5/N22).
9. **Soft-delete policy** — do services, materials, doctors become soft-deleted, or do we accept "hard delete blocked if referenced"? Needed before B-N7.
10. **Bundle regression threshold** — 5 % tolerated, or stricter 2 % for first-load JS?
11. **Sentry replay sampling** — 5 % enough, or go higher for bug hunt? Cost implication.
12. **AI Gateway timing** — this release or next? Additional integration hop.

---

## 8. Immediate next 5 actions (this week)

1. Cut `feature/payments-lockdown` off develop with A′-1 (webhook idempotency table + `console.warn` fix + status route auth gate). Highest-risk public surface.
2. Cut `feature/cabinet-export-hardening` — A′-2. Small, testable.
3. Land `chore/secret-scanning-and-schema-ci` — A′-7. Unblocks every subsequent change.
4. **Decide payments scope** (ROADMAP open q #1) — the monobank code is shipped; confirm it's in-scope for v3 (implies B6 webhook hardening is launch-blocking) or roll back to "phase-D payments" and hide the endpoints.
5. Verify Supabase tier — PITR / paid plan status. Without this, B5 cannot start.

---

## 9. What this plan does **not** touch

- Architectural commitments in ROADMAP §2 (Next.js 16, Supabase, i18next, Tailwind 3, Vitest+Playwright, Resend, Sentry) — stable, don't churn.
- `develop` as preprod branch — roadmap §3.2 reversal stands.
- Multi-tenancy — deferred per open question #2.
- Rewrite of working admin pages — C-N1 is a targeted hook extraction, not a rewrite.

---

**Status after this plan lands:** v3.3.0 with 9.0+ confidence score, WCAG-audited, PITR-drilled, payments hardened, AI-governed, coverage 80 %+, preview-validate blocking. Single-developer estimate: **6–7 calendar weeks** of focused work.

---

## 10. Functional inventory — public surface

Sections 2–9 audited the platform. Sections 10–12 audit **what users and admins can actually do**.

### 10.1 Public routes

| Route                                                                                                                      | User actions                                                                             | Data source                                     | Working?                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| `/` Home                                                                                                                   | Hero CTA → `/booking`; view features, services, pricing, gallery teaser; language switch | Static i18n + `images.json`                     | ✅                                           |
| `/about`                                                                                                                   | Read content                                                                             | Static i18n                                     | ✅                                           |
| `/services`                                                                                                                | Browse categories, expand cards, view price                                              | `/api/services` + i18n                          | ✅                                           |
| `/gallery`                                                                                                                 | Browse images, open lightbox                                                             | `images.json` + Supabase                        | ✅                                           |
| `/reviews`                                                                                                                 | —                                                                                        | —                                               | ⛔ **301 → `/`** (public submission removed) |
| `/contact`                                                                                                                 | Submit contact form; click phone/email                                                   | `/api/contacts`                                 | ✅                                           |
| `/booking`                                                                                                                 | 3-step: service/date/time/doctor → personal info → Turnstile + confirm                   | `/api/appointments/slots` + `/api/appointments` | ✅                                           |
| `/booking/success`                                                                                                         | Download `.ics`, view confirmation                                                       | Success page props                              | ✅                                           |
| `/booking/payment-result`                                                                                                  | View post-payment status                                                                 | Query params                                    | ✅                                           |
| `/privacy-policy`, `/terms-of-service`                                                                                     | Read                                                                                     | Static i18n                                     | ✅                                           |
| `/symptom-checker`                                                                                                         | Pick 10 symptoms → urgency + recommendation → `/booking` or phone CTA                    | i18n                                            | ✅ (basic, no live LLM call in flow)         |
| `/patient/[id]`                                                                                                            | Public patient profile (unclear audience)                                                | Supabase                                        | 🟡 route exists, scope unclear               |
| `/api-docs`                                                                                                                | Read API docs                                                                            | OpenAPI                                         | 🟡 presence unverified                       |
| `/auth/login`, `/auth/sign-up`, `/auth/sign-up-success`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/callback` | Sign-in / sign-up / password reset / OAuth callback                                      | Supabase                                        | ✅                                           |

### 10.2 Cabinet routes (patient auth-gated)

| Route                   | Actions                                                                                                       | Working?                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/cabinet`              | Greeting; next-appt card; stats (upcoming/completed/total); profile-completeness; quick links; 5 recent appts | ✅                                                                   |
| `/cabinet/appointments` | Filter (all/upcoming/past); cancel (modal); reschedule (mini-calendar + slot picker); add-to-calendar         | ✅                                                                   |
| `/cabinet/profile`      | Edit name, patronymic, phone, DOB                                                                             | ✅                                                                   |
| `/cabinet/treatments`   | Read cards + line items (tooth #, cost, payment status)                                                       | ✅ (read only)                                                       |
| `/cabinet/payments`     | Read payment history; filter/sort                                                                             | 🟡 works but sidebar link labeled "soon"; hardcoded Ukrainian labels |
| `/cabinet/settings`     | Privacy controls, export data, delete account                                                                 | 🟡 functional but minimal UX                                         |

### 10.3 Gaps ranked

**🟥 Critical**

- No family/dependents accounts — one patient = one account; parents manually manage children's bookings.
- No outstanding-balance surface — `/cabinet/payments` shows receipts only; no "balance due" card, no pay-now CTA.
- `/reviews` redirected without a replacement — social-proof regression; no on-site submission, no testimonials strip.
- "Soon" badge on cabinet Payments link while the page is live → user confusion.

**🟧 High**

- No PDF export of treatment record / appointment receipt.
- No in-app doctor↔patient messaging (only anonymous `LiveChat`).
- No 2FA / passkey on auth.
- No "rate after completed treatment" prompt.
- Hardcoded Ukrainian labels on `/cabinet/payments`.
- No treatment-history visual timeline / before-after photos.

**🟨 Medium**

- No individual doctor profiles (bio, specialization, photo).
- No FAQ page.
- No Insurance / payment-options page.
- No pre/post-op instructions per treatment (downloadable).
- No standalone accessibility statement page (panel exists; no link in footer).
- Symptom-checker urgency doesn't pre-fill the booking form.
- PWA configured; offline booking UX unverified.
- Reschedule modal = one day at a time; no multi-day availability view.

**🟩 Low**

- `/patient/[id]` public route of unclear scope.
- No careers / parking / directions / emergency pages.
- No `Product` schema for services, no `Event` schema for appointments.

---

## 11. Functional inventory — admin surface

### 11.1 Pages × actions × CRUD

| Page                     | Actions                                                                                     | CRUD                                 | Notes                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `/admin` Dashboard       | Stats, service pie chart                                                                    | R                                    | Role-aware; doctor sees own slice only                                                                       |
| `/admin/appointments`    | Create, status edit, cancel, bulk status, search, filter (status, date)                     | C, R, partial U (status), D (cancel) | No walk-in anon; no bulk reschedule; no SMS from detail; doctor RLS-scoped                                   |
| `/admin/patients`        | Create, edit, delete, search                                                                | Full                                 | Medical-notes read-only in edit form; no allergies flag; no document upload; no GDPR-export button           |
| `/admin/doctors`         | Create, edit, delete, active toggle, bulk                                                   | Full                                 | No schedule/day-off/working-hours UI; ratings read-only                                                      |
| `/admin/services`        | Create, edit, delete, search, filter, bulk                                                  | Full                                 | i18n in 3 locales; no cloning; no usage analytics                                                            |
| `/admin/treatments`      | Create, status flow (draft→signed→completed), payment status (5), materials, search, filter | C, R, U (stage), partial D           | No invoice; no line-item discount; no multi-visit plan                                                       |
| `/admin/materials`       | Create, edit, delete, stock, supplier info                                                  | Full                                 | Low-stock threshold stored but not surfaced on dashboard; no reorder suggestions                             |
| `/admin/orders`          | Multi-step status (draft → pending → approved → ordered → delivered), cancel                | C, R, U, partial D                   | Audit trail exists; no delivery-receipt scan                                                                 |
| `/admin/reviews`         | Approve/reject, feature/unfeature, search, filter                                           | R, U                                 | No admin reply; no moderation reason captured                                                                |
| `/admin/contacts`        | Mark read, status, inline admin notes, search                                               | R, U                                 | No delete; no email-reply button                                                                             |
| `/admin/analytics`       | Refresh, filter 7/30/90 days                                                                | R                                    | No custom date range; no per-doctor or per-service drill-down; no CSV export; no occupancy / no-show metrics |
| `/admin/settings`        | Profile, preferences, audit log, restore-from-audit                                         | R, U                                 | Destructive restore requires reason + comment; no invite-user UI                                             |
| `/admin/users`           | Create via API invite, edit role + fields, delete                                           | C (API), R, U, D                     | Role-change UI doesn't enforce hierarchy client-side; no password-reset button                               |
| `/admin/data-quality`    | Refresh checks                                                                              | R                                    | Read-only alerts; no remediation                                                                             |
| `/admin/health`          | Refresh checks (Supabase, email, Sentry, payment, CliniCards)                               | R                                    | No actions; some deps are key-presence-only                                                                  |
| `/admin/email-templates` | Preview 4 template types with sample data                                                   | R                                    | No edit; no test-send; sample data hardcoded Ukrainian                                                       |
| `/admin/chat`            | View sessions, reply                                                                        | R, U                                 | Admin→patient only; no staff-to-staff channel                                                                |

### 11.2 Per-role missing workflows

| Role               | Biggest daily gaps                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Receptionist       | Schedule calendar, walk-in flow, SMS send, allergies/flag on booking screen                                              |
| Doctor             | Patient clinical-history sidebar, clinical-assessment field, time-off request, inventory access, tooth-specific findings |
| Billing manager    | Invoice export by range, outstanding-balance aging, per-doctor / per-service revenue, refund UI                          |
| Inventory manager  | Auto-reorder suggestions, low-stock dashboard widget, delivery-receipt scan, supplier performance                        |
| Analyst            | Custom date ranges, per-dimension drill-downs, CSV/PDF export on every chart, cohort analysis                            |
| Assistant          | Today's wall calendar, material pick-list per treatment, patient-history sidebar, post-op capture                        |
| Admin / Superadmin | All the above + invite-user UI, medical-note edit audit, refund processing, discount override                            |

### 11.3 Admin gaps ranked

**🟥 Critical (daily blockers)**

1. No doctor schedule / availability management.
2. No walk-in / anonymous appointment booking from admin.
3. No bulk reschedule / reassign action.
4. No in-app patient messaging (SMS/email) from appointment or patient detail.
5. No invoice / receipt generation.
6. No line-item discount / price override.
7. No refund processing UI.
8. Dashboard has no operational alerts (low-stock, overdue, unpaid).

**🟧 High (weekly+)** 9. No multi-visit treatment-plan builder. 10. No allergies / red-flag visible before booking. 11. No recurring / follow-up appointment templates. 12. No admin-reply on reviews. 13. No custom analytics date ranges. 14. No per-doctor / per-service analytics breakdown. 15. No occupancy / no-show rate. 16. No clinical-history sidebar on appointment detail.

**🟨 Medium (monthly+)** 17. No materials-usage analytics. 18. No audit on patient medical-notes edits. 19. No automated low-stock reorder suggestions. 20. No appointment-source analytics. 21. No treatment-outcome / complication tracking. 22. No staff performance metrics. 23. No doctor time-off request flow. 24. No SMS / email campaign builder.

**🟩 Low (operational polish)** 25. Admin layout is desktop-centric — front-desk tablet ergonomics weak. 26. No CSV export on any table. 27. No bulk patient import. 28. No cloning for services / treatments. 29. Email templates are read-only (no admin customization, no test-send). 30. No audit / history on contact-submission edits.

---

## 12. Operational-functionality backlog (phase-mapped)

Functional work running adjacent to §4. Most is Phase C / D; four items are launch-sensitive and belong inside the pre-launch plan.

### 12.1 Pre-launch (slot into existing phases)

| ID      | Item                                                                                                                                                                             | Phase                | Effort |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------ |
| **F-1** | Restore public testimonials — either re-open `/reviews` submission with Turnstile, or surface a curated strip sourced from admin-approved reviews. Undo social-proof regression. | **C** (pair with C5) | 1 d    |
| **F-2** | Fix "soon" badge on cabinet Payments link + finish i18n of `/cabinet/payments`.                                                                                                  | **C** (pair with C2) | 0.5 d  |
| **F-3** | Outstanding-balance card + pay-now CTA on `/cabinet` — gated on payments scope (ROADMAP open q #1). If payments in-scope, land in **B**; if deferred, land in **D**.             | **B** or **D**       | 1–2 d  |
| **F-4** | "Rate after completed treatment" prompt on cabinet appointment card.                                                                                                             | **C**                | 0.5 d  |

### 12.2 v3.4 operational-functionality track (post-launch, ~4-5 weeks)

Grouped into 4 coherent mini-releases plus a stretch tier.

**v3.4.1 — Front-desk workflow (1 week)**

- F-5 Doctor schedule calendar (week + day grid; working hours; day-off).
- F-6 Walk-in / anonymous booking from admin (create-on-the-fly patient).
- F-7 Bulk reschedule / reassign (multi-select → move slot / switch doctor).
- F-8 Allergies / medical flags surfaced on appointment + patient detail.

**v3.4.2 — Patient communication (1 week)**

- F-9 Admin→patient messaging (SMS via Vonage/Twilio + email via Resend).
- F-10 Doctor↔patient messaging inside cabinet (authenticated).
- F-11 Admin reply on reviews (public).
- F-12 Rate-after-treatment loop (extends F-4 with reminder notification).
- F-13 Campaign builder (newsletter + recall reminders for recurring hygiene).

**v3.4.3 — Billing & clinical depth (~1.5 weeks)**

- F-14 Invoice / receipt PDF (i18n, branded).
- F-15 Line-item discount / price override on treatments.
- F-16 Refund processing UI on payments.
- F-17 Multi-visit treatment plan builder (linked treatment records).
- F-18 Recurring / follow-up appointment templates ("next cleaning in 6 months").
- F-19 PDF export of treatment record + pre/post-op instructions (patient side).

**v3.4.4 — Analytics & insights (1 week)**

- F-20 Custom date ranges on `/admin/analytics`.
- F-21 Per-doctor / per-service drill-down.
- F-22 Occupancy / no-show rate dashboard.
- F-23 Materials-usage + appointment-source analytics.
- F-24 Staff performance metrics (management-role gated).
- F-25 CSV export on every admin table.
- F-26 Operational alerts widget on admin dashboard (low-stock, overdue, unpaid).

**v3.4.5 — Stretch (allocate ad hoc)**

- F-27 Family / dependents accounts.
- F-28 2FA / passkeys.
- F-29 Tablet-optimized admin layout.
- F-30 Doctor time-off request flow.
- F-31 Delivery-receipt scan in orders.
- F-32 Auto-reorder suggestions for low-stock materials.
- F-33 Doctor profile pages + credentials.
- F-34 FAQ, Insurance, Careers, Parking, Emergency pages.
- F-35 Admin-editable email templates + test-send.

### 12.3 What this backlog does NOT propose

- Replacing CliniCards, Supabase, Resend, Vercel.
- Multi-tenant platform (ROADMAP open q #2).
- Native mobile app (PWA remains the mobile story).
- Telemedicine / patient-portal video.

### 12.4 Cross-reference with `docs/POST_LAUNCH_BACKLOG.md`

The v3.4 track above is intentionally narrow and operational. [POST_LAUNCH_BACKLOG.md](./POST_LAUNCH_BACKLOG.md) holds the wider 12-month product backlog (Telegram/Viber, deposits, recall, e-signature, family accounts). Items F-5…F-26 here **complement** that backlog; owner should choose which to ship first per v3.4 release slot.

---

## 13. Product-vision & innovation backlog (v4+)

Everything up to v3.4 is **consolidation** — make what we have correct, safe, and operationally complete. v4 and beyond is where the product should graduate from "clinic software" into a **dental-health platform**. This section is the **strategic backlog**: items that need owner decisions on strategy, budget, partners, and regulatory posture before any engineering starts.

> Items here are intentionally bigger than the F-series; expect weeks–months per item, and in several cases team growth (ML engineer, medical-device QA, commerce operations).

### 13.1 Strategic themes

| Theme                                       | What it unlocks                                                                                                   | Fit with current stack                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **T1 · Telehealth**                         | Async + live remote care, follow-up triage, post-op monitoring                                                    | LiveChat + Supabase Realtime + Resend already in place; video-SDK is new                                                 |
| **T2 · Clinical AI**                        | Image analysis (X-ray, intraoral), chart-note dictation, risk scoring, treatment recommendation, smile simulation | Builds on Vercel AI SDK + AI Gateway (B1). Heavy-model inference lives outside Vercel (HF / Replicate / self-hosted GPU) |
| **T3 · Clinical collaboration & referrals** | Second opinion, referral network, case review, time-bound external access                                         | RLS + audit log already mature. Needs temporal-access-grant model + external-user auth                                   |
| **T4 · Commerce — DentalStory Shop**        | Oral-care products, post-treatment care kits, subscriptions, gift cards, cross-sell on booking                    | Monobank payment stack exists; needs PIM (product info mgmt), stock, shipping, tax                                       |
| **T5 · Engagement & loyalty**               | Referral rewards, family plans, financing / BNPL, insurance claim auto-submission, gamified dental-health scoring | Cabinet + notifications ready; needs partner integrations (Monobank parts, insurers, Klarna-like)                        |
| **T6 · Advanced imaging**                   | CBCT / intraoral scanner integration, DICOM viewer, panoramic X-ray review in cabinet                             | Outside current stack — storage tier + DICOM.js viewer or third-party embed                                              |
| **T7 · Practice intelligence**              | ML no-show prediction, demand forecasting, dynamic pricing, smart doctor-skill-to-case matching                   | Current Postgres sufficient for v1; add analytics warehouse (BigQuery / ClickHouse) at scale                             |
| **T8 · Multi-clinic platform**              | Franchise / chain model, cross-clinic patient portability, brand-level analytics                                  | Needs `clinic_id` tenant column across ~20 tables (ROADMAP open q #2)                                                    |
| **T9 · Regulatory depth**                   | E-prescriptions (UA eHealth), insurance claims, digital patient consent replacing wet-ink                         | UA-specific regulatory work; requires legal partner + possibly medical-device certification                              |
| **T10 · Research & education**              | Anonymized outcomes data for research partnerships, staff CPD module, case library for teaching                   | Low-hanging once T2 + audit data mature                                                                                  |

### 13.2 Backlog items by theme

Items include **rough effort** (S / M / L / XL = days / weeks / months / quarter+) and **owner-decision prerequisites**. Effort is "engineering only" — assumes design & content ready.

#### T1 Telehealth

| ID      | Item                                                                                                                                                                                               | Effort | Notes                                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I-1** | **Video consultation** — 1-on-1 patient↔doctor video via Daily.co / Whereby / Zoom Video SDK; scheduled through existing booking; recorded into appointment record with consent; waiting-room flow | L      | Pick provider (Zoom Video SDK has dental customers); UA-GDPR data-residency check required; add `consultation_mode: 'in_person' \| 'video' \| 'async'` to appointments |
| **I-2** | **Async photo/video triage** — patient submits clinical photos via cabinet; AI pre-classifies urgency (builds on `/symptom-checker`); queues for receptionist triage                               | M      | Needs Supabase Storage tier upgrade + private buckets; great for distance/emergency                                                                                    |
| **I-3** | **Post-op healing check-ins** — automated cabinet prompts at day 1/3/7 post-surgery; patient submits photo + symptom answers; flagged if concern                                                   | M      | Uses notification_events queue + Storage; low-cost retention play                                                                                                      |
| **I-4** | **Remote second-opinion (paid)** — standalone service: patient uploads X-ray + complaint, gets written assessment from clinic doctors within 48h; priced flat                                      | L      | Monetized; requires T3 infra for auth-less external expert access                                                                                                      |

#### T2 Clinical AI

| ID       | Item                                                                                                                                                                                                 | Effort | Notes                                                                                                                                                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **I-5**  | **AI X-ray analysis (caries detection)** — upload periapical/bitewing X-ray; model detects caries, periapical lesions, bone loss; overlays on image; confidence per finding; doctor approves/rejects | XL     | Build-vs-buy: DentalXr.ai, Denti.AI, Pearl, Overjet offer APIs ($ per image). Custom YOLO + dental-labeled dataset is 3-6 months of ML work. Regulatory: likely **not** a medical device if positioned as "decision support for a licensed dentist"; still need UA-MOH review. |
| **I-6**  | **Panoramic X-ray structural analysis** — tooth numbering, eruption, wisdom-tooth detection, cyst/lesion flagging on OPG                                                                             | XL     | Same build-vs-buy as I-5.                                                                                                                                                                                                                                                      |
| **I-7**  | **Intraoral photo analysis** — plaque / calculus detection, gum-line recession tracking over visits, discoloration staging                                                                           | L      | Lower regulatory bar; great for hygiene workflow.                                                                                                                                                                                                                              |
| **I-8**  | **Clinical-note dictation** — doctor speaks, Whisper / GPT-4o converts into structured SOAP note attached to treatment record; tooth-chart auto-filled                                               | M      | Uses AI Gateway + Whisper; browser-side mic with consent banner. Big doctor-time win.                                                                                                                                                                                          |
| **I-9**  | **Treatment-plan recommendation engine** — given chief complaint + X-ray findings + patient history → suggests a multi-visit plan (linked to F-17); doctor edits/approves                            | L      | Starts rule-based; upgrades to ML after 2-3k treatment records collected.                                                                                                                                                                                                      |
| **I-10** | **Caries / periodontal risk scoring** — per-patient longitudinal risk score → drives recall cadence                                                                                                  | S–M    | Pure data product; visible in cabinet as "your dental-health score".                                                                                                                                                                                                           |
| **I-11** | **Smile design simulation** — upload face photo → generate aesthetic preview of veneers / whitening / alignment; used in treatment-proposal flow                                                     | L      | Third-party APIs exist (SmileMate-like). Strong conversion tool for cosmetic dentistry.                                                                                                                                                                                        |
| **I-12** | **AI chat upgrade — symptom checker → clinical chatbot** — beyond today's static symptom selector; RAG over FAQ + real-time triage; routes to video consult (I-1) or booking                         | M      | Stream with AI SDK v6; connect to AI Gateway for fallback + cost ceiling.                                                                                                                                                                                                      |

#### T3 Clinical collaboration & referrals

| ID       | Item                                                                                                                                                                                | Effort | Notes                                                                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I-13** | **Share patient record with an external doctor** — time-bound (default 7 days), audit-logged, read-only link that needs one-time-code + email verification; can be revoked any time | M      | Schema additions: `patient_access_grants(patient_id, grantee_email, scope, expires_at, revoked_at)`. RLS policy extension — this is exactly where `current_doctor_id()` pattern gets extended to `has_grant(patient_id)`. |
| **I-14** | **Referral workflow** — "refer to specialist X with full clinical context"; accepts/rejects with reason; integrates with partner clinics or external network                        | L      | Pair with I-13. Needs partner-clinic onboarding flow.                                                                                                                                                                     |
| **I-15** | **Case-review board** — doctors submit anonymized cases; peers vote / comment; CPD credit                                                                                           | M      | Internal MVP first (single-clinic); broaden after T10.                                                                                                                                                                    |
| **I-16** | **Multi-doctor treatment plan** — plan spans 2+ specialists (e.g., endodontist + prosthodontist); visible to both; shared chat room per case                                        | M      | Builds on I-13 + F-17.                                                                                                                                                                                                    |
| **I-17** | **Digital consent — wet-ink replacement** — patient e-signs consent form in cabinet before treatment; stored with hash + timestamp + device fingerprint                             | M      | UA e-signature law compliance (or Diia integration) — legal partner required.                                                                                                                                             |

#### T4 Commerce — DentalStory Shop

| ID       | Item                                                                                                                                                         | Effort | Notes                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------ |
| **I-18** | **MVP shop — 10-20 SKU (toothbrushes, pastes, floss, whitening kits)** with cart, checkout (Monobank), shipping (Nova Poshta API), tax                       | L      | Schema: `products`, `variants`, `inventory`, `orders_shop`, `shipments`. Keep separate from material_orders. |
| **I-19** | **Post-treatment care kits** — after a `treatment_records.status = 'completed'` for specific services, auto-offer matching care kit with discount in cabinet | M      | Rule engine: service → SKU list. High cross-sell conversion for post-op kits.                                |
| **I-20** | **Subscriptions** — recurring toothbrush/paste every 3 months; deposit in cabinet                                                                            | M      | Builds on Monobank recurring (check availability) or invoice-per-cycle.                                      |
| **I-21** | **Gift cards & vouchers** — buy and redeem for services OR shop purchases; track balance                                                                     | M      | Adds `gift_cards` + `gift_card_redemptions`.                                                                 |
| **I-22** | **Referral rewards** — refer-a-friend coupon; referrer earns credit on shop or services                                                                      | S–M    | Pair with T5.                                                                                                |
| **I-23** | **B2B portal — dentists can order supplies** — separate pricing, net-30 invoicing, bulk SKUs                                                                 | L      | Post-v4 depending on clinic demand.                                                                          |

#### T5 Engagement & loyalty

| ID       | Item                                                                                                                                                                    | Effort | Notes                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| **I-24** | **Family / dependents accounts** — guardian manages child profiles; co-sign appointments; merged billing                                                                | M      | Listed as F-27 in operational backlog; real strategic value is revenue (family plans). |
| **I-25** | **Financing / BNPL on treatment plans** — "3-pay" on orthodontics or implants via Monobank Частинами / Privat24 / Klarna-like                                           | L      | UA partner selection.                                                                  |
| **I-26** | **Insurance claim auto-submit** — clinic submits claim on patient's behalf to insurer; status tracked in cabinet                                                        | XL     | UA insurer APIs vary wildly; pilot with one partner.                                   |
| **I-27** | **Gamified dental-health score** — visible in cabinet; improves with check-ups, good reviews, recall compliance; tied to shop discounts                                 | M      | Extends I-10 (risk scoring) into a UX surface.                                         |
| **I-28** | **Recall & reactivation engine** — 6-month cleaning, 12-month check-up, 2-year X-ray re-do; AI-scheduled per risk score; multi-channel (email / SMS / Telegram / Viber) | M      | This is a revenue-compounding feature; pay-off proves in year 1.                       |

#### T6 Advanced imaging

| ID       | Item                                                                                                                         | Effort | Notes                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| **I-29** | **DICOM viewer inside cabinet** — panoramic X-ray / CBCT scan rendered in browser with pan/zoom/annotate; shareable via I-13 | L      | Use `cornerstone3D` or OHIF viewer; Storage plan decision.        |
| **I-30** | **Intraoral scanner import** — accept STL / PLY from TRIOS / iTero / Medit; 3D viewer in cabinet; link to treatment plan     | L      | Niche, but differentiating for orthodontic/prosthodontic clinics. |
| **I-31** | **Face-scan + smile preview** — extension of I-11 using phone camera or tablet                                               | M      | Could be mobile-first; bundled with video consult.                |

#### T7 Practice intelligence

| ID       | Item                                                                                                                                                           | Effort | Notes                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| **I-32** | **No-show prediction** — ML model on historical no-show rate per patient × service × time-of-day; surfaces risk flag at booking; offers overbooking suggestion | M      | ~1 year of data needed first; pair with F-22 (no-show rate dashboard). |
| **I-33** | **Demand forecasting** — predict next 30-day appointment demand per doctor / service; drives staffing                                                          | M      | Same data prerequisite.                                                |
| **I-34** | **Dynamic pricing** — off-peak discount suggestions; evening slot uplift; new-patient incentive                                                                | M      | Owner-strategy call — some markets won't tolerate variable pricing.    |
| **I-35** | **Smart case-to-doctor assignment** — match case complexity to doctor skill/specialization; balances workload                                                  | M      | Extends from receptionist's manual judgment.                           |
| **I-36** | **Warehouse / analytics tier** — export Postgres → BigQuery / ClickHouse; Looker / Metabase for internal BI                                                    | M      | Only when `/admin/analytics` starts buckling.                          |

#### T8 Multi-clinic / platform

| ID       | Item                                                                                                                               | Effort | Notes                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| **I-37** | **Multi-tenant schema migration** — `clinic_id` on all clinic-scoped tables; RLS scoped per clinic; admin_users belong to a clinic | XL     | One-way door. Owner must decide before v4 if "maybe in 2 years" or "yes in 6 months" — the earlier the cheaper. |
| **I-38** | **White-label branding per clinic** — colors, logo, domain, email templates, price lists                                           | M      | Once I-37 lands.                                                                                                |
| **I-39** | **Cross-clinic patient portability** — patient moves city, their record follows                                                    | M      | Needs audit + consent framework from T3.                                                                        |

#### T9 Regulatory depth (UA-specific)

| ID       | Item                                                                                              | Effort | Notes                                                 |
| -------- | ------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| **I-40** | **E-prescription via eHealth** — issue prescriptions through the UA national system               | L      | UA MOH integration; legal partner.                    |
| **I-41** | **Insurance claims portal** — formal integration with UA insurers (INGO, ARX, etc.)               | XL     | Pair with I-26; requires formal partnerships.         |
| **I-42** | **Data-protection tooling** — DPIA templates, data-processing register, subject-access-request UI | M      | Once the clinic scales past small-business exemption. |

#### T10 Research & education

| ID       | Item                                                                                                                          | Effort | Notes                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------- |
| **I-43** | **Anonymized outcomes dataset** — research partnership data feed (opt-in); de-identified treatment records with outcome flags | L      | Revenue (data licensing) and PR value. |
| **I-44** | **Staff CPD module** — in-app training tracks, case library, attestations                                                     | M      | Pair with I-15 case-review board.      |
| **I-45** | **Dental-student observer mode** — students shadow cases (with consent); scoped read access                                   | S      | Leverages I-13 grant model.            |

### 13.3 ICE prioritization (owner fills in)

Use this matrix to rank items. Fill **Impact** (revenue / retention / differentiation), **Confidence** (do we know it will work?), **Ease** (inverse of effort) on a 1-5 scale; sort by `I × C × E`.

Top candidates (my provisional ranking — owner to confirm):

| Item                                   | I   | C   | E   | Score   | Reason                                                     |
| -------------------------------------- | --- | --- | --- | ------- | ---------------------------------------------------------- |
| I-8 Chart-note dictation               | 5   | 4   | 4   | **80**  | Proven tech; huge doctor-time saving; low regulatory risk  |
| I-28 Recall engine                     | 5   | 5   | 4   | **100** | Revenue compounder; partial infra exists; no external deps |
| I-1 Video consultation                 | 4   | 4   | 3   | **48**  | Market trend; differentiates; mid integration cost         |
| I-18 Shop MVP                          | 4   | 4   | 3   | **48**  | Revenue channel; leverages Monobank; finite SKU scope      |
| I-13 Share patient record (time-bound) | 4   | 4   | 4   | **64**  | Unlocks T3; clean schema extension                         |
| I-24 Family accounts                   | 4   | 4   | 3   | **48**  | Retention; listed already as operational gap               |
| I-7 Intraoral photo analysis           | 4   | 3   | 3   | **36**  | Hygiene differentiator; lower regulatory bar than X-ray    |
| I-5 AI X-ray caries detection          | 5   | 3   | 1   | **15**  | High impact but long tail — buy API first, build later     |
| I-17 Digital consent                   | 3   | 4   | 3   | **36**  | Pair with legal review                                     |
| I-37 Multi-tenant                      | 5   | 3   | 1   | **15**  | Only if franchise is the business model                    |

### 13.4 Dependencies on the operational plan

Innovation items should **not** be started until the operational plan they depend on has landed:

| Innovation                   | Gated by                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| T4 Shop (I-18…I-23)          | A′-1 payments lockdown + F-16 refund UI + B-N9 bundle gate                                                    |
| T2 Clinical AI (I-5…I-11)    | B1 AI Gateway migration + PII scrubbing (B-N6) + consent framework (I-17)                                     |
| T1 Video consult (I-1)       | C5 analytics events + C7 privacy pass + ROADMAP open q #6 (Supabase paid tier)                                |
| T3 Collaboration (I-13…I-17) | RLS regression suite (A′-7) + audit trigger (A′-4)                                                            |
| T7 Intelligence (I-32…I-36)  | F-22 no-show dashboard + ≥12 months of clean appointment data                                                 |
| T8 Multi-tenant (I-37)       | Owner decision on franchise model (ROADMAP open q #2) — must land before v4 or it becomes a painful migration |

### 13.5 Suggested v4+ sequencing

```
v4.0 Revenue-first (2-3 months):
  I-28 Recall engine
  I-18 Shop MVP (10-20 SKUs)
  I-19 Post-treatment care kits
  I-24 Family accounts
  I-13 Time-bound patient-record sharing

v4.1 Clinical-workflow AI (1-2 months):
  I-8 Chart-note dictation
  I-10 Risk scoring
  I-12 Upgraded symptom checker → clinical chatbot
  I-27 Gamified health score

v4.2 Telehealth (2 months):
  I-1 Video consultation
  I-2 Async photo triage
  I-3 Post-op check-ins

v4.3 Image-based AI (3-6 months; build OR buy decision):
  I-7 Intraoral photo analysis (buy or self-host CV)
  I-5/I-6 X-ray analysis (partner with Pearl/Overjet/Denti.AI API)
  I-11 Smile design

v4.4 Platform & compliance (strategic; only if growth demands):
  I-37 Multi-tenant (gated on owner decision)
  I-17 Digital consent
  I-40 E-prescription
```

### 13.6 Owner decisions required before v4

In addition to ROADMAP's open questions:

13. **Franchise / multi-clinic?** — dictates whether I-37 lands before or after v4 shop / AI work. Late multi-tenant is a 2× cost migration.
14. **Clinical-AI build vs buy?** — buy API (fast, recurring cost) vs self-host (up-front investment, data advantage, 6–12 month lead time).
15. **Shop inventory model?** — clinic-held stock vs dropship from supplier. Dropship is lower risk but lower margin.
16. **Video platform?** — Zoom Video SDK (polished, paid), Daily.co (dev-friendly), Whereby (simplest). UA-GDPR residency matters.
17. **Telehealth regulatory positioning?** — pure in-clinic extension vs standalone service (higher scrutiny).
18. **Insurance partners?** — which UA insurers to integrate with first, if any.
19. **Data-licensing?** — are anonymized outcomes (I-43) part of the business model?

### 13.7 Staffing implications

One-developer capacity runs out at **v4.0** (operational scope). v4.1+ needs:

- Part-time ML engineer for T2 image analysis (or commit to vendor APIs).
- UX/product-designer for T4 shop + T5 engagement loops.
- Legal counsel retainer for T9 + I-17 + I-26 + I-41.
- Support / operations hire once shop + telehealth go live (order ops, video-call scheduling edge-cases, returns).

---

**Bottom line:** The Phase A′ → C plan takes the product to a **correct, safe, operationally complete clinic webapp**. v3.4 makes it a **clinic-operations tool the front-desk and doctors love**. v4+ is where it becomes a **dental-health platform with revenue beyond appointments**. Your four examples (video consult, AI X-ray, patient-data sharing, DentalStory Shop) are all in here — items I-1, I-5/I-6, I-13, and I-18 respectively — with the dependencies and staging made explicit.

---

## 14. Brand, design & UI/UX maturity track

ROADMAP §2 declared "Brand v2 colors and typography are locked in." That's true for **design tokens** — Nunito/Rubik, the `dental.*` palette, Tailwind 3 config. It is **not** true for brand strategy, design system, content design, UX research, or design ops. The current UI is competent but utilitarian; there is no owned design language, no Figma library, no component documentation, no design principles, no voice-and-tone guide, no motion language, no illustration style.

This section is the design track. It runs **in parallel** with Phase B/C rather than after — design decisions made late become code-rework tax.

### 14.1 Current state (what exists today)

| Layer           | State on develop                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design tokens   | ✅ Tailwind config + CSS custom properties — colors (`dental.primary` / `dental.dark` / …), fonts (`Nunito`, `Rubik`). Minor token drift (e.g. arbitrary `bg-dental-secondary/30` in `TableSkeleton`).                                                                |
| UI primitives   | 🟡 `src/components/ui/` has `Button`, `Input`, `Logo`, `Skeleton`, `TableSkeleton` — small, hand-written. No documented API, no Storybook.                                                                                                                            |
| Brand strategy  | ❌ No owned document for positioning, mission, audience, competitive stance, tone. CLAUDE.md lists colors; no why.                                                                                                                                                    |
| Visual identity | 🟡 Logo exists (`<Logo />` component); no logomark system (primary / monochrome / favicon / app-icon), no color scales beyond tokens, no documented type scale, no iconography rules, no illustration style, no photography guidelines, no motion/animation language. |
| Public IA / UX  | 🟡 Flat IA; conversion funnels (Home → Services → Booking) intuitive but not CRO-tested. No empty-state / error-state library. Floating-UI collision risk noted in ROADMAP §18.1.                                                                                     |
| Admin IA / UX   | 🟡 Functional but power-user features absent: no keyboard shortcuts, no bulk-select conventions, no density modes, no saved views, inconsistent pagination. 800-LOC pages evidence the lack of a design system.                                                       |
| Content design  | 🟡 i18n parity test gates drift across uk/en/pl, but no voice-and-tone guide, no microcopy library, no error-message standards, no terminology glossary, no reading-level budget.                                                                                     |
| Accessibility   | 🟡 axe-core baseline; weekly audit. No manual SR testing, no external audit, no contrast measurement at computed runtime (ROADMAP §18 flagged a suspect).                                                                                                             |
| Motion          | ❌ Scattered CSS transitions; no documented motion scale, no reduced-motion compliance verified.                                                                                                                                                                      |
| Design ops      | ❌ No Figma file linked; no design-token sync pipeline; no visual regression tests; Storybook removed as N/A in B2.                                                                                                                                                   |
| Dark mode       | ❌ Not implemented; not documented as decision.                                                                                                                                                                                                                       |
| Research        | ❌ Zero documented user interviews, usability tests, analytics-driven UX evidence.                                                                                                                                                                                    |

### 14.2 Gap analysis by area

#### 14.2.1 Brand strategy

| Gap                                                                                        | Why it matters                                                                                                                    |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| No written positioning ("premium family clinic in Lviv" vs "tech-forward dental platform") | Every downstream decision (copy, photography, pricing UI) leans on this.                                                          |
| No personas                                                                                | Without personas, product and design discussions flip between "clinic owner", "receptionist", "doctor", "patient" inconsistently. |
| No competitive landscape doc                                                               | Hard to know what to emphasize (price? tech? comfort? location?).                                                                 |
| No tone-of-voice guide                                                                     | EN and PL locales drift subtly in warmth, formality, and clinical-vs-friendly register.                                           |
| No brand story / mission                                                                   | Used on /about and careers; currently generic.                                                                                    |

#### 14.2.2 Visual identity

| Gap                                                                                | Why it matters                                                 |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| No color-scale extension (50, 100, …, 900) on `dental.primary`, `dental.secondary` | Everywhere a shade is needed, devs pick ad-hoc HEX → fracture. |
| No type scale (`display`, `h1…h6`, `body-lg`, `body`, `caption`)                   | Headings inconsistent in size across views.                    |
| No icon system rules — Lucide is used but with inconsistent stroke weights / sizes | Visual rhythm breaks.                                          |
| No illustration style                                                              | Empty states fall back to generic Lucide icons.                |
| No photography style guide                                                         | Gallery mixes stock and clinic photos without a look.          |
| No motion scale (duration / easing tokens)                                         | Transitions feel arbitrary.                                    |
| No spacing scale beyond Tailwind defaults                                          | Cards, modals, page chrome vary in padding.                    |

#### 14.2.3 Design system

| Gap                                                                                | Priority                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| No documented component contract (Button variants, Input states, Modal a11y rules) | 🟥 — pairs with C-N1 admin refactor                                 |
| No Figma library synced to code                                                    | 🟧 — required before hiring designers                               |
| No token-in-code source (e.g. Style Dictionary)                                    | 🟧 — tokens live in Tailwind only; designer can't edit              |
| No Storybook or component docs                                                     | 🟧 — closed in B2 as N/A; should be reopened post-C-N1 pilot        |
| No visual-regression test                                                          | 🟨 — catches unintended design churn                                |
| No light/dark theming architecture                                                 | 🟨 — dark mode is a future choice; architecture should not block it |
| No primitive audit (`<Button>` used consistently vs inline classes)                | 🟨 — drives C-N1 extraction                                         |

#### 14.2.4 Content design / UX writing

| Gap                                                                                   | Priority                              |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| No voice-and-tone guide per locale                                                    | 🟧 — inconsistent patient-facing copy |
| No microcopy library (error messages, empty states, confirmations, toast patterns)    | 🟧 — each view reinvents              |
| No reading-level target (e.g. Flesch-Kincaid 6-8 for patient surfaces, 10+ for admin) | 🟨                                    |
| No terminology glossary (clinical terms vs lay terms mapped)                          | 🟨                                    |
| No email template voice guide                                                         | 🟨 — C4 opens the door                |

#### 14.2.5 UX research

| Gap                                                                                                                        | Priority                       |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| No documented interviews with real users (clinic owner counts; additional: receptionist, doctor, patient 30+, patient 60+) | 🟥 — design-by-assumption risk |
| No usability tests of booking, cabinet, or admin flows                                                                     | 🟧                             |
| No analytics-driven funnel audit (once C5 events ship, this becomes possible)                                              | 🟧                             |
| No journey maps per persona                                                                                                | 🟨                             |

#### 14.2.6 Public surface

| Gap                                                                                                                     | Priority            |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Hero CRO not tested (offer, CTA, social proof placement)                                                                | 🟧                  |
| Service page doesn't show per-service duration / before-after examples / doctor pairing                                 | 🟧                  |
| No conversion funnel from `/symptom-checker` → booking with pre-filled reason                                           | 🟨 — builds on I-12 |
| No trust-building elements (licenses, certifications, awards) on home                                                   | 🟨                  |
| No per-locale landing pages tuned to market (uk = local-trust-heavy, en = tech-forward, pl = cross-border patient flow) | 🟨                  |

#### 14.2.7 Admin surface

| Gap                                                                                           | Priority                                 |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| No keyboard shortcuts (quick-nav: `g a` = appointments, `/` = search, `⌘K` = command palette) | 🟧 — biggest front-desk speed win        |
| No command palette (⌘K → "create appointment", "switch doctor", "open patient Y")             | 🟧                                       |
| No saved views (per-user filters for table pages)                                             | 🟧                                       |
| No density modes (compact / default / comfortable) for tables                                 | 🟨                                       |
| No bulk-select conventions consistent across entities                                         | 🟨 — OK on some pages, missing on others |
| No inline-edit / optimistic-UI on simple fields                                               | 🟨                                       |
| No per-page help / empty-state illustrations with CTA                                         | 🟨                                       |
| No in-product changelog or "what's new" modal                                                 | 🟩                                       |

#### 14.2.8 Design ops

| Gap                                                               | Priority |
| ----------------------------------------------------------------- | -------- |
| No Figma library                                                  | 🟧       |
| No design-tokens-as-code pipeline (Style Dictionary or similar)   | 🟨       |
| No visual regression (Chromatic / Percy / Playwright screenshots) | 🟨       |
| No `.github/DESIGN_REVIEW.md` template                            | 🟩       |
| No accessibility audit process beyond axe                         | 🟧       |

### 14.3 Brand/design backlog (severity-ranked)

**🟥 Launch-gate (must be in place before v3.3.0)**

- **D-1** Brand strategy doc (positioning, mission, personality, 3 personas). 0.5 week with owner.
- **D-2** Voice-and-tone guide per locale (uk authoritative; en/pl translated + adapted). 0.5 week.
- **D-3** Component contract docs for top 10 primitives (Button, Input, Modal, Table, Form, Toast, Skeleton, EmptyState, ErrorState, Badge). Lands on the back of C2 primitives. 1 week.
- **D-4** Microcopy library covering: validation errors, empty states, confirmations, success toasts, loading states, disabled states. Matches i18n keys. 1 week.
- **D-5** External a11y audit (ROADMAP open q #5). 2 weeks turnaround; book early.

**🟧 v3.4-or-earlier (for a polished front-desk + patient experience)**

- **D-6** Figma library mirroring design tokens + primitives. Hire a part-time designer or invest 3 days + Figma UI kit template.
- **D-7** Color-scale extension (`dental.primary-50` … `-900`; `dental.dark-50` … `-900`; semantic aliases for `success`, `warning`, `danger`, `info`). Codemod across components.
- **D-8** Type scale tokens (`text-display` / `text-h1` / … / `text-caption`) + Tailwind plugin. Replaces ad-hoc `text-4xl font-bold`.
- **D-9** Iconography rules (stroke 1.5px, size 16/20/24 canonical, no mixing with emoji). Lucide-only allowlist.
- **D-10** Motion scale (`duration-fast` / `duration-base` / `duration-slow`, `ease-brand`). Enforce reduced-motion.
- **D-11** Admin command palette (⌘K) + core keyboard shortcuts.
- **D-12** Unified empty/error/skeleton states (pairs with C2).
- **D-13** Visual regression via Playwright snapshots on 10 canonical pages.

**🟨 v4+ (design system maturity)**

- **D-14** Storybook (or Ladle) reintroduced with component docs, a11y addon.
- **D-15** Dark-mode architecture (token duality; defer shipping).
- **D-16** Illustration system (custom empty-state illustrations; can commission or use a style-consistent vendor).
- **D-17** Photography style guide + clinic-photography shoot.
- **D-18** Saved views on every admin table.
- **D-19** Density modes + inline edit + optimistic UI.
- **D-20** Usability-testing cadence (5 participants × key flow × quarterly).
- **D-21** Journey maps per persona.

### 14.4 Owner decisions

20. **Designer role** — hire a full-time product designer, retain a part-time one, or stay developer-designed? Affects whether D-6…D-21 are realistic.
21. **External a11y audit vendor + timing** — already ROADMAP open q #5; pin a vendor now (~€800-2000) and book; audits take 2 weeks turnaround.
22. **Dark mode as a feature** — commit before or after launch? Architecture cost is modest now, painful later.
23. **Brand evolution vs conservation** — the current look is calm / medical / clean. Do we push toward "tech-forward / bold" (matches the AI features in §13) or conserve trust-signaling?
24. **Design-tool choice** — Figma (standard), Penpot (open-source), or developer-first Tailwind-native.
25. **Illustration commission vs stock** — affects D-16 budget.

### 14.5 Suggested sequencing

```
(in parallel with Phase B)
  D-1 Brand strategy      → 3 days with owner
  D-2 Voice & tone        → 3 days (draft + review)

(in parallel with Phase C — pair with C2, C4, C6)
  D-3 Component contracts → tied to C-N1 (useAdminList pilot)
  D-4 Microcopy library   → tied to C4 email polish
  D-5 External a11y audit → book at start of C, results land mid-C

(v3.4 design track; 2-3 weeks total if a designer is hired)
  D-6 Figma library
  D-7 Color scales       }
  D-8 Type scale         } one PR per token family
  D-9 Iconography rules  }
  D-10 Motion scale      }
  D-11 Command palette + shortcuts
  D-12 Empty/Error/Skeleton unified
  D-13 Visual regression

(v4+)
  D-14 Storybook
  D-15 Dark mode
  D-16 Illustration system
  D-17 Photography shoot
  D-18 Saved views
  D-19 Density / inline / optimistic
  D-20 Usability testing
  D-21 Journey maps
```

---

## 15. CI/CD architecture — current, gaps, target

ROADMAP §3 reformed CI/CD in Phase A (slim `ci.yml`, preview-validate, Dependabot grouping, weekly security-audit, husky post-checkout env link). That is tactical cleanup. The questions **what is our pipeline philosophy, how do we protect production, how do we roll back?** are not yet answered. This section is the deeper architecture.

### 15.1 Current pipeline (post-Phase A)

```
Developer pushes feature/* ─► GitHub PR (base = develop)
                                 │
                 ┌───────────────┼────────────────┐
                 ▼               ▼                ▼
            ci.yml         preview deploy   claude.yml
        ─ lint+tsc        (Vercel preview)  (PR review,
        ─ test (vitest)        │              optional)
        ─ e2e-ui-smoke         ▼
        ─ e2e-feature       preview-validate.yml
                         (E2E vs preview URL,
                          continue-on-error ⚠)

Merge ─► develop ─► Vercel Preprod deploy (stable URL, seeded)
                                 │
                                 ▼
                         UAT by clinic owner
                                 │
                  PR develop → main (release)
                                 │
                                 ▼
                          Vercel Production
                                 │
                                 ▼
                          release.yml
                       (tag + GH release)

Scheduled:
  ─ security-audit.yml (Mon 06:00 UTC, npm audit)
  ─ weekly-a11y.yml    (Sun 00:00 UTC, axe against routes)
  ─ Dependabot         (grouped minors/patches weekly)
```

**Strengths:**

- One-way promotion flow is clean (ROADMAP §3.2).
- Dedicated preprod environment with seeded data.
- Preview URL per PR.
- Security + a11y on schedule.
- Husky hooks for lint-staged and env linking.

**Weaknesses (audit + review delta):**

1. **Preview-validate is advisory** (`continue-on-error: true`) — failures don't block merge.
2. **Playwright is serial** (`fullyParallel: false`) — 10+ min E2E jobs.
3. **Each CI job re-runs `npm ci --legacy-peer-deps`** — no shared node_modules cache.
4. **No DB-migration CI** — migrations are applied manually via Supabase dashboard / CLI; no per-PR sandbox DB, no dry-run, no RLS snapshot test.
5. **No schema/type/Zod contract tests** (N6).
6. **No secret scanning** in CI or pre-commit (N7).
7. **No bundle regression gate** (N23) — analyzer exists, not CI-blocking.
8. **No coverage gate** — vitest thresholds are cosmetic (15%).
9. **No a11y blocking on PR** — weekly only.
10. **Release is manual** — `package.json` version bump + tag; `release.yml` reacts but doesn't author.
11. **No feature flags** — every merge goes global; dark-launch impossible.
12. **No canary / rolling releases** (ROADMAP §10 mentions for Phase C).
13. **No automated rollback** — manual Vercel redeploy only; DB rollback story absent (DOWN migrations don't exist).
14. **No Supabase branching per PR** — preview deploys point at the shared develop DB; a PR with a schema change silently breaks other PRs' previews.
15. **No artifact signing / SBOM / provenance** (supply-chain hygiene).
16. **No monitoring-triggered post-deploy actions** (e.g. auto-rollback on Sentry error-rate spike).
17. **No skew protection** decision (ROADMAP §10) — critical for PWA + in-flight cron during deploys.
18. **No test-result aggregation / trend** — flakiness isn't tracked over time.
19. **Preview-validate does not parallelize with ci.yml** — each round-trip is sequential.

### 15.2 Quality gates — what each exists and how it blocks

| Gate                           | Exists?            | Blocks?        |
| ------------------------------ | ------------------ | -------------- |
| Lint                           | ✅                 | ✅             |
| Typecheck                      | ✅                 | ✅             |
| Unit test                      | ✅                 | ✅             |
| Coverage threshold             | 🟡 (15%, cosmetic) | ❌             |
| E2E (localhost)                | ✅                 | ✅             |
| E2E (preview URL)              | ✅                 | ❌ advisory    |
| a11y audit                     | ✅                 | ❌ weekly only |
| Bundle size                    | 🟡 (analyzer only) | ❌             |
| Security audit (npm audit)     | ✅                 | 🟡 weekly      |
| Secret scan                    | ❌                 | —              |
| Schema / RLS tests             | ❌                 | —              |
| Visual regression              | ❌                 | —              |
| Performance budget (LCP / INP) | ❌                 | —              |
| Format check                   | ✅                 | ✅             |

### 15.3 Target CI/CD architecture

The target distinguishes **per-PR gates** (fast, blocking), **per-environment gates** (slower, blocking), **scheduled gates** (trend + policy), and **deploy orchestration** (rollout + rollback).

```
Per-PR (≤3 min, blocking):
  ┌ lint + tsc + format              (parallel job)
  ├ unit tests with coverage ratchet (parallel job, gate: ≥last main%)
  ├ secret scan (gitleaks)           (parallel job)
  ├ migration dry-run + RLS snapshot (parallel job, Supabase docker)
  ├ bundle delta                     (parallel job, fail > threshold)
  └ Vercel preview deploy            (external gate)

Per-preview (≤5 min, blocking):
  ┌ E2E smoke against preview URL    (fullyParallel: true)
  ├ a11y axe against preview URL     (blocking on top-10 routes)
  ├ Lighthouse perf budget           (blocking on 4 pages)
  └ visual regression snapshots      (Chromatic / Playwright)

Per-develop (post-merge → Preprod):
  ┌ Apply migration to Preprod Supabase branch
  ├ Seeded E2E suite (full critical flows)
  ├ Synthetic uptime probe from 3 regions
  └ Manual UAT gate (clinic owner check-in)

Per-main (post-release):
  ┌ Changesets-authored release PR (auto)
  ├ Apply migration to Prod Supabase (manual approval for destructive)
  ├ Rolling release 10% → 50% → 100% (Vercel)
  ├ Post-deploy smoke (3 regions)
  ├ Monitoring watch window (5 min): Sentry error rate, INP, booking success
  └ Auto-rollback trigger if gate breaches

Scheduled:
  ┌ Security audit (weekly) — fail on high
  ┌ Secret-scan full history (weekly)
  ┌ a11y audit against Prod (weekly)
  ┌ License/SBOM audit (monthly)
  └ Dependency updates (Renovate or Dependabot grouped, auto-merge on green)
```

### 15.4 Gap → target, by area

#### 15.4.1 Feature flags (new capability)

- Adopt **Vercel Edge Config** as the flag substrate. Tiny (<300ms read), edge-local, cheap.
- Small wrapper in `src/lib/flags.ts` (typed, server-safe).
- Start with 3 use cases: `payments_enabled`, `ai_chat_enabled`, `video_consult_enabled`.
- A/B experimentation (ROADMAP D6 playbook) rides the same substrate.

#### 15.4.2 Database migration CI/CD

- **Per-PR sandbox DB** — `supabase db push` to a temp branch; run migration dry-run; fail on lock-taking `ALTER TABLE`.
- **Per-migration contract:** every new `supabase/migrations/*.sql` must have either (a) idempotent re-apply, (b) a paired `*_rollback.sql` if destructive.
- **RLS snapshot test** — serialize every policy to YAML; diff vs previous; require approval on changes to patient/PHI tables.
- **Supabase branches** — each PR preview points at its own Supabase branch (ROADMAP §3.3 B5). Merge to develop promotes migrations; merge to main promotes to Prod with manual approval.
- **Migration lockfile** — assert that all migrations listed in order; catch ordering collisions.
- **Backwards-compat requirement** — two-phase schema changes: expand (add column nullable) → migrate data → contract (drop / NOT NULL / rename). No one-shot breaking migrations.

#### 15.4.3 Release automation

- **Changesets** (`@changesets/cli`) — devs add a changeset per PR; merge to `main` opens Version Packages PR; merge it tags + authors GH release + updates CHANGELOG.
- Deprecate manual version bumps. Consolidate `release.yml` down to just a Release-workflow trigger.
- Each release records: commit SHA, deploy ID, DB migration range, feature-flag state.

#### 15.4.4 Rollback strategy

- **App rollback** — Vercel "promote previous deployment" (1-click). Set up an SLO-based alert that suggests rollback.
- **DB rollback** — standard is forward-fix, not roll-back. For destructive migrations, require a rollback migration committed alongside the forward one. Test both in CI.
- **Rolling-release guard** — if monitoring detects a breach during a 10%/50% stage, auto-halt and notify.
- **Data-state rollback** — rely on Supabase PITR (B5) as last resort; cadence drilled quarterly.

#### 15.4.5 Quality-gate hardening

| Gate              | Current            | Target                                            | How                                             |
| ----------------- | ------------------ | ------------------------------------------------- | ----------------------------------------------- |
| Coverage          | 15% (cosmetic)     | Ratchet: "new PR coverage ≥ main's coverage"      | `nyc check-coverage` + vitest-coverage-v8 in CI |
| E2E on preview    | advisory           | **blocking**                                      | Drop `continue-on-error` (B-N10)                |
| Bundle            | analyzer only      | block if first-load JS grows >5% vs main          | GHA `build → analyze → compare` step (B-N9)     |
| a11y              | weekly only        | block on top-10 routes per PR                     | move axe from weekly to per-preview-validate    |
| Secret scan       | none               | gitleaks on every PR + pre-commit                 | A′-7                                            |
| Performance       | Speed Insights RUM | Lighthouse CI with perf budget per page           | new `lighthouse.yml`                            |
| Visual regression | none               | Playwright snapshot compare on 10 canonical pages | D-13                                            |
| Schema            | none               | per-PR sandbox DB + RLS snapshot diff             | A′-7 (schema.yml)                               |

#### 15.4.6 Deploy orchestration

- **Rolling releases** (Vercel, GA since June 2025) — enable for `main` production deploys; 10% → 50% → 100% over 30 min; auto-halt on error-rate spike (Sentry integration).
- **Skew protection** (Vercel) — enable for PWA and cron compatibility during deploys.
- **Preview → Preprod → Prod parity:** identical env-var keys; per-environment values; same Node version; same Supabase schema state (via branching).
- **Deploy freeze windows** — codify in `.github/deploy-windows.yml`: no prod deploys Friday 17:00–Monday 08:00 Kyiv unless emergency.
- **Canary user pool** — first 10% is a specific Edge Config allowlist (staff + volunteer patients) rather than random traffic, for payments/auth-touching releases.

#### 15.4.7 Supply chain & provenance

- **SBOM** — `syft` or GitHub native SBOM per release; store on GH release asset.
- **Signed commits** — opt-in initially; enforce on main post-v4.
- **Artifact attestation** — GitHub's `actions/attest-build-provenance` on production build.
- **Lockfile policy** — `npm ci` everywhere; no `--force`; `serialize-javascript` override already in place as precedent.
- **License audit** — monthly `license-checker`; fail on incompatible licenses sneaking in.

#### 15.4.8 CI performance

| Change                                         | Win                         |
| ---------------------------------------------- | --------------------------- |
| Shared `actions/setup-node` cache              | ~1 min per job              |
| `fullyParallel: true` + shard E2E by spec file | ~5 min on E2E               |
| Upload test artifacts only on failure          | reduces runtime 30s         |
| Job concurrency cancellation on PR push        | saves wasted minutes        |
| Turbopack-build cache in `.next/cache`         | 30-60s on subsequent builds |

Target: **median PR CI ≤ 3 min** (currently ~8+ min).

#### 15.4.9 Observability-driven CI/CD

- **Sentry → GitHub checks** — if a newly-deployed release's error rate breaches a baseline, append a check failure that offers rollback.
- **Vercel Speed Insights → bundle gate** — if INP regresses on a canary, halt rollout.
- **Vercel Analytics funnel → release annotation** — mark each release on analytics so regressions are attributable.
- **Deploy annotations in Sentry** — already possible; wire it.

#### 15.4.10 Secrets & environment management

- Single-source env definitions via `vercel env pull` into a gitignored `.env.local` (already the pattern).
- `scripts/link-env.mjs` covers worktrees (A4 shipped).
- **No env drift detection** — add `vercel env diff` CI step to flag env-var drift between environments.
- **Per-environment Resend + CliniCards + Monobank keys** — already planned in ROADMAP §3.3-A; verify actually configured.
- **Secret rotation calendar** — document 90-day rotation for `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, webhook signing keys.

### 15.5 CI/CD backlog (phase-mapped)

**Phase A′ (this week — safety net)**

- **CI-1** Gitleaks secret scanning (A′-7).
- **CI-2** Schema CI — migration dry-run + idempotency + RLS coverage snapshot (A′-7).
- **CI-3** Drop `continue-on-error` on preview-validate (pair with B-N10).
- **CI-4** Share `actions/setup-node` cache across jobs (quick win).

**Phase B (weeks 2-4)**

- **CI-5** Playwright `fullyParallel: true` + shard by spec (B-N10).
- **CI-6** Bundle regression gate (B-N9).
- **CI-7** Changesets adoption; retire manual version bumps.
- **CI-8** Supabase branching per PR preview.
- **CI-9** Feature-flag substrate on Vercel Edge Config (`src/lib/flags.ts`).
- **CI-10** Coverage ratchet gate in vitest.
- **CI-11** Env-drift check (`vercel env diff`) as CI step.

**Phase C (weeks 5-7)**

- **CI-12** Lighthouse CI with perf budget on 4 pages (pair with B9).
- **CI-13** Visual regression (D-13).
- **CI-14** Skew protection enabled on Vercel.
- **CI-15** Rolling releases enabled on production with canary allowlist.
- **CI-16** A11y moved from weekly to per-preview-validate (blocking on top-10 routes).

**Phase D (post-launch)**

- **CI-17** SBOM + build-provenance attestation.
- **CI-18** Monitoring-triggered rollback (Sentry error-rate → rollout halt).
- **CI-19** Renovate migration (if Dependabot groupings fall short).
- **CI-20** Flakiness trend tracker (Playwright JUnit → GH Action summary).
- **CI-21** Deploy annotations (Sentry + Vercel Analytics).
- **CI-22** Secret-rotation calendar automation.

### 15.6 Owner decisions

26. **Supabase branching** — adopt (recommended, per ROADMAP) or run separate project for preprod? Branching is cheaper but a year-old feature.
27. **Rolling-release canary pool** — staff-only, staff + volunteers, or percentage-based?
28. **Feature-flag platform** — Vercel Edge Config (cheap, limited UI), Flagsmith / LaunchDarkly (paid, richer), or homegrown? Edge Config fits current scale.
29. **Monitoring-triggered auto-rollback** — auto-halt (safer, can disrupt) or alert-only (slower, safer-seeming)?
30. **Supply-chain posture** — SBOM + provenance now or post-launch? Required for some enterprise buyers; not for clinic-direct.

### 15.7 Target metrics

- Median PR CI time: ≤ 3 min (currently ~8 min).
- Preview-validate: blocking; ≤ 5 min.
- Deploy-to-production window: < 10 min from release PR merge to 100% traffic.
- Rollback latency: < 5 min from detection to 100% previous-deployment traffic.
- Per-PR Supabase-branch cost: < $1/PR/day (with TTL GC).
- Coverage ratchet: monotonically increasing on `src/lib`, `app/api`; 80% by launch.

---

**Bottom line on design & CI/CD:** Both are under-served in the current plan. Design needs a parallel track starting now (D-1 brand doc, D-2 voice guide, D-5 a11y vendor booking) so it doesn't become a pre-launch scramble. CI/CD needs Supabase branching + feature flags + changesets landed in Phase B so v4 innovation work (especially AI image analysis and payments) has proper dark-launch, canary, and rollback controls. Neither is optional if the product is going past "good clinic site" into "platform".

---

## 16. Testing strategy

Testing has appeared piecemeal across this doc (§3.1 N6, §4 A′-7, §6 DoD, §15.2 quality gates). This section consolidates it into a single **owned strategy** — what we test, at what layer, with what tooling, at what coverage, with what gates, and who owns it.

### 16.1 Current state (audited)

- **Unit** — Vitest, 17 test files / ~39 tests on develop. Coverage **~12%** of `src/lib`. `vitest.config.ts` thresholds are `lines:15, functions:13` (cosmetic). 17 critical modules have **zero tests**: `supabase/server`, `monobank`, `review-stats` (caused prod crash), `email-templates`, `email`, `ai-usage`, `clinicards-client`, both chat hooks, `pagination`, several validation schemas.
- **E2E** — Playwright, 4 specs shipped on develop (`booking-flow`, `cabinet-flows`, `admin-rbac`, `cron-notifications`). `fullyParallel: false`, `retries: 2`. Auth reuse via storage-state. Additional specs exist (`admin-full-flows`, `cabinet-full-flows`, `live-chat-full`, `material-orders-full`, `treatment-records-full`, `qa-audit-live`) but not in CI.
- **Integration** — none. No DB contract tests, no Zod↔schema parity tests, no RLS regression tests.
- **A11y** — axe-core against 11 routes, runs on Vercel preview (post-deploy) and weekly.
- **Performance** — Speed Insights RUM (read-only, no gate).
- **Security** — `npm audit` weekly (no PR gate), no secret scan, no DAST, no OWASP ZAP.
- **Visual regression** — none.
- **Load / stress** — none.
- **Chaos / failure injection** — none.
- **Contract (API)** — no tests assert `/api/*` response shape matches TS types.
- **Manual QA** — implicit; not documented; no checklist.

**Score:** testing is at the "unit + E2E smoke" maturity level. For a clinical-data product with RLS, payment, and AI, that's a **2 out of 5** on a standard maturity scale. Target before launch: **4 out of 5**.

### 16.2 Target testing pyramid

```
                 ┌────────────┐
                 │  Manual QA │  small, focused per release
                 └─────┬──────┘
                       │
              ┌────────┴───────┐
              │   E2E (UI)     │  ~15-20 specs against preview URL
              │  fullyParallel │  sharded, blocking in preview-validate
              └────────┬───────┘
                       │
          ┌────────────┴────────────┐
          │  Integration / Contract │  ~60-80 tests
          │  (DB + API + Zod + RLS) │  sandbox Supabase per PR
          └────────────┬────────────┘
                       │
     ┌─────────────────┴─────────────────┐
     │            Unit tests             │  ~400-500 tests
     │  (lib, utils, hooks, components)  │  ≥80% lines on src/lib, app/api
     └───────────────────────────────────┘
     +
     ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
     │  Perf (Lighthouse│   │   a11y (axe)   │   │  Visual regress │
     │  CI per PR)     │   │ blocking top-10│   │  Playwright snap│
     └────────────────┘   └────────────────┘   └────────────────┘
     +
     Scheduled: security audit, secret-scan full history, load test (pre-release), synthetic uptime
```

### 16.3 Test types — what each does and target coverage

| Type                         | Tool                                             | Target coverage / scope                                                                                                                               | Gate                                        |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Unit**                     | Vitest + RTL                                     | ≥ 80% lines on `src/lib/`, `src/services/`, `app/api/`. Every Zod schema. Every pure helper. React components only if non-trivial logic.              | Blocking per PR; coverage ratchet           |
| **Integration — API**        | Vitest + MSW + test Supabase                     | Every `app/api/**/route.ts` exercised with happy + auth-fail + validation-fail + DB-error paths. Consistent `{ok,data,error}` shape asserted.         | Blocking per PR                             |
| **Integration — DB/RLS**     | Vitest + Supabase Postgres docker                | Every RLS policy tested per role × operation (SELECT/INSERT/UPDATE/DELETE). Matrix: 8 roles × ~20 tables × 4 ops. Snapshot diff on any policy change. | Blocking per PR                             |
| **Contract (Schema parity)** | `pgtyped` / Supabase types + Vitest              | TS types regenerated from current DB; assert `npm run types:check` is clean. Assert Zod shapes ↔ DB columns per-entity.                               | Blocking per PR                             |
| **E2E UI**                   | Playwright                                       | 15-20 specs covering every critical flow (see §16.4). `fullyParallel: true`, sharded, blocking.                                                       | Blocking in preview-validate                |
| **E2E cron / background**    | Playwright + test-harness route                  | Cron handlers tested by POSTing with/without `CRON_SECRET`; notification queue state assertions.                                                      | Blocking per PR                             |
| **E2E webhook**              | Playwright + signed-payload fixture              | Monobank webhook: signature OK/KO, replay rejected, idempotency, all state transitions.                                                               | Blocking per PR                             |
| **A11y**                     | axe-core via Playwright + `@axe-core/playwright` | Top-10 public routes + every admin page (authed). WCAG 2.1 AA.                                                                                        | Blocking per preview                        |
| **Performance**              | Lighthouse CI                                    | LCP ≤ 2.0s, INP ≤ 200ms, CLS ≤ 0.1 at p75 on Home / Services / Booking / Cabinet                                                                      | Blocking per preview; annotated per release |
| **Visual regression**        | Playwright snapshot / Chromatic                  | 10 canonical pages × 3 viewports                                                                                                                      | Blocking per preview                        |
| **Security — SAST**          | GitHub CodeQL                                    | JS/TS rule set                                                                                                                                        | Blocking per PR                             |
| **Security — secrets**       | Gitleaks                                         | Pre-commit + per-PR + weekly full history                                                                                                             | Blocking per PR                             |
| **Security — dependencies**  | `npm audit` + Renovate/Dependabot                | High/critical fail CI; auto-PR updates                                                                                                                | Weekly schedule, high = block               |
| **Security — DAST**          | OWASP ZAP baseline                               | Scheduled weekly against preprod                                                                                                                      | Non-blocking, triage                        |
| **Load**                     | k6 / Artillery                                   | 50 RPS on `/api/appointments`, `/api/ai/chat`, `/api/contacts`; error rate < 1%, p95 < 500ms                                                          | Monthly + pre-release                       |
| **Chaos / resilience**       | Manual toggles + fault-injection                 | Supabase down, Resend down, CliniCards 500, Redis down — verify graceful degradation                                                                  | Quarterly drill                             |
| **Manual QA**                | Checklist per release                            | Smoke on real devices (iOS/Android/Windows/Mac browsers), real email delivery, real payment sandbox                                                   | Each release                                |

### 16.4 Per-surface test plans

#### 16.4.1 Public site — critical flows

| Flow                                                               | Unit            | Integration                                 | E2E                  | A11y | Perf |
| ------------------------------------------------------------------ | --------------- | ------------------------------------------- | -------------------- | ---- | ---- |
| Home render + language switch persistence                          | schema          | —                                           | ✓                    | ✓    | ✓    |
| Services list + filter + link to booking                           | component logic | `/api/services` contract                    | ✓                    | ✓    | —    |
| Gallery lightbox keyboard nav                                      | component       | —                                           | ✓                    | ✓    | —    |
| Contact form submit + Turnstile + CSRF                             | schema          | `/api/contacts` happy + spam + rate-limit   | ✓ (mock Turnstile)   | ✓    | —    |
| Booking step 1 (service/date/time/doctor) — slots fetch + fallback | schema          | `/api/appointments/slots` — live + fallback | ✓                    | ✓    | ✓    |
| Booking step 2 (personal info) — validation                        | schema          | —                                           | ✓                    | ✓    | —    |
| Booking step 3 (Turnstile + submit) — success + email queued       | schema          | `/api/appointments` + notification queue    | ✓ (assert queue row) | ✓    | —    |
| Booking success page + `.ics` download                             | —               | —                                           | ✓ (assert ics bytes) | ✓    | —    |
| Payment initiation → redirect to Monobank                          | —               | `/api/payments/create`                      | ✓                    | —    | —    |
| Payment result page handles all states                             | —               | —                                           | ✓                    | ✓    | —    |
| Symptom checker → booking / phone CTA                              | logic           | —                                           | ✓                    | ✓    | —    |
| Sign-up → email confirmation → login → cabinet redirect            | —               | Supabase auth                               | ✓                    | ✓    | —    |
| Forgot-password → reset-password round trip                        | —               | Supabase auth                               | ✓                    | ✓    | —    |
| Cookie consent → Sentry/GA respect rejection                       | —               | —                                           | ✓                    | ✓    | —    |

#### 16.4.2 Cabinet (patient) — critical flows

| Flow                                                                       | Unit         | Integration                        | E2E                        |
| -------------------------------------------------------------------------- | ------------ | ---------------------------------- | -------------------------- |
| Dashboard stats render + profile-completeness                              | component    | aggregates                         | ✓                          |
| Appointments list filter (all / upcoming / past)                           | filter logic | `/api/appointments` scoped         | ✓                          |
| Cancel appointment → Supabase status + email queued                        | —            | `/api/appointments/[id]/cancel`    | ✓ (assert queue)           |
| Reschedule appointment — slot picker → `/api/appointments/[id]/reschedule` | schema       | round-trip                         | ✓                          |
| Add to calendar (`.ics`)                                                   | —            | —                                  | ✓                          |
| Profile edit + phone + DOB validation                                      | schema       | `/api/patients/:id`                | ✓                          |
| Treatment history cards + line items                                       | —            | `/api/treatment-records?mine=true` | ✓                          |
| Payments read                                                              | —            | `/api/payments` scoped             | ✓                          |
| Settings — data export download                                            | —            | `/api/cabinet/export` — scope test | ✓ (assert only own rows)   |
| Settings — delete-account → JWT revoked                                    | —            | `/api/cabinet/delete-account`      | ✓ (assert 401 on next req) |

#### 16.4.3 Admin — critical flows (matrix by role)

For every admin flow there is an RBAC dimension. Test per-role: authorized / unauthorized / out-of-scope.

| Flow                                             | Per role tested                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Appointments — create, status transition, cancel | receptionist (can), doctor (own only), analyst (read only), assistant (no create) |
| Patients — CRUD + medical-notes edit + audit     | admin (full), doctor (own), receptionist (no delete), analyst (read)              |
| Doctors — CRUD + active toggle                   | superadmin/admin only; others 403                                                 |
| Services — CRUD + bulk                           | admin (full), receptionist (no), inventory_manager (no)                           |
| Treatments — status flow draft→signed→completed  | doctor (own), admin (all), assistant (edit draft only), analyst (read)            |
| Materials — CRUD + stock                         | inventory_manager (full), admin (full), doctor (read)                             |
| Orders — approve → ordered → delivered           | admin (approve), inventory_manager (create/update), receptionist (no)             |
| Reviews — approve/reject/feature                 | admin (full), analyst (read)                                                      |
| Contacts — mark / notes                          | admin + receptionist (edit), others (no)                                          |
| Analytics — view + filter                        | admin + billing_manager + analyst (view), others (no)                             |
| Settings — audit restore                         | superadmin (full), admin (view), others (no)                                      |
| Users — CRUD + role change                       | superadmin only                                                                   |
| Data Quality                                     | analyst + admin                                                                   |
| Health                                           | admin + superadmin                                                                |
| Email templates — preview                        | admin                                                                             |
| Chat — reply                                     | admin, receptionist, doctor, assistant                                            |

Implementation: one Playwright test per flow parameterized over role storage-state fixtures.

#### 16.4.4 Cross-cutting flows

| Flow                                                               | Tooling                                                                    |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Cron `notifications` — idempotent under parallel invocation        | Vitest + Supabase docker; invoke twice, assert single email row            |
| Cron `reminders` — 24h-before delivery; time-boxed                 | Vitest with time freeze                                                    |
| Cron `low-stock-alerts` — per-material dedup                       | Vitest                                                                     |
| Monobank webhook — sig OK/KO, replay, all statuses                 | Vitest + signed-payload fixtures                                           |
| Rate limit — Upstash bucket exhausted → 429                        | Vitest with in-memory bucket mock + Playwright for e2e                     |
| CSP enforcement — nonce on script tags, no `unsafe-eval` in prod   | Playwright assert response header                                          |
| CSRF on public POST — missing token → 403                          | Playwright + direct fetch                                                  |
| Supabase Realtime — chat_messages subscribe/unsubscribe on unmount | RTL + jsdom                                                                |
| i18n parity across 3 locales                                       | existing `i18n-parity.test.ts` + every route smoke-rendered in each locale |
| Skew protection — deploy-mid-session behavior                      | manual + Vercel feature                                                    |

### 16.5 Test data strategy

- **Unit** — pure fixtures in-file. No DB. Deterministic.
- **Integration / E2E** — **Supabase branch per PR** (§15.4.2), seeded with a **small deterministic subset** of the preprod seed (§16 of ROADMAP): 3 doctors, 5 services, 10 patients, 20 appointments, 5 treatments, 10 materials, 5 orders, 2 chat sessions, 5 reviews. Runs in seconds.
- **Preprod** — full 1,200-appointment seed with sliding-window refresh (ROADMAP B7). UAT uses this.
- **Production** — never seeded.
- **Role fixtures** — one Playwright `storageState` per role, generated via `auth.admin.createUser` + `admin_users` insert in a `global-setup.ts`.
- **PII hygiene in seed** — every email ends with `@preprod.dentalstory.test`; every phone is `+380 68 000 00XX`; every name is faker-generated; deterministic via `faker.seed(42)`.

### 16.6 Tooling choices

| Concern          | Pick                                                                               | Reason                                         |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| Unit             | Vitest                                                                             | already in use; fast                           |
| API integration  | Vitest + `app/api/**/route.ts` directly invoked as Node functions (no server boot) | avoids Playwright overhead                     |
| DB integration   | Supabase local (docker)                                                            | matches prod; migrations apply                 |
| E2E              | Playwright                                                                         | already in use; parallelize                    |
| A11y             | `@axe-core/playwright` + `pa11y` for keyboard                                      | axe is installed                               |
| Visual           | Playwright snapshot (cheap) → Chromatic if budget allows                           | no new tool cost initially                     |
| Performance      | Lighthouse CI                                                                      | pair with Vercel Speed Insights                |
| Security         | CodeQL + Gitleaks + Renovate/Dependabot + OWASP ZAP                                | CodeQL is free in GitHub                       |
| Load             | k6                                                                                 | industry standard; cheap                       |
| Mocking HTTP     | MSW                                                                                | best DX for Supabase + Resend + Monobank stubs |
| Contract (types) | `supabase gen types` + TS strict                                                   | already-shipped capability                     |

### 16.7 Ownership / RACI

| Test type               | Responsible           | Accountable        | Consulted                    | Informed |
| ----------------------- | --------------------- | ------------------ | ---------------------------- | -------- |
| Unit                    | Dev who wrote feature | Dev team lead      | —                            | —        |
| Integration API         | Dev who wrote feature | Dev team lead      | Security lead for auth paths | Owner    |
| RLS matrix              | Dev + DBA role        | Owner              | Security lead                | —        |
| E2E                     | Dev who wrote feature | QA lead (rotating) | Design lead                  | Owner    |
| A11y                    | QA lead               | Design lead        | External auditor (D-5)       | Owner    |
| Perf                    | Dev                   | Platform lead      | —                            | Owner    |
| Security                | Security lead         | Owner              | Legal                        | —        |
| Load                    | Platform lead         | Owner              | —                            | —        |
| Manual QA release smoke | Rotating dev          | Owner              | —                            | —        |

For a single-dev project, these collapse onto one person; the **discipline** is what matters — checklists per release, not tribal memory.

### 16.8 Testing backlog

**🟥 Pre-launch blockers**

- **T-1** Unit coverage lift to ≥ 60% on `src/lib/` (ratchet). Priority targets: `monobank`, `review-stats`, `email-templates`, `ai-usage`, `clinicards-client`. ~1 week.
- **T-2** RLS matrix test — 8 roles × ~20 tables × 4 ops = 640 assertions. Use a test helper + policy-driven loop. ~3 days.
- **T-3** Contract test: Zod ↔ DB columns for every `app/api/**/route.ts` input/output. ~2 days.
- **T-4** Per-PR sandbox Supabase with migrations + seed minimal data (A′-7 companion). ~2 days.
- **T-5** E2E suite expansion to cover §16.4.1 + 16.4.2 + 16.4.3 — 15-20 specs. ~1 week.
- **T-6** Monobank webhook test with signed-payload fixtures, replay rejection, all statuses. ~2 days.
- **T-7** Drop `continue-on-error` on preview-validate (CI-3).
- **T-8** `fullyParallel: true` + shard Playwright (CI-5).

**🟧 Launch-readiness**

- **T-9** Lighthouse CI with per-page budgets. ~1 day.
- **T-10** Visual regression on 10 canonical pages × 3 viewports. ~2 days.
- **T-11** Load test with k6 on top-5 endpoints + AI routes. Identify bottlenecks. ~2 days.
- **T-12** Chaos drill: Supabase down / Resend down / CliniCards 500 / Redis down. Verify graceful degradation. ~1 day.
- **T-13** A11y externally audited (D-5).

**🟨 Post-launch hardening**

- **T-14** OWASP ZAP baseline on preprod, weekly.
- **T-15** Mutation testing on `src/lib` with Stryker. Quarterly quality metric.
- **T-16** Flakiness trend tracking (Playwright JUnit → dashboard).
- **T-17** Coverage ratchet raised to ≥ 80%.

### 16.9 Testing DoD (aligned to phase exits)

| Metric                               | A′                  | B                         | C (launch)                                     | D (post-launch)                    |
| ------------------------------------ | ------------------- | ------------------------- | ---------------------------------------------- | ---------------------------------- |
| Unit coverage (`src/lib`, `app/api`) | ≥ 50%               | ≥ 65%                     | ≥ 80%                                          | ≥ 85%, mutation score ≥ 60%        |
| Integration tests (API)              | 10 routes           | all 42 routes             | all 42 routes, every auth path                 | same                               |
| RLS matrix tests                     | —                   | first pass, PHI tables    | full 8×20×4 matrix                             | drift-detected via snapshot        |
| E2E specs                            | 6                   | 12                        | 18                                             | 20+, incl. payment + video consult |
| A11y                                 | weekly, 11 routes   | per-preview, top-10       | per-preview, every route; external audit clean | same + quarterly re-audit          |
| Perf                                 | Speed Insights read | Lighthouse CI PR advisory | Lighthouse CI PR blocking                      | Lighthouse CI + RUM SLO            |
| Visual regression                    | —                   | 5 pages                   | 10 pages × 3 viewports                         | same                               |
| Load                                 | —                   | manual single run         | scheduled monthly                              | scheduled monthly                  |
| Chaos drill                          | —                   | —                         | once                                           | quarterly                          |
| Secret scan                          | per-PR              | per-PR + weekly full      | same                                           | same                               |

---

## 17. Non-functional requirements (public + admin)

Functional scope is covered in §10-12; innovation in §13. This section pins **measurable non-functional requirements** per surface, with targets, measurement methods, and current state. It is the basis for SLOs and for test §16's load/perf/chaos gates.

### 17.1 NFR framework

We adopt the 8-category ISO/IEC 25010-ish slice, tuned for a clinical-SaaS context:

1. **Performance** — response time, throughput, resource efficiency
2. **Scalability** — load handling, data volume growth
3. **Reliability & availability** — uptime SLOs, MTBF/MTTR
4. **Security** — authN/authZ, data protection, audit, threat model
5. **Privacy & compliance** — GDPR, UA Personal Data law, HIPAA-like posture
6. **Accessibility & usability** — WCAG, input methods, localization
7. **Observability & operability** — metrics, logs, traces, runbooks, deploy controls
8. **Maintainability, portability, cost** — code quality, onboarding time, FinOps

### 17.2 Public surface NFRs

#### 17.2.1 Performance (patient-facing)

| Metric                           | Target (p75)              | Current                            | Measure via                |
| -------------------------------- | ------------------------- | ---------------------------------- | -------------------------- |
| LCP — Home                       | ≤ 2.0 s                   | unknown (Speed Insights installed) | Vercel Speed Insights RUM  |
| LCP — Services / Gallery         | ≤ 2.5 s                   | unknown                            | same                       |
| LCP — Booking                    | ≤ 2.0 s                   | unknown                            | same                       |
| INP (all public pages)           | ≤ 200 ms                  | unknown                            | same                       |
| CLS                              | ≤ 0.1                     | unknown                            | same                       |
| TTFB from Kyiv / Lviv            | ≤ 400 ms                  | Vercel fra1 region — measure       | Vercel logs                |
| Booking-step transition          | ≤ 300 ms                  | —                                  | Playwright timed assertion |
| API — `/api/appointments/slots`  | p95 ≤ 600 ms; p99 ≤ 1.5 s | unknown                            | Sentry trace + logs        |
| API — `/api/appointments` (POST) | p95 ≤ 800 ms              | unknown                            | same                       |
| Font load                        | no FOIT; FOUT acceptable  | Nunito/Rubik via `next/font`       | Lighthouse                 |

#### 17.2.2 Scalability

| Dimension                         | Target (launch year)                                       | Notes                             |
| --------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| Concurrent anonymous visitors     | 500 simultaneous                                           | Next.js ISR + CDN absorbs         |
| Concurrent authenticated patients | 100                                                        | Supabase connection-pool sanity   |
| Bookings per day                  | 200 peak, 80 sustained                                     | current volume ~20/day; 4× runway |
| AI requests per day               | 500 chat + 200 recommendation                              | tied to B1 budget cap             |
| Peak RPS booking endpoint         | 20 RPS                                                     | load test target                  |
| Data growth (1y)                  | 50k appointments, 100k messages, 5k treatments, 1k reviews | sizing for RLS perf               |

#### 17.2.3 Reliability & availability

| Metric                                | Target                                                                       | Measure                                             |
| ------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| Uptime SLO (public site)              | **99.9 %** (43 min/month budget)                                             | Synthetic probe from 3 regions                      |
| Uptime SLO (booking flow end-to-end)  | **99.5 %** (3.6 hr/month)                                                    | separate synthetic that exercises slot fetch + POST |
| MTTR (Sev1)                           | ≤ 30 min                                                                     | incident response runbook                           |
| Error budget policy                   | if breached in a month → freeze feature work, focus on reliability           | explicit                                            |
| Graceful degradation if Supabase down | static content still serves; booking shows "contact by phone" fallback       | Playwright chaos test                               |
| Graceful degradation if AI down       | symptom checker still works statically; chat shows "temporarily unavailable" | same                                                |

#### 17.2.4 Security (patient surface)

| Area | Target |
| ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| HTTPS-only | enforced; HSTS preload | ✅ today (proxy.ts) |
| CSP | enforced, nonce per request, no `unsafe-eval` in prod | ✅ today (proxy.ts) — verify prod flag |
| CSRF | token on all public POST | ✅ today |
| Bot protection | Turnstile on contact, booking, review, newsletter, feedback; Vercel BotID as edge pre-filter | partial (B6) |
| Rate limit | Upstash token bucket on all public POSTs, IP-scoped | partial (B6) |
| XSS prevention | DOMPurify on user-rendered HTML, TS strictness on React | ✅ today |
| PII at rest | Supabase at-rest encryption (AES-256) | verified |
| PII in transit | TLS 1.3 | Vercel default |
| Webhook signing | Monobank signature verified, replay rejected | after A′-1 |
| Session lifetime | auth token 1 h, refresh 30 days; revoke on delete | after A′-5 |
| 2FA / passkeys | optional v3.4, default v4 | design gap today |
| Penetration test | external test before launch | scheduled |

#### 17.2.5 Privacy & compliance

| Requirement                         | Target                                                                          | Status                 |
| ----------------------------------- | ------------------------------------------------------------------------------- | ---------------------- |
| GDPR lawful basis per data category | documented in `docs/SECURITY.md`                                                | not written yet        |
| Data-portability (Art. 20)          | `/api/cabinet/export` functional, scoped, tested                                | 🟡 N2 fix needed       |
| Right to erasure (Art. 17)          | `/api/cabinet/delete-account` + JWT revocation + audit                          | 🟡 N8 fix needed       |
| DPO / contact                       | published in privacy policy                                                     | verify                 |
| Cookie consent                      | Sentry + GA + Vercel Analytics respect "rejected"                               | C7 work                |
| UA Personal Data Protection Law     | registered as controller; data-processing register                              | owner action           |
| Data retention                      | documented per table (patients, chat, audit logs, AI usage)                     | **not yet documented** |
| Sub-processor list                  | Supabase, Vercel, Resend, Upstash, Sentry, Cloudflare, Monobank listed publicly | verify                 |

#### 17.2.6 Accessibility & usability (patient surface)

| Metric                        | Target                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| WCAG level                    | **2.1 AA** on every public + cabinet route                                               |
| Axe violations                | 0 on top-10 routes; 0 on authed cabinet                                                  |
| Keyboard-only task completion | Every patient-facing flow (sign-up, book, cabinet, chat) completable with keyboard only  |
| Screen reader                 | NVDA on Win, VoiceOver on Mac/iOS — booking + cabinet smoke-tested manually each release |
| Color contrast                | AA 4.5:1 on body text, 3:1 on large / UI; runtime-verified, not just token-based         |
| Reduced motion                | `prefers-reduced-motion` respected everywhere                                            |
| Reading level                 | Flesch-Kincaid ≤ 8 on patient pages (measure in CI)                                      |
| Localization                  | full parity uk / en / pl; plural + gender handled; RTL not needed                        |
| Time-zone handling            | user-TZ aware for appointment display                                                    |
| Mobile viewports              | 320 / 375 / 414 / 768 / 1024 / 1440 — visually regression-tested                         |
| Touch target size             | ≥ 44 × 44 px minimum                                                                     |

#### 17.2.7 Observability (patient surface)

| Metric                 | Target                                                      |
| ---------------------- | ----------------------------------------------------------- |
| Sentry error rate      | ≤ 0.5 % of sessions in a week                               |
| Sentry session replay  | 5 % sampling on patient sessions, masked text               |
| Web Vitals collection  | 100 % of sessions via Speed Insights                        |
| Structured logs        | JSON on every API response (status, duration, user-id hash) |
| Funnel events          | 15 tracked product events (C5)                              |
| Synthetic uptime probe | every 5 min from 3 regions                                  |

### 17.3 Admin surface NFRs

#### 17.3.1 Performance (admin)

| Metric                                | Target                                              | Notes                                                   |
| ------------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| First paint on any admin page         | ≤ 1.5 s on wired desktop, ≤ 3 s on mid-range tablet | admin is infrequent traffic; still needs to feel snappy |
| Admin list page data fetch            | p95 ≤ 400 ms (with index coverage)                  | B-N5 index pack required                                |
| Modal open / close                    | ≤ 150 ms                                            |                                                         |
| Search / filter typing responsiveness | debounced 200 ms; apply ≤ 300 ms                    |                                                         |
| Bulk action on 100 rows               | ≤ 3 s                                               |                                                         |
| Analytics page render                 | ≤ 2 s for 90-day window                             | consider caching the aggregates                         |
| Form submit feedback                  | optimistic UI < 100 ms perceived                    | D-19                                                    |

#### 17.3.2 Scalability (admin)

| Dimension              | Target                                              | Notes                               |
| ---------------------- | --------------------------------------------------- | ----------------------------------- |
| Concurrent admin users | 20 simultaneous per clinic                          | current clinic ~5-10                |
| Table row counts       | up to 10k rendered via pagination or virtualization | implement virtualization by v3.4    |
| Analytics time-window  | 1 year without warehouse                            | after that, push to BigQuery (I-36) |
| Export CSV row cap     | 50k per export                                      | stream, not buffer                  |

#### 17.3.3 Reliability (admin)

| Metric                        | Target                                                                      |
| ----------------------------- | --------------------------------------------------------------------------- |
| Uptime SLO                    | **99.5 %** (3.6 hr/month budget) — looser than public; admin is internal    |
| MTTR                          | ≤ 60 min                                                                    |
| Data-loss tolerance           | **zero** for patient/treatment/payment data; point-in-time recovery drilled |
| Session drop during deploy    | zero (skew protection)                                                      |
| Soft-delete where appropriate | services, doctors, materials — never hard-delete if referenced              |

#### 17.3.4 Security (admin)

| Area                   | Target                                                               |
| ---------------------- | -------------------------------------------------------------------- |
| RBAC matrix enforced   | server-side on every route (belt) + RLS (suspenders) + UI (cosmetic) |
| Audit log coverage     | 100 % of mutations on PHI/PII tables; immutable                      |
| Destructive action     | double-confirm + audit reason + visible in audit timeline            |
| Role hierarchy         | UI prevents non-superadmin editing of superadmin; API re-enforces    |
| Webhook + cron routes  | bearer-token verified against CRON_SECRET                            |
| Admin list routes      | server-capped pageSize (≤ 200) — B-N1                                |
| File upload            | MIME allowlist + dimension check + size cap + AV scan — B-N2         |
| Session fingerprinting | detect new-device login → email alert                                |
| Idle timeout           | 30 min for admin sessions; 2 hr for patients                         |
| 2FA                    | optional v3.4, mandatory for superadmin by v4                        |

#### 17.3.5 Privacy & compliance (admin)

| Requirement                           | Target                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Least privilege by role               | audited quarterly                                                           |
| Medical-note edit audit               | every edit captured with actor + before/after — N18 fix                     |
| Data export (admin → patient request) | < 72 h SLA                                                                  |
| Data delete requests                  | < 30 d SLA per GDPR Art. 17                                                 |
| Photo / document retention            | documented per table; auto-purge where lawful                               |
| UA MOH / regulatory posture           | fitness-for-clinical-use statement published (once clinical AI lands in T2) |

#### 17.3.6 Accessibility & usability (admin)

| Metric                       | Target                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| WCAG level                   | **2.1 AA** on every admin page                                                                                 |
| Keyboard shortcuts           | ⌘K palette + `g a / g p / g t` nav; `/` to focus search; escape closes modal (D-11)                            |
| Bulk action conventions      | consistent across pages; multi-select with `shift-click` range; `select all` includes pagination-aware warning |
| Error recovery               | every destructive action is undoable or confirmable                                                            |
| Localization                 | admin UI in uk/en/pl — parity with public                                                                      |
| Density modes                | compact for front-desk / comfortable for doctor review (D-19)                                                  |
| Task-completion time targets | new appointment: ≤ 60 s; edit patient: ≤ 30 s; approve order: ≤ 20 s — measured via analytics                  |
| Mobile / tablet              | usable at 768 px; front-desk tablet optimized by v3.4 (F-29)                                                   |

#### 17.3.7 Observability (admin)

| Metric                          | Target                                                                    |
| ------------------------------- | ------------------------------------------------------------------------- |
| Every mutation audited          | immutable audit log + Sentry breadcrumb                                   |
| Cron runs                       | `cron_runs` row per invocation; Sentry cron monitor                       |
| Operational alerts on dashboard | low-stock, overdue treatments, unpaid, AI-budget utilization (F-26)       |
| Health endpoint                 | real dep checks (Supabase ping, Redis ping, Resend ping, CliniCards ping) |
| Slow-query detector             | Supabase dashboard + ad-hoc alert                                         |

### 17.4 Cross-cutting NFRs

#### 17.4.1 Maintainability

| Metric                                       | Target                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Median PR CI time                            | ≤ 3 min (§15.7)                                                           |
| Single-dev onboarding time (clone → running) | ≤ 30 min via scripts/link-env.mjs + README                                |
| Code duplication                             | low — admin list extraction (C-N1) is the hotspot                         |
| TypeScript strict                            | `strict: true`; no `any` escape hatches outside clearly marked boundaries |
| Lint / format                                | ESLint + Prettier enforced on PR                                          |
| Docs freshness                               | `docs/` index matches reality; quarterly review                           |

#### 17.4.2 Portability & deployability

| Metric             | Target                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| One-click deploy   | Vercel handles                                                                    |
| Environment parity | preview / preprod / prod on same Node version, same Supabase schema via branching |
| Config flags       | no hard-coded env assumptions; all via `process.env` + typed parser               |
| Rollback           | < 5 min (§15.4.4)                                                                 |

#### 17.4.3 Interoperability

| External system                   | Target                                                             |
| --------------------------------- | ------------------------------------------------------------------ |
| Supabase                          | primary backend; circuit breaker + retry on transient              |
| Resend                            | email; retry on 5xx; DLQ via `notification_events.status = failed` |
| Upstash Redis                     | rate limit + cache; graceful degradation if down                   |
| Monobank                          | payment + webhook signing; idempotency                             |
| CliniCards                        | slot source; fallback slots (documented, reviewed)                 |
| Sentry                            | observability; not on critical path (fail silently)                |
| Vercel Analytics + Speed Insights | metrics; not on critical path                                      |
| Cloudflare Turnstile              | bot check; fail-closed on config-missing in prod (fix N27)         |

#### 17.4.4 Cost (FinOps)

| Surface                      | Target (monthly, at launch)               |
| ---------------------------- | ----------------------------------------- |
| Vercel Pro + bandwidth       | ≤ $50                                     |
| Supabase Pro (with PITR)     | ≤ $30                                     |
| Resend (up to 50k emails/mo) | ≤ $20                                     |
| Upstash Redis                | ≤ $10                                     |
| Sentry Team                  | ≤ $30                                     |
| AI provider (under B1 cap)   | ≤ $30 (hard cap)                          |
| **Total run-rate launch**    | ≤ $150/mo (excl. payment processing fees) |
| Cost budget alert            | 120 % of budget → PagerDuty/email         |

### 17.5 Gap table — current vs target

| Category         | Biggest gap                                                           | Owner         |
| ---------------- | --------------------------------------------------------------------- | ------------- |
| Performance      | unknown p75 values; no Lighthouse gate                                | Dev           |
| Scalability      | no load test; index gaps (N26)                                        | Dev           |
| Reliability      | no synthetic probe; no defined SLO                                    | Platform      |
| Security         | N1/N2/N3/N15/N22 blockers; no DAST                                    | Security lead |
| Privacy          | retention policy undocumented                                         | Legal/Owner   |
| A11y             | admin not in audit; no SR manual                                      | Design lead   |
| Observability    | logger adoption 10/42; no `beforeSend` scrubber                       | Dev           |
| Maintainability  | 800-LOC admin pages; no shared hooks                                  | Dev           |
| Interoperability | Turnstile fail-open in dev (N27); CliniCards fallback leaked to users | Dev           |
| Cost             | no spend monitoring                                                   | Owner         |

### 17.6 NFR testing / verification cadence

| Test                      | Frequency                                              |
| ------------------------- | ------------------------------------------------------ |
| Synthetic uptime probe    | every 5 min                                            |
| Lighthouse CI             | per PR                                                 |
| RLS matrix                | per PR                                                 |
| a11y axe                  | per PR (top-10) + weekly full                          |
| Load (k6)                 | monthly + pre-release                                  |
| Chaos drill               | quarterly                                              |
| PITR restore drill        | quarterly                                              |
| External a11y audit       | annual                                                 |
| Pen test                  | annual + pre-launch + after major auth/payment changes |
| Cost-budget review        | monthly                                                |
| SLO / error-budget review | monthly                                                |
| NFR-targets review        | quarterly (targets can shift as scale grows)           |

### 17.7 NFR backlog (phase-mapped)

**🟥 A′ / B (pre-launch)**

- **NFR-1** Synthetic uptime probe from 3 regions (Vercel Cron + a simple prober or Checkly).
- **NFR-2** SLO doc + error-budget policy in `docs/SECURITY.md` / `docs/RUNBOOKS.md`.
- **NFR-3** Lighthouse CI gates on Home / Services / Booking / Cabinet.
- **NFR-4** Load test (k6) on top-5 routes + AI routes; document findings; fix bottlenecks.
- **NFR-5** Data retention policy per table documented; implement auto-purge where lawful.
- **NFR-6** Resend / CliniCards / Monobank real-ping in `/api/admin/health` (replace key-presence checks).
- **NFR-7** Cost alerting: Vercel + Supabase + Resend + AI usage → owner email when ≥ 120 % of budget.

**🟧 C**

- **NFR-8** External a11y audit (D-5).
- **NFR-9** Penetration test booked.
- **NFR-10** Chaos drill (Supabase down / Resend down / CliniCards 500 / Redis down).
- **NFR-11** PITR restore drilled.
- **NFR-12** Task-completion-time analytics events (admin flows).

**🟨 D**

- **NFR-13** DAST (OWASP ZAP) weekly.
- **NFR-14** Mutation testing in CI; quality metric tracked.
- **NFR-15** Warehouse tier (BigQuery / ClickHouse) if analytics buckle.
- **NFR-16** Multi-region fail-over story (only if SLO needs drive it).

---

**Bottom line on §16 + §17:** Testing today is "unit + E2E smoke" (maturity 2/5); target is 4/5 with contract tests, RLS matrix, Lighthouse, visual regression, and chaos. Non-functional requirements were implicit; §17 pins them with measurable targets, gaps named, and a cadence for verification. Both sections feed into the quality gates in §15 and the DoD in §6 — nothing in this doc should be declared "done" without evidence these targets are met.

---

## 18. Data architecture, KPIs & BI

### 18.1 Data flow (today)

```
Patient / anon visitor ─► Vercel CDN ─► Next.js App Router
                                           │
      ┌────────────────────────────────────┼─────────────────────────┐
      ▼                                    ▼                         ▼
 Supabase Postgres                   Upstash Redis            External APIs
  (source of truth,               (rate-limit tokens,      ─ CliniCards (slots)
   RLS-protected)                  some cached reads)      ─ Resend (email)
      │                                                    ─ Monobank (payments)
      ▼                                                    ─ Cloudflare Turnstile
 Supabase Storage          ┌─────────────────┐             ─ Vercel AI Gateway (v4+)
  (images, uploads)        │ notification_   │
      │                    │  events queue   │
      ▼                    └────────┬────────┘
 Supabase Realtime                   ▼
  (chat, live updates)         Vercel Cron (5 min)
                                     │
                                     ▼
                               Resend delivery
                                     │
                                     ▼
                               `cron_runs` log

Telemetry:
 ─ Sentry (errors, traces, breadcrumbs)
 ─ Vercel Analytics + Speed Insights (RUM)
 ─ structured logger JSON (from every API route, post-C-N4)
```

### 18.2 Data model summary

| Domain        | Primary tables                                                                             | Owner              |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------ |
| Identity      | `auth.users`, `admin_users`, `patients`                                                    | Supabase Auth + DB |
| Scheduling    | `appointments`, `doctors`, `services`, `working_hours`, `appointment_reminder_preferences` | DB                 |
| Clinical      | `treatment_records`, `treatment_record_items`, `treatment_materials_used`                  | DB                 |
| Inventory     | `materials`, `material_inventory`, `material_orders`, `material_order_items`               | DB                 |
| Communication | `chat_sessions`, `chat_messages`, `notification_events`                                    | DB + Realtime      |
| CRM-ish       | `contact_submissions`, `newsletter_subscribers`, `reviews`, `form_feedback_events`         | DB                 |
| Payments      | `payments`, `payment_configs`, `payment_webhook_events` (A′-1)                             | DB                 |
| Observability | `admin_audit_logs`, `cron_runs`, `ai_usage`                                                | DB                 |

### 18.3 KPI tree

```
BUSINESS KPIs
├─ Revenue
│   ├─ Appointment revenue (from treatment_records.total_cost)
│   ├─ Shop revenue (v4, from orders_shop)
│   └─ Average revenue per patient (ARPP)
├─ Growth
│   ├─ New patients / month
│   ├─ Returning patients / month
│   └─ Referral count
└─ Retention
    ├─ Recall compliance rate (6-mo, 12-mo)
    ├─ No-show rate
    └─ Patient lifetime value (LTV)

PRODUCT KPIs
├─ Public funnel
│   ├─ Visit → Booking started (%)
│   ├─ Booking started → Booking completed (%)
│   └─ Time-to-book (median)
├─ Cabinet engagement
│   ├─ Weekly active patients
│   ├─ Cabinet feature usage (view history, export, reschedule)
│   └─ Self-service rate (% cancels/reschedules done without phoning)
├─ Admin efficiency
│   ├─ Task-completion time (create appt, approve order, sign treatment)
│   ├─ Double-entry rate
│   └─ Bulk-action adoption
└─ AI features
    ├─ Chat completion rate
    ├─ Token spend / day
    └─ AI-suggested treatment acceptance rate (v4)

OPERATIONAL KPIs
├─ Uptime SLO (public 99.9%, admin 99.5%)
├─ Error rate (Sentry)
├─ p95 API latency per route
├─ Deploy frequency
├─ MTTR
├─ Cron success rate
├─ Email-delivery rate (Resend)
└─ Payment success rate (Monobank)

QUALITY KPIs
├─ Unit coverage (target ≥ 80%)
├─ A11y violations (target 0)
├─ Bundle size (first-load JS)
├─ Web Vitals p75 (LCP, INP, CLS)
└─ Security findings (npm audit, Gitleaks)
```

### 18.4 Reporting architecture

| Tier                 | Audience                 | Where it lives                                                                       |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| **Live operational** | Clinic staff             | `/admin/analytics`, `/admin/data-quality`, `/admin/health`, dashboard widgets (F-26) |
| **Release / ops**    | Owner + dev              | Vercel Speed Insights, Sentry dashboards, GitHub Insights                            |
| **Product**          | Owner                    | Vercel Analytics dashboards (post-C5 events)                                         |
| **Business**         | Owner                    | Monthly export + simple Google Sheet at launch; Metabase on a warehouse by v4.1+     |
| **External**         | Research partners (I-43) | Anonymized data feed, scoped                                                         |

### 18.5 Warehouse plan

- **v3.x**: Postgres suffices. Keep aggregates in `/api/admin/analytics` with `unstable_cache` where safe.
- **v4.0 — v4.1**: if analytics pages regress or custom reporting is needed (F-20…F-26), add **Metabase** on top of a **Supabase read-replica** — zero warehouse cost, ≤ 1 day setup.
- **v4.2+**: If aggregates cross 100k rows/day or multi-clinic lands, **push-to-warehouse** via Supabase → BigQuery / ClickHouse nightly. Reporting moves to the warehouse.
- **Schema-to-warehouse mapping**: star schema with `fact_appointment`, `fact_treatment`, `fact_payment`, `fact_order`, `dim_patient`, `dim_doctor`, `dim_service`, `dim_date`. Stable dim IDs via deterministic UUIDv5.

### 18.6 Data governance

| Policy         | Statement                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data ownership | Clinic owner is controller; DentalStory (the app) is processor.                                                                                                               |
| Classification | Public / Internal / Confidential / Restricted (PHI). Patient medical notes, chat messages about clinical matters, payment amounts = **Restricted**.                           |
| Retention      | Appointments 10 years (UA medical record law). Chat 5 years. Audit logs 7 years. AI usage 2 years. Analytics aggregates indefinitely. Explicit in `docs/SECURITY.md` (NFR-5). |
| Access         | RLS enforces; `admin_users.role` gates. Break-glass access requires written justification + audit entry.                                                                      |
| Export         | Patient self-serve via `/api/cabinet/export`. Clinic-admin via `/admin/patients/:id/export`.                                                                                  |
| Deletion       | Patient-initiated → soft-delete + PII scrub + audit; retained clinical record under legal minimum for 10 years.                                                               |
| Anonymization  | For research feed (I-43): drop PII, hash clinic_id, jitter dates, drop free-text.                                                                                             |
| Data lineage   | Every aggregate traceable to source tables via documented queries in `docs/ANALYTICS.md`.                                                                                     |

### 18.7 Data backlog

- **DATA-1** Publish data retention policy (NFR-5). Pair with C7 legal review.
- **DATA-2** KPI tree instrumented (§18.3) via C5 analytics events → Vercel Analytics funnels.
- **DATA-3** Supabase read-replica (v4.0) + Metabase for custom reports.
- **DATA-4** Data-quality checks extended to include PHI-specific integrity (all patients have valid birthdate, all treatments have diagnosis, etc.).
- **DATA-5** Warehouse migration decision (v4.2+).
- **DATA-6** Research-feed anonymization pipeline (I-43 prerequisite).

---

## 19. Integration & extension architecture

### 19.1 Current external integrations

| System                            | Purpose                     | Criticality                | Fallback                                                           |
| --------------------------------- | --------------------------- | -------------------------- | ------------------------------------------------------------------ |
| Supabase                          | Auth, DB, Realtime, Storage | Critical (primary backend) | None — hard dependency                                             |
| Vercel                            | Host, CDN, cron             | Critical                   | None — hard dependency                                             |
| Resend                            | Transactional email         | High                       | `notification_events.status = 'failed'` DLQ; manual phone fallback |
| Upstash Redis                     | Rate limit + cache          | Medium                     | In-memory fallback for rate limit if down; cache misses acceptable |
| Cloudflare Turnstile              | Bot protection              | Medium                     | Fail-closed in prod (fix N27); fail-open in dev                    |
| Sentry                            | Errors / monitoring         | Medium                     | Silent failure acceptable                                          |
| Vercel Analytics + Speed Insights | RUM                         | Low                        | —                                                                  |
| CliniCards                        | Slot availability           | Medium                     | Hardcoded fallback slots (user-visible — improve per ROADMAP §1.2) |
| Monobank                          | Payments + webhook          | High                       | Phase-out if payments deferred; otherwise hardening in A′-1        |
| GA4                               | Legacy analytics            | Low                        | Deprecate once Vercel Analytics funnels cover the same             |

### 19.2 Near-term integrations (v3.4)

| System                        | Use                                                     | Effort |
| ----------------------------- | ------------------------------------------------------- | ------ |
| **Telegram Bot API**          | Appointment reminders + chat channel                    | M      |
| **Viber Business API**        | Same                                                    | M      |
| **WhatsApp Cloud API**        | Same (UA usage rising)                                  | M      |
| **Google Calendar sync**      | Patients add to Google cal via OAuth, not .ics download | S      |
| **Outlook / Microsoft Graph** | Same for Outlook users                                  | S      |
| **Nova Poshta API**           | Shipping for Shop MVP (I-18)                            | M      |
| **Twilio / Vonage SMS**       | Patient SMS (F-9)                                       | S–M    |

### 19.3 v4+ platform integrations

| System                             | Use                                                 | Effort |
| ---------------------------------- | --------------------------------------------------- | ------ |
| **Vercel AI Gateway**              | Unified AI provider; observability; kill switch     | S      |
| **Vercel Queues**                  | Durable event queue replacing cron polling (D7)     | M      |
| **Daily.co / Zoom Video SDK**      | Video consult (I-1)                                 | L      |
| **Pearl / Overjet / Denti.AI**     | AI X-ray / intraoral analysis (I-5–I-7)             | L      |
| **UA eHealth**                     | E-prescription (I-40)                               | L      |
| **UA insurer APIs** (INGO, ARX, …) | Insurance claim auto-submit (I-26)                  | XL     |
| **Monobank Частинами / Privat24**  | BNPL on treatment plans (I-25)                      | M      |
| **Klaviyo / Customer.io**          | Lifecycle email if Resend + templates grow unwieldy | M      |
| **HubSpot / Pipedrive**            | CRM for sales-side (multi-clinic)                   | M      |
| **Slack / MS Teams / Common Room** | Internal notifications & ops                        | S      |

### 19.4 Webhook architecture

Inbound webhooks are a distinct surface with their own discipline:

- **Common entry pattern**: `app/api/webhooks/<provider>/route.ts` — verify signature → parse → idempotency-check via `<provider>_webhook_events` table → process → ACK 200 within 5 s.
- **Signature**: HMAC or provider-specific; never trust bodies.
- **Idempotency**: `(provider, event_id_or_hash)` unique. Hash raw body when provider doesn't supply an event id.
- **Replay window**: 30 days retention on webhook event rows; older replays ignored.
- **Observability**: every webhook emits `logger.info` + Sentry breadcrumb + `cron_runs`-like row.
- **Backpressure**: if Supabase is down, respond 5xx so provider retries with backoff; never silently drop.
- **Outbound webhooks** (for future Shop → fulfillment, for Platform tenants): sign with HMAC; retry with exponential backoff; maintain DLQ.

### 19.5 Public API strategy (v4+)

Not in scope for v3 / v3.4. Decision points for v4:

- **Purpose**: partner integrations (dental labs, referral networks, insurers), or public API for tenants?
- **Auth**: API keys (service accounts) + OAuth 2.0 for user-scoped.
- **Discipline**: versioned (`/api/v1/…`), OpenAPI spec published, rate limited, audit-logged, revocable.
- **Surface**: start read-only + write for bookings; avoid exposing PHI without explicit consent flow.

### 19.6 Clinic onboarding / bulk data migration

Needed if multi-clinic (T8) lands, or if existing clinics want to migrate from other software:

- **ONBOARD-1** CSV importer for patients (schema: first_name, last_name, phone, email, DOB).
- **ONBOARD-2** CSV importer for appointments (historical — for reporting continuity).
- **ONBOARD-3** CSV importer for treatment records (optional — incumbent software may not export).
- **ONBOARD-4** Migration wizard in `/admin/settings/onboarding`.
- **ONBOARD-5** Duplicate detection (by phone + DOB) with manual resolution.
- **ONBOARD-6** Opt-in email + SMS to migrated patients announcing the new system.

Effort: ~1 week for a decent importer, 2-3 weeks for a robust onboarding flow.

---

## 20. Security threat model, compliance & regulatory

### 20.1 STRIDE threat model

| Category                   | Example threat                          | Current mitigation                                                                                                                    | Residual risk                                                                        |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Spoofing**               | Attacker forges JWT claiming `is_admin` | Supabase JWT signed; admin role stored in DB (not JWT claim) via `is_admin()` post-migration `20260322_remove_legacy_admin_claim.sql` | Low — verify `is_admin_actor` collapsed to `is_admin` (N18)                          |
|                            | Doctor forges `doctor_id`               | RLS via `current_doctor_id()` with SECURITY DEFINER                                                                                   | Low — covered by A1 v2 migration                                                     |
|                            | Attacker impersonates webhook           | Monobank signature + replay reject (A′-1)                                                                                             | Low after A′-1                                                                       |
| **Tampering**              | Attacker edits a treatment record       | RLS + audit trigger                                                                                                                   | Medium — N4 (treatment_materials_used no trigger)                                    |
|                            | Attacker edits payment status           | Service-role only; `payments` UPDATE RLS tightened (A′-1)                                                                             | Low after A′-1                                                                       |
|                            | MITM on transit                         | TLS 1.3 enforced                                                                                                                      | Very low                                                                             |
| **Repudiation**            | Doctor denies signing a treatment       | Audit log capture with timestamp                                                                                                      | Low — but adversary with DB access can edit audit; consider append-only partitioning |
| **Information disclosure** | Cross-doctor PII leak                   | RLS (post-v2 fix) + app-layer filter                                                                                                  | Low if A1 verified in prod                                                           |
|                            | Export endpoint leaks all patients      | Code filter + RLS (A′-2)                                                                                                              | Low after A′-2                                                                       |
|                            | Payment enumeration                     | Auth gate on status endpoint (A′-1)                                                                                                   | Low after A′-1                                                                       |
|                            | Secrets in logs                         | Sentry `sendDefaultPii: false`; beforeSend scrubber (B-N6)                                                                            | Medium — B-N6 not shipped                                                            |
|                            | Source-map exposed                      | Sentry upload authenticated; source maps not on public CDN                                                                            | Low                                                                                  |
| **Denial of service**      | Spam on contact form                    | Turnstile + Upstash rate limit                                                                                                        | Low                                                                                  |
|                            | AI abuse                                | Per-IP + daily token budget (B1 partial)                                                                                              | Medium — isolation gap                                                               |
|                            | Resend rate limit hit                   | Queue-based via `notification_events`                                                                                                 | Low                                                                                  |
|                            | Expensive DB query                      | Admin list cap (B-N1) + index pack (B-N5)                                                                                             | Medium until shipped                                                                 |
| **Elevation of privilege** | Receptionist becomes superadmin         | Role hierarchy enforced server-side; UI filtered (A1 scope)                                                                           | Medium — N16 admin_users uniqueness, N18 is_admin consistency                        |

### 20.2 Data classification & protection matrix

| Class            | Examples                                                         | Encryption at rest     | Encryption in transit | Retention     | Access         |
| ---------------- | ---------------------------------------------------------------- | ---------------------- | --------------------- | ------------- | -------------- |
| Public           | Marketing copy, services list                                    | N/A                    | TLS                   | forever       | anyone         |
| Internal         | Cron run logs, usage metrics                                     | Supabase AES-256       | TLS                   | 2 y           | admin+         |
| Confidential     | Admin settings, business metrics                                 | Supabase AES-256       | TLS                   | 7 y           | admin+         |
| Restricted (PHI) | Treatment records, chat messages, payment amounts, medical notes | Supabase AES-256 + RLS | TLS                   | 10 y (UA law) | scoped by role |

### 20.3 GDPR compliance matrix

| Article / Principle         | Requirement                                                     | Status                                                                      |
| --------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Art. 5 lawfulness           | Lawful basis documented per data category                       | ❌ — NFR-5 / C7                                                             |
| Art. 13 transparency        | Privacy notice up to date                                       | 🟡 — needs lawyer (C7)                                                      |
| Art. 15 access              | Patient sees own data                                           | ✅ cabinet                                                                  |
| Art. 16 rectify             | Patient can correct own profile                                 | ✅ cabinet                                                                  |
| Art. 17 erasure             | Delete-account + scrub + audit + 10-year retention for clinical | 🟡 — A′-5 fixes token, clinical retention policy needs owner-sign-off       |
| Art. 18 restrict            | User can object to processing                                   | ❌ — not surfaced in cabinet                                                |
| Art. 20 portability         | Export in machine-readable format                               | 🟡 — A′-2 fix pending                                                       |
| Art. 21 object              | Object to direct marketing                                      | Part of cookie consent (C7)                                                 |
| Art. 32 security            | Encryption + pseudonymization + access controls + testing       | ✅ in-progress                                                              |
| Art. 33 breach notification | Owner notifies supervisory authority < 72 h                     | ❌ — need runbook (§21)                                                     |
| Art. 35 DPIA                | Assess high-risk processing (AI, video consult)                 | ❌ — required before I-5/I-1                                                |
| Art. 28 DPAs                | Sub-processor agreements                                        | 🟡 — verify Supabase, Vercel, Resend, Upstash, Sentry, Cloudflare, Monobank |

### 20.4 UA Personal Data Protection Law (ZU № 2297-VI)

| Requirement                                                    | Status                                               |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| Registration as data controller with the State Privacy Service | ❓ — owner action                                    |
| Purpose limitation declared                                    | Privacy policy needs refresh (C7)                    |
| Data-subject rights mirror GDPR (UA law aligns broadly)        | —                                                    |
| Cross-border transfers (Supabase EU, Vercel US edge)           | Controller must declare; DPA with each sub-processor |

### 20.5 Medical-device positioning (for AI features)

- **T2 items (I-5…I-11)** may be regulated under UA MOZ rules + EU MDR if marketed cross-border.
- Positioning: **decision support, not diagnostic** — requires doctor approval of every AI finding before entering the record. This removes MDR class-IIa risk in most cases.
- Required if diagnostic: CE marking path, clinical validation, UDI.
- **Recommendation**: ship T2 items behind a "doctor decision support" label, consult a regulatory specialist before any autonomous diagnostic output.

### 20.6 ISO 27001 / SOC 2 readiness

- **Not needed** for a single-clinic direct-to-patient webapp in year 1.
- **Becomes relevant** if (a) multi-tenant B2B tenancy (I-37), (b) enterprise clinical partners, (c) research-data licensing (I-43), (d) cross-border medical.
- Lightweight readiness now: keep `docs/SECURITY.md`, audit logs, access reviews, incident runbooks — many controls already align.

### 20.7 Security-review cadence

| Activity                    | Cadence                                                       |
| --------------------------- | ------------------------------------------------------------- |
| Threat-model review         | quarterly + on major new surface                              |
| Access review (admin_users) | quarterly                                                     |
| Secret rotation             | every 90 days (CRON_SECRET, service role, webhook keys)       |
| Penetration test            | annual + before launch + after payment/auth changes           |
| DAST (OWASP ZAP)            | weekly scheduled                                              |
| SBOM publication            | per release                                                   |
| DPIA                        | before each new high-risk feature (AI, video, data licensing) |

### 20.8 Security backlog

- **SEC-1** Publish `docs/SECURITY.md` consolidating CSP, RLS, CSRF, rate-limit, webhook, audit, retention.
- **SEC-2** STRIDE model versioned in-repo; review quarterly.
- **SEC-3** Sentry `beforeSend` scrubber (B-N6).
- **SEC-4** Secret rotation automation (§15.4.10).
- **SEC-5** SBOM + artifact provenance (CI-17).
- **SEC-6** Incident runbooks for each STRIDE category (§21.4).
- **SEC-7** DPIA template (`docs/templates/DPIA.md`) for future features.

---

## 21. DR, business continuity & operational runbooks

### 21.1 RPO / RTO targets

| Surface                                   | RPO (max data loss)                    | RTO (max restore time) |
| ----------------------------------------- | -------------------------------------- | ---------------------- |
| Public site                               | 5 min (last ISR regen acceptable)      | 10 min                 |
| Patient cabinet                           | 15 min                                 | 30 min                 |
| Admin panel                               | 15 min                                 | 30 min                 |
| Booking flow (critical)                   | 5 min                                  | 15 min                 |
| Payments                                  | **zero** (every transaction persisted) | 30 min                 |
| Clinical data (treatments, medical notes) | **zero**                               | 60 min                 |

### 21.2 Backup strategy

- **Supabase PITR**: paid tier required (ROADMAP open q #6). Configured for 7-day window.
- **Daily snapshot exports** via Supabase → Vercel Blob (private bucket), encrypted. 30-day retention.
- **Schema versioning**: every migration in git. Re-playable via CI (A′-7).
- **Storage bucket**: Supabase-managed replication; no separate backup needed at v3 scale.

### 21.3 Multi-region decision

- **v3.x**: single region (fra1) is sufficient for Lviv/Kyiv latency + cost.
- **v4.x**: evaluate when (a) non-EU patient volume > 20 %, (b) SLO breaches driven by regional outages, (c) multi-clinic tenants in distant geographies.
- If adopted: Supabase read replicas or a second Supabase project + async replication; Vercel edge handles the app layer automatically.

### 21.4 Runbook catalog

Ten scenarios, each with: **trigger · detection · first response · escalation · recovery · post-mortem**. All live in `docs/RUNBOOKS.md`.

1. **Cron `notifications` has not run in 24 h** — Sentry monitor fires → check `cron_runs` → check Vercel cron logs → re-trigger via `/api/cron/notifications` manually with token → investigate stuck `processing` rows → recycle.
2. **Resend delivery failing > 5 %** — Resend dashboard → pause queue if systemic → investigate DNS/reputation → failover plan: SendGrid as break-glass (document API key rotation).
3. **Supabase outage** — Vercel Status + Supabase Status → fail public to static fallback "contact by phone"; disable booking writes (flag `booking_enabled=false`); communicate via Cloudflare workers-hosted status page.
4. **RLS breach detected** — Sentry / audit anomaly → revoke service role key → rotate → run RLS matrix test in hotfix PR → patch migration → PITR if data altered.
5. **Monobank webhook floods (possible replay attack)** — signature fail rate spike in Sentry → block IP range at Vercel firewall → verify signing key not leaked → rotate.
6. **DDoS on booking endpoint** — Vercel + Cloudflare edge filters → BotID aggressive → Upstash rate-limit tightened → post-mortem.
7. **Cloudflare Turnstile outage** — detection via form rate drop → fallback CAPTCHA (hCaptcha) toggle via feature flag → communicate to clinic.
8. **Payment provider outage** — Monobank down → queue pending payments → notify patients with explicit "pay in clinic" copy → resume when up.
9. **Sentry outage** — errors buffered locally for 5 min then dropped → lose observability but not user impact → wait it out.
10. **Data leak / exposure** — GDPR Art. 33 72 h clock starts — invoke incident captain → evidence preservation → scope → legal + SupAuth notification → patient notification.

### 21.5 Severity levels & response SLAs

| Severity | Definition                                        | Response SLA                   | Comm cadence | Incident captain |
| -------- | ------------------------------------------------- | ------------------------------ | ------------ | ---------------- |
| Sev 1    | Public site down / payment broken / data exposed  | 15 min ack, 30 min MTTR target | Every 30 min | Owner            |
| Sev 2    | Admin broken / booking degraded / high error rate | 30 min ack, 2 h MTTR           | Hourly       | Senior dev       |
| Sev 3    | Feature broken for some users, workaround exists  | 2 h ack, 1 day resolve         | Daily        | On-call dev      |
| Sev 4    | Cosmetic or low impact                            | 1 day ack, next sprint         | As needed    | PM               |

### 21.6 Communication templates

Live in `docs/templates/`:

- `INCIDENT_CUSTOMER_EMAIL.md` — for patient-facing outages
- `INCIDENT_STATUS_PAGE.md` — for status.dentalstory.ua (if adopted)
- `INCIDENT_INTERNAL_SLACK.md` — for ops-war-room
- `POSTMORTEM.md` — 5-whys, timeline, action items, blameless

### 21.7 Post-mortem discipline

- Every Sev 1 / Sev 2 gets a post-mortem within 7 days.
- Published in `docs/postmortems/YYYY-MM-DD-<slug>.md`.
- Action items land as tickets with owners.
- Review quarterly for patterns.

---

## 22. Team, capacity, hiring & full budget

### 22.1 Current capacity

- 1 developer (owner-operator).
- No dedicated designer, QA, ops, legal, marketer.
- Realistic throughput ≈ 3-4 merged PRs / week of substantive work.

### 22.2 Roles by phase

| Role                          | When needed        | Why                                                                             |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| **Dev (current)**             | always             | all code work                                                                   |
| **Designer (PT / freelance)** | Phase C            | D-6 Figma library, C2 primitives, D-16 illustrations                            |
| **External a11y auditor**     | Phase C            | D-5 WCAG certification                                                          |
| **Penetration tester**        | Phase C + annually | SEC-review                                                                      |
| **Legal counsel (retainer)**  | Phase C + ongoing  | C7 privacy review, DPAs, UA registration, medical-device positioning, Shop T&Cs |
| **Translator (PL, EN)**       | Phase C            | C4 email templates + content review                                             |
| **QA (PT / freelance)**       | Phase C            | manual smoke per release, exploratory testing                                   |
| **ML engineer**               | v4.1+              | T2 clinical AI (or vendor APIs instead)                                         |
| **Customer support / ops**    | at launch          | patient questions, booking issues                                               |
| **Marketing / content**       | post-launch        | §24 growth work                                                                 |
| **Data analyst**              | v4.2+              | warehouse + BI reports                                                          |

### 22.3 Hiring triggers

| Trigger                                              | Hire                        |
| ---------------------------------------------------- | --------------------------- |
| Dev PR throughput < 2 / week for 4 consecutive weeks | 2nd dev or PT contractor    |
| Design backlog (§14.3) > 6 weeks                     | PT designer                 |
| Support ticket volume > 5 / day                      | PT customer support         |
| AI-image-analysis in scope                           | ML engineer (or vendor API) |
| Multi-clinic tenant signed                           | 2nd dev + ops               |

### 22.4 Skill matrix

| Area                             | Current coverage | Gap                     |
| -------------------------------- | ---------------- | ----------------------- |
| Full-stack TS / React / Next.js  | strong           | —                       |
| Supabase / Postgres / RLS        | strong           | —                       |
| AI SDK / OpenAI / LLM ops        | medium           | vendor selection for T2 |
| Design / Figma / brand           | weak             | hire PT                 |
| A11y / SR                        | medium           | external audit          |
| DevOps / Vercel / GitHub Actions | strong           | —                       |
| Security / threat modeling       | medium           | PT consult quarterly    |
| Legal (UA + GDPR)                | weak             | retainer                |
| Medical-regulatory               | none             | spot-consult before AI  |
| Marketing / SEO                  | weak             | hire post-launch        |

### 22.5 Full monthly budget (illustrative, UAH-equivalent)

| Item                                              | Launch month     | Post-launch steady     | Notes                 |
| ------------------------------------------------- | ---------------- | ---------------------- | --------------------- |
| Vercel Pro                                        | $20              | $30                    | bandwidth scales      |
| Supabase Pro + PITR                               | $30              | $30                    |                       |
| Resend (50k emails)                               | $20              | $30                    | scales with volume    |
| Upstash Redis                                     | $10              | $10                    |                       |
| Sentry Team                                       | $29              | $29                    |                       |
| Cloudflare (Turnstile free, maybe paid CDN later) | $0               | $0                     |                       |
| AI provider (Gateway + tokens)                    | $30              | $50                    | hard cap              |
| Monobank processing fees                          | per-txn (~2-3%)  | per-txn                |                       |
| Domain + email                                    | $5               | $5                     |                       |
| Dev tools (GH Pro, Claude, Figma, etc.)           | $50              | $50                    |                       |
| **Infra total**                                   | **$194**         | **$234**               |                       |
| Designer PT (10 h / mo)                           | $600             | $300                   | ramp down post-C      |
| Legal retainer                                    | $400             | $150                   | initial load heavier  |
| External a11y audit (one-shot)                    | —                | €1500 once             |                       |
| Pen test (one-shot)                               | —                | $2000-$5000 once       |                       |
| Translator (PL + EN review)                       | $300             | —                      | one-shot              |
| QA contractor (4 h / week)                        | $400             | $400                   |                       |
| **People total (avg)**                            | **$1700**        | **$850**               |                       |
| Marketing (Google + Meta ads)                     | $0               | $500-$2000             | owner-driven          |
| Content / SEO retainer                            | $0               | $400                   | v3.4+                 |
| **TOTAL**                                         | **≈ $1900 / mo** | **≈ $2000-$3500 / mo** | excl. one-shots + ads |

---

## 23. Risk register

| #   | Risk                                                            | P (1-5) | I (1-5) | P×I | Mitigation                                                     | Owner |
| --- | --------------------------------------------------------------- | ------- | ------- | --- | -------------------------------------------------------------- | ----- |
| R1  | RLS policy regression exposes cross-doctor PII                  | 2       | 5       | 10  | A′-7 schema CI + RLS matrix tests + audit alerts               | Dev   |
| R2  | Monobank webhook replay ⇒ double-charge or state flip           | 2       | 5       | 10  | A′-1 idempotency table + signature verify                      | Dev   |
| R3  | Account deletion doesn't revoke tokens ⇒ compliance violation   | 3       | 4       | 12  | A′-5                                                           | Dev   |
| R4  | Cron notifications silently stall ⇒ missed reminders ⇒ no-shows | 3       | 3       | 9   | B4 Sentry monitor + B-N3 uniqueness                            | Dev   |
| R5  | Supabase PITR not configured ⇒ unrecoverable loss               | 2       | 5       | 10  | B5 paid tier + quarterly drill                                 | Owner |
| R6  | External a11y audit finds blocker issues close to launch        | 3       | 4       | 12  | Book audit at start of C, buffer time                          | Owner |
| R7  | AI spend unbounded ⇒ budget overrun                             | 3       | 3       | 9   | B1 daily budget + per-IP cap + Gateway                         | Dev   |
| R8  | Single-dev burnout                                              | 4       | 4       | 16  | Hire PT help; prioritize; protect focus time                   | Owner |
| R9  | CliniCards outage degrades booking silently                     | 3       | 3       | 9   | Surface fallback explicitly; add UAT gate                      | Dev   |
| R10 | Payments scope limbo delays launch                              | 3       | 4       | 12  | Owner decision this week (§8 item 4)                           | Owner |
| R11 | Multi-clinic demand arrives before schema is tenant-ready       | 2       | 4       | 8   | Decide open q #2 now; if yes, add `clinic_id` during Phase B   | Owner |
| R12 | Franchise / brand theft                                         | 2       | 3       | 6   | Trademark registration (legal)                                 | Owner |
| R13 | Data breach from third-party sub-processor                      | 2       | 5       | 10  | DPA + sub-processor monitoring + runbook 10                    | Owner |
| R14 | Monobank T&C change requires re-integration                     | 2       | 3       | 6   | Abstract payment interface; willing to adapt                   | Dev   |
| R15 | Regulatory crackdown on AI X-ray analysis (MDR / UA MOZ)        | 3       | 5       | 15  | Position as decision-support + DPIA before ship                | Owner |
| R16 | Competitor launches with deeper AI + undercuts pricing          | 3       | 3       | 9   | Differentiate via clinical workflow + owner brand trust        | Owner |
| R17 | Upstash Redis price hike                                        | 2       | 2       | 4   | Env-var-aliased; Vercel KV swap is 1 day                       | Dev   |
| R18 | Sentry quota exceeded unexpectedly                              | 2       | 2       | 4   | Sample rate tuned; alert on 80 % quota                         | Dev   |
| R19 | Resend rate-limit during campaign                               | 2       | 3       | 6   | Queue-based; throttle sends; SendGrid break-glass              | Dev   |
| R20 | Security researcher publishes 0-day on a dep                    | 3       | 4       | 12  | Renovate auto-merge + security-audit workflow + 72 h patch SLA | Dev   |
| R21 | Vercel outage beyond SLA                                        | 2       | 4       | 8   | Status page; accept; not rearchitecting hosting for this risk  | Owner |
| R22 | Lawyer review surfaces changes that require backend refactor    | 3       | 3       | 9   | Book review early in C; scope small first                      | Owner |
| R23 | Translator review flags major content issues                    | 3       | 2       | 6   | Book early                                                     | Owner |
| R24 | Shop MVP fails to produce revenue                               | 3       | 3       | 9   | Start with narrow SKU; validate before scaling                 | Owner |
| R25 | Video consult adoption low                                      | 3       | 2       | 6   | Price experiment; quality-of-service baseline                  | Owner |

Re-review monthly. Top 5 drive next-month priorities.

---

## 24. Growth, marketing, content & SEO architecture

Not in owner's current scope but needed to actually grow the clinic book-of-business once launched.

### 24.1 SEO strategy

- **Technical SEO**: already covered — sitemap, robots, structured data, canonical, OG, Speed Insights, mobile-friendly, PWA. Verify post-canonical-flip (N38).
- **Content clusters** — three pillar topics, ~10 supporting articles each:
  1. Dental procedures explained (implants, orthodontics, endodontics, cosmetic).
  2. Preventive dental health (brushing, flossing, diet, kids).
  3. Local — dentistry in Lviv (landmarks, insurance in UA, prices in UAH).
- **Local SEO**: Google Business Profile, local schema (`LocalBusiness` + `Dentist`), citations (Visicom, 2GIS, city guides), patient reviews funneled to Google.
- **Backlinks**: partnerships with dental-supply sites, UA medical publications, local news ("best clinics").
- **Keyword budget (year 1)**: 50 uk-priority, 20 en, 10 pl.

### 24.2 Content strategy

- **Format mix**: articles (40 %), video shorts (30 %), before/after galleries (20 %), Q&A / FAQ (10 %).
- **Cadence**: 2 blog posts / week + 1 video / week in year 1.
- **Ownership**: owner-doctor writes technical; contractor ghostwrites for SEO; video produced in-clinic monthly batch.
- **Distribution**: site → Instagram → TikTok → YouTube Shorts → newsletter.
- **Measurement**: organic visits, dwell time, conversion from content → booking.

### 24.3 Paid acquisition architecture

- **Google Ads**: branded + "dentist Lviv" + "implants price" + service-specific.
- **Meta Ads**: before/after images, location-targeted.
- **TikTok**: short educational videos (cost-effective in UA).
- **Conversion tracking**: via Vercel Analytics + GA4; server-side events (post-C5).
- **Budget**: start $200-500 / mo, scale with ROAS.

### 24.4 CRM + lifecycle email

- **CRM**: HubSpot free tier or Pipedrive; integrate with Supabase for booking events; owner operates.
- **Lifecycle sequences**:
  - Welcome (new patient): 3 emails over 1 week — clinic intro, how to prepare, clinic team.
  - Recall: 6-mo cleaning reminder; 12-mo check-up; tied to `treatment_records` dates (I-28).
  - Reactivation: "we haven't seen you in 18 months" → discount offer.
  - Post-treatment: care instructions, rate-us prompt (F-12), upsell post-care kit (I-19).
  - Newsletter: monthly, 1 tip + 1 offer.

### 24.5 Partnership marketing

- **Dental schools**: observer-mode offers (I-45) for PR + recruiting pipeline.
- **Insurers**: direct-bill partners (I-26); link to clinic on their sites.
- **Local businesses**: "employee wellness" bulk-appointment deals.
- **Corporate HR**: annual cleaning packages.
- **Influencers**: local Lviv lifestyle creators, micro-influencers (10k-50k followers) for before/after content.

### 24.6 Growth backlog (condensed)

- **G-1** Google Business Profile + local schema refresh.
- **G-2** Content calendar year 1 (pillar topics + cadence).
- **G-3** Newsletter lifecycle in Resend (pair with C4 email templates).
- **G-4** CRM pick + integration.
- **G-5** Paid campaign architecture (tagging, attribution, ROAS dashboard).
- **G-6** Partnership outreach kit (PDF + landing pages).
- **G-7** Referral program UI (patient-facing + admin tracking; I-22).
- **G-8** Recall engine (I-28) ← core retention system.

---

## 25. Mobile & cross-platform strategy

### 25.1 Current state

- **PWA**: configured via `@ducanh2912/next-pwa` + Workbox. Installable on mobile. Offline cache for static routes. Service worker lifecycle untested. Push notifications **not** configured.
- **No native app**.

### 25.2 Should we build native?

Decision framework:

| Use-case pressure                                                       | Threshold to go native                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Push notifications with rich interactions                               | Web Push is 90 %-there; native wins on iOS (which limits Web Push) |
| Offline-first clinical use (doctor records during procedure)            | Yes — native                                                       |
| App-store presence for marketing trust                                  | Low ROI for a single-clinic site                                   |
| Camera integration (intraoral photos submitted by patient)              | Web is fine via `<input type=file accept=image>`                   |
| Deep iOS/Android integrations (HealthKit / Google Fit for health score) | Yes — native                                                       |

**Recommendation**: **stay PWA through v4.0.** Revisit native when (a) health-data integrations matter, or (b) owner wants offline doctor-side clinical tools.

### 25.3 Push notification architecture

- **Web Push**: add a `web-push` integration + VAPID keys + Supabase `push_subscriptions` table. Chrome/Firefox/Edge/Safari-iOS-16.4+ supported.
- **Server-sent from `notification_events` → Web Push gateway**.
- **Effort**: 2-3 days.

### 25.4 Offline functionality

- **Current**: static route caching.
- **Add (v3.4)**: offline "start a booking" — queue submission locally; sync when back online. 1 week.
- **Add (v4)**: doctor offline-mode for treatment recording. L.

### 25.5 App-store path (deferred)

If ever: Capacitor to wrap the PWA in a native shell. ~2 weeks, not a rewrite. Lets us publish to Play Store + App Store with the same codebase.

### 25.6 Mobile backlog

- **M-1** Verify PWA install + offline behavior (pair with B9 perf pass).
- **M-2** Web Push integration + server-side push from `notification_events`.
- **M-3** Offline booking queue (v3.4).
- **M-4** Native evaluation revisit post-launch.

---

## 26. i18n / l10n & multi-market strategy

### 26.1 Current state

- **Locales**: uk (default), en, pl via i18next; ~3000 keys parity-tested.
- **Tests**: `i18n-parity.test.ts` + `i18n-completeness.test.ts` gate drift.
- **Email templates**: partial (C4 finishes uk/en/pl).
- **Some floating-UI strings** hardcoded uk (ROADMAP §18.1 — fix in B3 tail).
- **Cabinet Payments** has hardcoded Ukrainian labels (F-2).
- **Dates/numbers**: browser-locale formatting; verify Ukrainian calendar week starts on Monday.

### 26.2 Market-expansion candidates

| Market         | Driver                                            | Locale needed | Timing                   |
| -------------- | ------------------------------------------------- | ------------- | ------------------------ |
| UA Ukrainian   | Home                                              | uk            | now                      |
| UA English     | Expat / tourist / business visitors               | en            | now                      |
| Poland         | cross-border patients (Lviv is 70 km from border) | pl            | now                      |
| Czech / Slovak | similar to PL                                     | cs, sk        | v4.1 if demand           |
| Russian        | sensitive topic post-2022; not a priority         | ru            | **do not** prioritize    |
| German         | Austrian / German patients                        | de            | v4.2+ if market-building |

### 26.3 RTL readiness

- No Arabic / Hebrew locales planned.
- Keep CSS logical-property friendly (`ms-` / `me-` Tailwind) — cheap insurance if demand surprises.

### 26.4 Regional content + legal

- Price page and legal docs differ by market (UA law for UA patients, EU GDPR for EU patients). Per-locale legal pages.
- Service descriptions adapt tone (PL reads differently from en-UK).
- Insurance partner differs by market; hide insurance mentions in locales where no partnership exists.

### 26.5 Payment + currency

- v3: UAH-only via Monobank.
- v3.4 + Shop: consider multi-currency display (UAH primary, EUR/PLN auxiliary). Settle in UAH.
- v4 cross-border: USD/EUR pricing for international cosmetic patients (implants, veneers — strong cross-border demand).

### 26.6 i18n backlog

- **L-1** Drain floating-UI uk hardcodes.
- **L-2** Cabinet Payments full i18n (F-2).
- **L-3** Email template locale polish (C4).
- **L-4** Per-locale legal pages.
- **L-5** Per-market content variants for Home / Services.
- **L-6** Multi-currency display for v3.4 Shop.
- **L-7** Professional translator review (open q #7).
- **L-8** Add cs/sk if cross-border demand verified (v4.1).

---

## 27. Release, versioning & documentation architecture

### 27.1 Semver discipline

- Major (v4.x): schema-breaking API changes, multi-tenant migration.
- Minor (v3.x): features — Phase A′ → D items. Each phase exit = minor bump.
- Patch (v3.y.z): bugfixes, hardening, content.

### 27.2 Changelog & release

- Adopt **Changesets** (CI-7). Dev writes `.changeset/<random>.md` per PR; merge to main → version-packages PR → tag + GitHub release + CHANGELOG.md.
- No more manual `package.json` bumps.
- Every release lists: features, fixes, schema changes, breaking changes, migration steps if any.

### 27.3 ADR (Architecture Decision Records)

- New in `docs/adr/NNNN-title.md`. Template: context / decision / consequences / alternatives.
- Kick off with backdated ADRs for the big commitments (Next.js 16, Supabase, i18next, Tailwind 3, Monobank) — ~5 retroactive ADRs.
- Rule: every non-trivial technology choice → ADR.

### 27.4 Deprecation policy

- Announce in changelog 1 minor version before removal.
- Provide migration path.
- Never break patient-facing URLs; always 301 redirect.

### 27.5 Documentation architecture

```
docs/
├── README.md            ← doc index
├── ROADMAP.md           ← living
├── ARCHITECTURE_REVIEW_2026-04-20.md  ← this doc (point-in-time)
├── ARCHITECTURE.md      ← evergreen architecture
├── API.md               ← API surface
├── DATABASE.md          ← schema living doc
├── CACHING_STRATEGY.md
├── CLINICARDS_INTEGRATION.md
├── GIT-FLOW.md
├── COMPONENTS.md
├── TESTING.md
├── DEPLOYMENT.md        ← new (§15)
├── SECURITY.md          ← new (SEC-1)
├── RUNBOOKS.md          ← new (§21)
├── STATUS.md            ← living "where are we" — auto-updated at each release
├── DATA_SEEDING.md
├── POST_LAUNCH_BACKLOG.md
├── AB_TESTING_PLAYBOOK.md
├── BACKUP_DR.md
├── LAUNCH.md
├── PERFORMANCE.md
├── adr/
│   └── NNNN-*.md        ← ADRs
├── audits/              ← point-in-time reviews
├── templates/           ← post-mortems, incident comms, DPIA
└── postmortems/
```

### 27.6 Onboarding doc

- **`docs/ONBOARDING.md`**: "clone → running in 30 min". Includes: Node version, env setup via `scripts/link-env.mjs`, Supabase local docker, seed command, how to run tests, key files tour, conventions (commit message format, PR template).
- **PR template**: describe / tested-how / screenshots / checklist.
- **Contributing docs**: coding conventions (brief), commit msg convention, how to add a migration.

### 27.7 Release backlog

- **REL-1** Changesets adopted (CI-7).
- **REL-2** Retroactive ADRs for core stack decisions.
- **REL-3** `docs/STATUS.md` auto-updated at each release (small GH Action).
- **REL-4** Onboarding doc + PR template published.
- **REL-5** `docs/` index reshuffle per §27.5 layout.

---

## 28. Master consolidated timeline

All tracks on one sheet. Width ≈ weeks. ▓ = committed, ░ = contingent / human decision.

```
                  W1   W2   W3   W4   W5   W6   W7   W8   W9   W10  W11  W12  …
Hardening (A′)   ▓▓▓▓
Phase B          ░░░░ ░░░░ ░░░░ ░░░░
Phase C          .............................. ░░░░ ░░░░ ░░░░
Launch (v3.3)                                          ★
Phase D (post)                                                   ░░░░ ░░░░ ░░░░ ░░░░

Design (§14)          ▓▓   ▓▓▓▓ ▓▓▓▓ ▓▓▓▓                ░░░░ ░░░░
Brand strategy        ▓▓
Voice/tone            ▓▓
External a11y           [book]              [results]
Figma + tokens              ░░░░ ░░░░

CI/CD (§15)       ▓▓
Schema CI         ▓▓
Secrets scan      ▓▓
Changesets             ▓
Supabase branches      ▓▓
Feature flags          ▓▓
Rolling releases                                     ▓▓
Lighthouse CI                                     ▓▓

Testing (§16)
Coverage lift     ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓
RLS matrix        ▓▓▓▓
Contract tests         ▓▓▓▓
E2E expansion     ▓▓   ▓▓▓▓ ▓▓
Load + chaos                                ▓▓ ▓▓

NFR verification  ───────ongoing───────────
Synthetic probe   ▓▓
SLO doc           ▓▓
Load test               ▓▓
Chaos drill                                    ▓▓
Pen test                                           [once]

Operational F-* (§12.1 pre-launch)
F-1 restore reviews                       ▓
F-2 payments i18n + soon                  ▓
F-3 balance card (if payments in scope)   ░░
F-4 rate-after-treatment                  ▓

v3.4 functional (§12.2)               (after launch)           v3.4.1   .2   .3   .4
                                                               ░░░░    ░░░░ ░░░░ ░░░░

Innovation (§13)  (v4+, decision-gated)
I-28 recall engine            (v4.0)                                      ░░░░░░░░
I-18 Shop MVP                                                                    ░░░░░░░░
I-1  video consult                                                                       ░░░░
I-5/6 AI x-ray (buy)                                                                        ░░░░
I-13 patient sharing                                                              ░░░░

Data / BI (§18)
Retention policy doc        ▓▓
KPI tree instrumented               ▓▓▓▓
Read-replica + Metabase                                          ░░░░

Integrations (§19)
Google Cal OAuth                            ░░
Telegram / Viber reminders                        ░░░░
Nova Poshta (for Shop)                                                          ░░░░

Security (§20)
docs/SECURITY.md       ▓
STRIDE review          ▓                 ▓                 ▓                  ▓
Secret rotation              ▓                 ▓                 ▓            ▓
Pen test book          ▓                                                 [onсе]

DR & runbooks (§21)
PITR verified              ▓
Runbook catalog            ▓▓
Restore drill                                 ▓
Post-mortem template       ▓

Team (§22)
Hire PT designer           [decide]
Hire translator for PL                    [once]
Retain legal               [retain]

Growth (§24)          (post-launch)                                   (marketing begins)
GBP + local SEO                                                           ▓
Newsletter lifecycle                                                      ▓▓
Recall engine (pair I-28)                                                        ░░░░

Docs (§27)
Changesets                  ▓▓
ADRs retroactive            ▓▓
STATUS auto-update          ▓
Onboarding doc              ▓
```

### 28.1 Critical-path summary

The critical path to launch (v3.3.0) is:
**A′-1 payments → A′-7 schema CI → B-N5 index pack → B-N6 Sentry scrubber → C1 a11y → C2 primitives → D-5 external audit results → NFR-4 load test → T-11 pen test → launch.**

Everything else is parallel. Designer + legal + external-audit work should be **scheduled early** because their calendars are not elastic.

### 28.2 Owner dashboard

At any given week the owner should be able to answer:

1. Which phase are we in?
2. What's blocking the next phase exit?
3. What human decisions are pending?
4. Any SLO / error-budget breach?
5. Spend vs budget this month?
6. Risk register top-5?

A one-page `docs/STATUS.md` refreshed at each release keeps this honest.

---

## Closing — how to use this document

1. **Treat §1-9 as the plan of record.** It drives Phase A′ → C → launch.
2. **§10-12 is what users and admins do today + the functional backlog.** Slot pre-launch items into Phase C.
3. **§13 is the product future.** Owner decisions drive which v4 items land first.
4. **§14-17 are parallel tracks** — design, CI/CD, testing, NFRs — that run alongside the plan, not after.
5. **§18-27 are the supporting architecture** — data, integrations, security model, DR, team, risks, growth, mobile, i18n, releases.
6. **§28 is the single map.** Use it in weekly reviews; everything that is late on this chart is late on launch.

Review cadence:

- **Weekly**: §28 progress, §23 risk top-5, any new blockers.
- **Monthly**: §22 budget vs actual, §17 NFR verification run, §23 full risk reshuffle.
- **Quarterly**: §20 threat model, §7 open questions, §28 cadence check, re-version this doc (v1.1, v1.2, …).

---

**Document complete.** Everything the current ROADMAP v1.4 omitted or under-specified is captured here: the delta audit (§3), the hardening plan (§4), functional coverage public + admin (§10-11), operational and innovation backlogs (§12, §13), brand & design (§14), CI/CD architecture (§15), testing strategy (§16), non-functional requirements (§17), data / integrations / security / DR / team / risks / growth / mobile / i18n / releases (§18-27), and a consolidated timeline (§28). Merge the actionable items into a v1.5 of `docs/ROADMAP.md` when ready.
