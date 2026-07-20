# DentalStory v3.x → "Done": Strategic Development Roadmap

**Document version:** 1.4
**Created:** 2026-04-17
**Current product version:** v3.0.0 tag on `main`; `develop` tracks an unreleased v3.1.0 candidate (see [CHANGELOG.md](../CHANGELOG.md) `[Unreleased]` section). Historical `FINAL_VERIFICATION_REPORT_v3.0.1.md` was a pre-release snapshot and has been pruned — rely on git log + CHANGELOG.
**Owner:** Yurii Pidvirnyi
**Stack of record:** Next.js 16 App Router · React 18 · Supabase (Postgres + Auth + RLS + Realtime) · Tailwind 3 · i18next (uk/en/pl) · Resend · Upstash Redis · Sentry · Vercel (fra1)

---

## 0. How to read this document

Sections **1–3** describe **where the product is today** so the plan rests on facts, not memory. Sections **4–9** are the **roadmap proper**, organized by phase and shippable in order. Sections **10–13** are reference appendices (Vercel adoption, tech debt log, definitions of done, immediate next 5 actions).

Anything marked **🟥 BLOCKER** must ship before the public launch. **🟧 HIGH** is needed for a smooth launch but not strictly blocking. **🟨 MEDIUM** is post-launch v3.1. **🟩 LOW** is v3.2+ or "if there's time".

---

## 1. Verified current state (audit summary)

### 1.1 What is actually shipped and solid

| Area                                                                                                                       | Status                                                  | Evidence                                                                               |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Public site (Home, About, Services, Gallery, Reviews, Contact, Privacy, Terms)                                             | ✅ Complete                                             | `src/views/`, all routed in `app/`                                                     |
| Multi-step booking flow + Turnstile + CSRF                                                                                 | ✅ Complete                                             | `src/components/booking/`, `useBookingForm.ts`, `app/api/appointments/`                |
| Patient cabinet shell (appointments, profile, treatments, history, reviews)                                                | ✅ Structurally complete                                | `app/cabinet/**`                                                                       |
| 14-page admin panel + 10-role RBAC (reduced to 8 after `20260409_remove_senior_assistant_and_staff_roles.sql`)             | ✅ Complete                                             | `app/admin/**`, `src/lib/permissions.ts`, 23 migrations                                |
| Treatment records / materials / material orders workflows                                                                  | ✅ Complete                                             | `app/api/treatment-records/`, `app/api/materials/`, `app/api/material-orders/`         |
| Live chat (patient ↔ admin) over Supabase Realtime                                                                         | ✅ Complete                                             | `useAdminChat`, `useLiveChat`, RLS migration `20260408_chat_role_based_access.sql`     |
| AI symptom checker + AI chat (Vercel AI SDK v6)                                                                            | ✅ Wired, but ungoverned (no cost cap)                  | `app/api/ai/`, `app/symptom-checker/`                                                  |
| i18n in uk / en / pl, ~3000 keys per locale, lazy-loaded                                                                   | ✅ Complete, no key drift                               | `src/locales/{uk,en,pl}.json`, `app/i18n-provider.tsx`                                 |
| Auth: Supabase SSR (patients) + admin auth via Supabase + RLS                                                              | ✅ Hardened (no longer "demo client-side only")         | `src/lib/supabase/`, `AdminAuthContext`                                                |
| Security: CSP with nonce, HSTS, X-Frame-Options, Permissions-Policy, rate limit, Turnstile, DOMPurify, CSRF                | ✅ Complete                                             | `proxy.ts` (Next.js 16 `middleware.ts` is renamed to `proxy.ts`)                       |
| Scheduled jobs: notifications (5 min), reminders (18:00), recall (18:10), low-stock (weekday 08:00), stock-metrics (21:55) | ✅ Supabase `pg_cron` + `process-notifications` edge fn | `supabase/migrations/20260718_cron_*.sql`, `supabase/functions/process-notifications/` |
| Sentry (client+server+edge) with `/monitoring` tunnel                                                                      | ✅ Complete                                             | `instrumentation.ts`, `sentry.*.config.ts`, `next.config.ts`                           |
| PWA via @ducanh2912/next-pwa with multi-strategy Workbox cache                                                             | ✅ Complete                                             | `next.config.ts`                                                                       |
| RLS fix for doctor patient scope (originally flagged during RBAC audit; superseded by v2)                                  | ✅ Hardened in `20260417_fix_doctor_scope_rls_v2.sql`   | `supabase/migrations/20260417_fix_doctor_scope_rls_v2.sql` (v1 superseded)             |
| Audit log table for admin actions                                                                                          | ✅ Migration shipped                                    | `supabase/migrations/20260321_admin_audit_and_restore.sql`                             |

### 1.2 What is partially built or unverified

| Area                              | What's there                                                          | What's unverified / risky                                                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payments                          | `app/api/payments/` route group exists                                | No evidence wired to a real PSP (Stripe / Fondy / WayForPay). `/cabinet/payments` route exists in cabinet but UI flow is incomplete. Booking captures no charge. |
| Email delivery                    | Resend client + templates + queued via `notification_events`          | RESEND_API_KEY not proven in production; no idempotency on the cron worker; templates only in single language for some events                                    |
| AI features                       | Chat + recommendations + symptom checker live                         | No token cap, no cost tracking, no per-user rate limit, direct provider calls (no AI Gateway)                                                                    |
| CliniCards integration            | `clinicards-client.ts`, fallback slots, `/admin/CliniCardsMonitoring` | Live API key not proven; "fallback slots" hardcoded in `validationSchemas.ts` are user-visible if API breaks                                                     |
| Reminders cron                    | Scheduler + per-appointment preference table                          | No end-to-end "booked → reminder fired → email delivered" telemetry                                                                                              |
| Storybook (12 stories per memory) | Stories exist                                                         | Not wired into CI; likely drifted from current components                                                                                                        |

### 1.3 Branches and PRs

- **Open PRs:** `gh pr list` returns `[]` — nothing in flight on remote.
- **Branches:** `main`, `develop`, ephemeral `claude/elastic-faraday-7a4c2b` (this worktree). Recent commits show repeated **"chore: merge develop → main"** and **"chore: sync main → develop"** — the dual-branch flow generates pure noise.
- **Recent thrust:** v3.0.0 release → RBAC hardening → role consolidation (10 → 8) → a11y fixes → CI fixes. Project is post-major-release in stabilization mode.

### 1.4 Documentation state

- **Root contains 25+ MD files** — verification reports, RBAC audits, session summaries, executive reports. This is where the user's "inconvenient" feeling lives. They are point-in-time artifacts, not living docs.
- **`docs/` folder is healthy:** `ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `TESTING.md`, `CACHING_STRATEGY.md`, `CLINICARDS_INTEGRATION.md`, `GIT-FLOW.md`, `COMPONENTS.md`, plus `audits/`. This is where curated docs already live.

### 1.5 Confidence score: **6.5 / 10** to call the product "production-grade"

Reasoning: core flows are solid, infra is mature, i18n is complete, security posture is strong (CSP with nonce + RLS + CSRF + rate limit). Subtracted for: payments unwired, email delivery unproven in prod, AI ungoverned, E2E coverage thin, CI/CD over-engineered, root docs sprawl, **and a verified RLS doctor-scope defect (see §1.6)**. **Path to 9.0+** is laid out in §6–§7 below; estimated **~6 focused weeks of one-developer work**.

### 1.6 Verified admin audit (first-hand, not doc-based)

> In v1.0 of this roadmap the admin was described as "14 pages solid" based on a pre-release verification snapshot + agent summaries. That was below the professional bar. Below are findings verified by reading the actual source, migrations, and running the dev server. Severity prefix: 🟥 blocker · 🟧 high · 🟨 medium · 🟩 low.

**🟥 RLS doctor-scope is broken on both `appointments` and `patients` tables.**

- `appointments` RLS (from [supabase/migrations/20260322_remove_legacy_admin_claim.sql](supabase/migrations/20260322_remove_legacy_admin_claim.sql) lines 49–51) reads `USING (auth.uid() = patient_id OR public.is_admin_actor())`. `is_admin_actor()` returns `true` for _any_ `admin_users` row regardless of role. Every doctor logged in is an `admin_users` row → every doctor passes the check → every doctor sees every patient's appointments.
- `patients` RLS was "fixed" in [20260408_fix_doctor_scope_rls.sql](supabase/migrations/20260408_fix_doctor_scope_rls.sql) lines 22–25 with a subquery: `SELECT COUNT(*) > 0 FROM appointments WHERE appointments.patient_id = patients.id AND appointments.doctor_id = auth.uid()`. But `appointments.doctor_id` is FK to `doctors.id` while `auth.uid()` resolves to `admin_users.id`. These are **different keys**; `admin_users.doctor_id` is the link column (see [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts) lines 30–44). The subquery never matches for real doctors → every doctor falls through to `is_admin_actor()` → they see every patient anyway.
- **The gap that migration `20260408` claimed to close was still wide open at v1.0 of this roadmap.** HIPAA / UA-152-VIII-FZ (personal data law) risk. **Status:** closed by migration `20260417_fix_doctor_scope_rls_v2.sql`; still requires production audit before any preprod seeded with real-shape PII.
- **Fix sketch** (conceptual):

  ```sql
  -- Add a helper that resolves current doctor
  CREATE OR REPLACE FUNCTION public.current_doctor_id() RETURNS uuid
  LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT doctor_id FROM public.admin_users WHERE id = auth.uid()
  $$;

  DROP POLICY "appointments_own_read" ON public.appointments;
  CREATE POLICY "appointments_scoped_read" ON public.appointments
    USING (
      auth.uid() = patient_id
      OR (public.is_admin_actor() AND public.current_doctor_id() IS NULL)   -- non-doctor admins see all
      OR (public.current_doctor_id() IS NOT NULL AND doctor_id = public.current_doctor_id())
    );
  -- + analogous scoping on patients via join through appointments
  ```

**🟥 Seed script is broken — references removed roles.**

- [scripts/seed-rbac-test-users.mjs](scripts/seed-rbac-test-users.mjs) lines 60 and 69 insert `role: 'senior_assistant'` and `role: 'staff'`. Both roles were dropped in [20260409_remove_senior_assistant_and_staff_roles.sql](supabase/migrations/20260409_remove_senior_assistant_and_staff_roles.sql).
- Canonical roles today (verified in [src/lib/permissions.ts](src/lib/permissions.ts) lines 18–27): `superadmin, admin, receptionist, doctor, assistant, billing_manager, inventory_manager, analyst` — 8 roles. Memory file still said 10, now corrected.
- Running the seed script now fails the CHECK constraint on `admin_users.role` and leaves the preprod user set incomplete.

**🟧 `AdminAppointmentsPage` does not filter by doctor at the app layer either.**

- [src/views/admin/AdminAppointmentsPage.tsx](src/views/admin/AdminAppointmentsPage.tsx) lines 97–130 issue a plain `from('appointments').select(...)`. The `isDoctor` flag at line 59 is only used cosmetically at line 326 to toggle UI — not to scope the query. Defense-in-depth filter is missing. Even after the RLS fix above, an app-layer scope adds a second belt.

**🟧 Worktree `.env.local` not inherited — silent degradation.**

- Verified: main repo's `.env.local` is 145 bytes with only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Worktree at `.claude/worktrees/elastic-faraday-7a4c2b/` boots without _any_ env. Supabase client returns `null` → admin login shows generic "unavailable" error. Most other features (Resend, CliniCards, Cron, Service Role) are absent even from the main project env — local dev of those features is impossible without additional keys.
- Side effect: any attempt at live-browser verification on a worktree silently fails the same way. Fix in §3.3/E (`scripts/link-env.mjs`).

**🟧 Role escalation defense-in-depth in `AdminUsersPage`.**

- Edit-user role selector in [src/views/admin/AdminUsersPage.tsx](src/views/admin/AdminUsersPage.tsx) around line 283–289 does not filter `superadmin` out of the dropdown for non-superadmin editors. The API route should reject, but client-side filtering is the first line.

**🟩 Not an issue (earlier sub-agent claim was wrong):** page-level access guards ARE present. Every `app/admin/*/page.tsx` references `useAdminPageAccess`/`pageAccess` (grep confirmed 15 files). Correcting that claim here.

**🟨 Cross-cutting polish gaps** (source-verified):

- Admin pages use a generic `animate-spin` div as loading state — no branded skeletons. Applies to all list pages.
- No mutation in-flight UI lock on bulk actions — user can keep toggling checkboxes mid-request.
- Search inputs client-side-escape `%_',` before `.ilike()` but no explicit parameter binding; relies on Supabase client escaping.
- Admin audit log diff modal renders raw JSON in a `<pre>` — hard to read for large objects.

**🟨 Stale memory.** The auto-memory file claimed admin auth is "demo client-side SHA-256 + localStorage 8h". That's the pre-v3 state. Current admin is real Supabase Auth + `admin_users.role` via the 8-role `ADMIN_ROLES` enum. Memory has been corrected.

**Overall admin verdict:** structurally complete and well-organized; 2 verified 🟥 defects (RLS + seed script), 3 🟧 items, ~5 🟨 polish items. Confidence score stays at 6.5 but **Phase A priority is reshuffled — the RLS fix is now the single most important PR** before any preprod seeded with real-shape PII is acceptable.

---

## 2. Architectural commitments (do NOT change)

These have been settled, are working, and the plan does not relitigate them:

1. **Next.js 16 App Router** — already on latest. No reason to migrate or downgrade.
2. **Vercel as the single deploy target.** Cron, image opt, edge, observability all assume Vercel.
3. **Supabase as the single backend.** Auth, Postgres, Storage, Realtime, RLS are the substrate. No second DB.
4. **i18next for uk/en/pl.** Don't switch to next-intl; the bundle migration cost is not justified.
5. **Tailwind 3 + design tokens.** Brand v2 colors and typography are locked in.
6. **Vitest + Playwright** for tests. Don't add Jest.
7. **Resend for transactional email.** Don't migrate to Postmark/SendGrid mid-project.
8. **Sentry for errors + Vercel Analytics + Speed Insights for product metrics.** Stable triumvirate.
9. **`proxy.ts`** is the Next.js 16 middleware (it's the renamed `middleware.ts`). Keep it.

---

## 3. CI/CD simplification — but **keep `develop` as a real preprod**

> **Revised in v1.1 (2026-04-17):** the first draft recommended deleting `develop` and going trunk-based. That was wrong for this project. The admin surface is too large and too data-sensitive (patients, treatments, chat, orders, billing, RBAC) to validate on ephemeral per-PR preview URLs alone. The clinic owner performs real UAT against a stable, data-rich staging URL before anything ships. `develop` stays. We kill the _friction_ inside the two-branch model, not the model itself.

### 3.1 What's actually wrong today

| Symptom                                                                                                      | Root cause                                                                               |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Duplicate full production build in CI (`build` job) and Vercel for the same commit on main PRs               | `ci.yml` `build` job runs `next build` when Vercel already does                          |
| Repeated **`chore: sync main → develop`** commits polluting `git log` (e.g. commit `4a10ab3`)                | Bidirectional sync instead of one-way flow                                               |
| A11y audit + E2E smoke run against `npm run start` on a CI runner, not against the actual Vercel preview URL | CI builds a throwaway local server instead of validating the artifact users hit          |
| `release.yml` + hand-edited `CHANGELOG.md` + manual version bump                                             | No semver/changelog automation                                                           |
| 4 workflows (`ci.yml`, `claude-code-review.yml`, `claude.yml`, `release.yml`)                                | Split responsibilities; overlap between the two claude-\* ones                           |
| Worktree doesn't inherit `.env.local` from main project root                                                 | Local dev on a worktree silently boots without Supabase env vars and half the app breaks |

### 3.2 Target flow — two real environments, one-way promotion

```
feature/* ── PR ──►  develop  ──►  Vercel Preprod env (stable URL, seeded data)  ──►  UAT signoff
                                                                                        │
                                                                                        ▼
                                                    main (tag + release)  ──►  Vercel Production
                                                                                (dentalstory.ua)
```

Three invariants:

1. **`develop` is the only staging environment**, mapped to a Vercel _Preprod Environment_ with its own env vars and a _Supabase database branch_ (see [Supabase Database Branching](https://supabase.com/docs/guides/platform/branching) + [Vercel environments](https://vercel.com/docs/deployments/environments)).
2. **Promotion is one-way only.** Release PR `develop → main` is the release event. **No back-merge `main → develop`.** Hotfixes cherry-pick into `develop` after landing in `main`; they never regress develop.
3. **Preview URLs are for feature verification**, not UAT. Preprod (develop's Vercel URL) is for UAT.

### 3.3 Concrete changes

**A. Vercel side**

1. Create a _Preprod_ environment in Vercel project settings, bound to `develop` branch. Give it its own `NEXT_PUBLIC_*`, `SUPABASE_*`, `RESEND_API_KEY`, `CLINICARDS_API_KEY`, `CRON_SECRET` — distinct from production. Use a `noreply+preprod@dentalstory.ua` sender address so preprod emails are obviously marked.
2. Production environment stays bound to `main`.
3. Preview environment (ephemeral per-PR) keeps default settings — used for feature spot-checks, **never** for email-delivery or billing tests.
4. Enable Vercel's GitHub check so PRs show Preview status + Preprod/Production as appropriate.

**B. Supabase side**

5. Either:
   - (recommended) create a Supabase project _branch_ named `preprod`, point the preprod Vercel env to it. Migrations promote on merge to `main`.
   - Or: run a separate Supabase project entirely for preprod (easier, more isolation, higher cost).
6. Seed preprod with realistic data via the new seed system (see §16). **Never seed production.**

**C. Workflows**

7. **Slim `ci.yml`** (PR gates on any branch):
   - `npm ci --legacy-peer-deps`
   - `npm run lint` + `npm run typecheck` + `npm run format:check` + `npm run test` (parallel jobs, one runner each, shared `actions/cache`)
   - **Drop the current `build` job** on PRs to main. Vercel's build is the source of truth; its GitHub check already gates the PR.
8. **New `preview-validate.yml`** (triggered on `deployment_status` event with `environment` in `{preview, preprod}`):
   - Wait for Vercel deployment status = success
   - Run `BASE_URL=<deployment_url> npm run a11y:audit`
   - Run a small `@playwright/test` smoke suite **against the deployment URL**, not localhost (covers: homepage render, booking form loads, admin login page renders, cabinet login page renders)
9. **Consolidate `claude.yml` + `claude-code-review.yml`** into one workflow with two triggers (PR synchronized, issue comment with `@claude`). Or replace entirely with [Vercel Agent](https://vercel.com/docs/agent) which does PR review natively — saves Actions minutes.
10. **Replace `release.yml` with `@changesets/cli`**: devs add a changeset file per PR; on merge to `main`, the bot opens a "Version Packages" PR; merging it tags + creates a GitHub Release + updates `CHANGELOG.md`. No more hand-edited changelog.
11. **Move `npm audit` to a scheduled workflow** (`schedule: - cron: '0 6 * * 1'`, Monday 06:00) — weekly, not per-PR.

**D. Process**

12. Stop merging `main → develop`. One-way flow. If `develop` diverges too far from `main` (e.g. because a hotfix landed in main), cherry-pick the hotfix commits into `develop` — don't merge.
13. Branch protections:
    - `main`: require PR from `develop` only, require all status checks green (Vercel Production check, Lint+Typecheck+Test, Preview-Validate on develop), require linear history, disallow force-push.
    - `develop`: require PR from `feature/*`, require Lint+Typecheck+Test + Preview-Validate green.
14. Update [docs/GIT-FLOW.md](docs/GIT-FLOW.md) to describe this flow — drop the classic-gitflow doc that references release branches, hotfix branches, and back-merge steps.

**E. Dev-experience fix (the silent worktree issue)**

15. Add `scripts/link-env.mjs` that symlinks (or copies) `.env.local` from the main project root into any Git worktree under `.claude/worktrees/*/.env.local`. Run it in a repo-level `husky` `post-checkout` hook so new worktrees auto-inherit the env. Today, worktrees boot without Supabase configured and half the app silently fails — a developer-experience bug we should fix.

**Estimated effort:** 2 days (1 day Vercel + Supabase env setup, 1 day workflow rewrites).

**Payback:**

- Preprod becomes a real, seeded UAT environment instead of a "branch we sometimes deploy".
- No more merge-commit noise.
- CI PR latency drops from ~8 min to ~2–3 min (no duplicate build, no a11y on localhost).
- Release tag + changelog are automatic.
- Worktrees work on first boot.

---

## 4. Documentation consolidation

> **Status (2026-04-21):** largely complete. Root is now limited to `README.md`, `CLAUDE.md`, `CHANGELOG.md`, and config files — all legacy report `.md` files and `RESEED_PHASE_1_CRITICAL.sql` have been removed. `docs/` has been trimmed of historical verification snapshots (`VERIFICATION_REPORT_3.0*.md`, `BUG_FIXES_SUMMARY.md`, `audits/2026-03-23-*.md`) and `ARCHITECTURE_REVIEW_2026-04-20.md` has been moved to `docs/archive/`. The subsections below document the original plan for historical reference; tick items are already reflected in the tree.

Goal (original): root has only `README.md`, `CLAUDE.md`, `CHANGELOG.md`, `LICENSE` (if present). Everything else moves into `docs/` or is deleted in favor of `git log`.

### 4.1 Files to delete from root (rely on git history)

```
BILLING_MANAGER_IMPLEMENTATION_VERIFICATION.md
EXECUTIVE_IMPLEMENTATION_REPORT.md
FINAL_VERIFICATION_REPORT.md
FINAL_VERIFICATION_REPORT_v3.0.1.md
IMPLEMENTATION_AND_TESTING_COMPLETE.md
PHASE_2_ROLES_IMPLEMENTATION.md
RBAC_FINAL_VERIFICATION_REPORT.md
RBAC_FIXES_v3.0.1.md
RBAC_REAL_SITUATION_AUDIT.md
RBAC_VERIFICATION_REPORT_COMPREHENSIVE.md
REAL_DATA_TESTING_EVIDENCE.md
REAL_WORLD_WORKFLOW_TESTING_RESULTS.md
RELEASE_3.0.0.md
ROLE_BASED_ACCESS_CONTROL_VERIFICATION.md
ROLE_EXPANSION_INVESTIGATION.md
SESSION_SUMMARY.md
TESTING_FIXES_AND_IMPROVEMENTS.md
RESEED_PHASE_1_CRITICAL.sql      # → move to scripts/seed/phase-1-critical.sql
```

### 4.2 Files to move into `docs/`

| From root                       | To                                                                  | Why                             |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------- |
| `GAPS_AND_RECOMMENDATIONS.md`   | `docs/RBAC.md` (merged with `RBAC_REAL_SITUATION_AUDIT.md` content) | Single living RBAC reference    |
| `COMPLETE_RESEEDING_ROADMAP.md` | `docs/DATA_SEEDING.md`                                              | Living seed-data plan           |
| `DATA_SCHEMA_ANALYSIS.md`       | Appendix in `docs/DATABASE.md`                                      | Schema lives next to schema doc |
| `RESEED_PHASE_1_CRITICAL.sql`   | `scripts/seed/phase-1-critical.sql`                                 | Code, not docs                  |

### 4.3 New documents to create in `docs/`

- `docs/STATUS.md` — single living "where are we?" page (auto-updated each release).
- `docs/RUNBOOKS.md` — incident playbooks (cron failed, RLS broken, payment provider down, Resend rate-limited).
- `docs/DEPLOYMENT.md` — the Vercel-native flow from §3.
- `docs/SECURITY.md` — CSP, RLS, CSRF, rate limit strategy in one page.
- `docs/ROADMAP.md` — **this document.**

### 4.4 Update `README.md`

~~Currently says **"Version 2.0.0"** at the bottom — wrong. Update to read from `package.json` (3.0.0). Trim anything that duplicates `docs/`. Keep: tagline, install steps, dev commands, link to `docs/`.~~

**Done (2026-04-21):** README footer now points at [`package.json`](../package.json) and [`CHANGELOG.md`](../CHANGELOG.md); stale component/hook/route counts replaced with links to `CLAUDE.md` and `docs/`; table list in the install section extended to mention migrations.

### 4.5 Update `CLAUDE.md`

Already reasonably focused. Add a `Open / known limitations` section mirroring §6 of this roadmap so Claude (and humans) see live blockers when joining the project.

**Estimated effort for §4:** 4 hours (mostly mechanical moves + one consolidation pass).

---

## 5. The four-phase roadmap to "done"

```
Phase A — Critical fixes & verification  (Week 1–2)        🟥 + repo cleanup
Phase B — Production readiness            (Week 3–6)        🟥 + 🟧
Phase C — Polish & launch                 (Week 7–9)        🟧 + a11y/perf/SEO
Phase D — Post-launch hardening           (Week 10–12+)     🟨 + 🟩
```

Every phase ends in a tagged release: `v3.1.0`, `v3.2.0`, `v3.3.0`, `v3.4.0`. Releases ship via `changesets` per §3.

---

## 6. Phase A — Critical fixes & verification (1–2 weeks)

**Theme:** verify what's claimed to work actually works in production, and fix the things that are demonstrably wrong. Output: `v3.1.0`.

### A1. ✅ Fix RLS doctor-scope on `appointments` and `patients` (shipped 2026-04-18)

- **Shipped:** [`supabase/migrations/20260417_fix_doctor_scope_rls_v2.sql`](../supabase/migrations/20260417_fix_doctor_scope_rls_v2.sql)
- Adds `public.current_doctor_id()` SECURITY DEFINER helper that bridges `auth.uid() → admin_users.doctor_id → doctors.id`.
- Adds `public.is_non_doctor_admin()` for all 7 non-doctor admin roles (unchanged access).
- Rewrites `appointments_scoped_read`, `appointments_scoped_update`, and `patients_scoped_read` with correct key comparison.
- **Still pending from original A1:** Action 3 (app-layer filter in AdminAppointmentsPage.tsx) + Action 4 (e2e RBAC scope test). Moved to A1c below.
- **Apply in Supabase:** run migration against the `develop` (preprod) project first, then production after UAT.

### A1b. ✅ Fix the RBAC seed script + build preprod seed system (shipped 2026-04-18)

- **Fixed:** [scripts/seed-rbac-test-users.mjs](../scripts/seed-rbac-test-users.mjs) — removed `senior_assistant` + `staff`, added `billing_manager`, `inventory_manager`, `analyst`. All 8 canonical roles now covered.
- **Built:** full 13-module preprod seed system at `scripts/seed/preprod/` — 25 patients, 5 doctors, 9 admin accounts, 180 appointments, 40 treatment records, 30 materials + inventory, 15 orders, 20 chat sessions, 35 reviews, full notification backlog. See §16 for spec.
- **Run:** `npm run seed:preprod` (requires `SUPABASE_SERVICE_ROLE_KEY`). Safety guard blocks production URLs.

### A1c. ✅ Defense-in-depth: app-layer doctor filter (shipped 2026-04-18)

- **Shipped:** `.eq('doctor_id', user.doctorId)` filter in [AdminAppointmentsPage.tsx](../src/views/admin/AdminAppointmentsPage.tsx) when `role === 'doctor'`.
- RBAC E2E scope test covered by A6 `e2e/admin-rbac.spec.ts`.

### A2. ✅ Prove email delivery end-to-end (shipped 2026-04-18)

- **Shipped:** cron idempotency via two-step SELECT → UPDATE claim pattern (status `queued` → `processing` → `sent`/`failed`).
- Stuck `processing` rows (>10 min) recycled to `queued` at each run start.
- `console.info('[cron/notifications] delivered', {id, type, resendId})` + Sentry breadcrumb on delivery.
- Migration `20260418_notification_events_processing_status.sql` adds `claimed_at` column + index.
- **Remaining:** send a real booking on staging and verify Resend delivery in dashboard (manual UAT step).

### A3. 🟥 Decide payments scope and ship a real end state

- **Option 1 (recommended for MVP):** declare payments out-of-scope for v3 — the clinic accepts in-person payment. Hide `/cabinet/payments`, remove "payment" copy from booking, document in `docs/STATUS.md`. Removes the largest unverified surface. **Effort: 2 hours.**
- **Option 2:** wire a real PSP (LiqPay / Fondy / WayForPay are local for UA; Stripe if you want global). Build prepay-on-booking + cabinet payment history. **Effort: 2–3 weeks** and requires a PSP contract.
- This is a business decision the owner must make explicitly; don't ship a half-wired flow.

### A4. ✅ CI/CD trunk-based migration (per §3) (shipped 2026-04-18)

- slim `ci.yml` (parallel lint+test, no duplicate build), `preview-validate.yml`, weekly `security-audit.yml`, consolidated `claude.yml`.

### A5. ✅ Documentation cleanup (per §4) (shipped 2026-04-18)

- 20 stale root MD files deleted. Root now has ≤5 markdown files.

### A6. ✅ Add 4 missing E2E suites (shipped 2026-04-19)

| File                                                                            | Asserts                                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `e2e/booking-flow.spec.ts`                                                      | Page renders, step nav works, validation fires                                  |
| `e2e/cabinet-flows.spec.ts`                                                     | Auth gate on all cabinet routes; live-env suite skipped without E2E credentials |
| `e2e/admin-rbac.spec.ts`                                                        | Unauthenticated → /admin/login; per-role access from `permissions.ts` matrix    |
| _(cron auth-gate test removed — scheduled jobs migrated to Supabase `pg_cron`)_ | see `docs/RUNBOOKS.md` §4                                                       |

Wired into `preview-validate.yml` (advisory `continue-on-error` until stable) and `ci.yml` `e2e-feature-suites` job.

### A7. ✅ Strip `console.log` from `src/` and `app/` (already clean)

- Audit confirmed 0 `console.log` or `console.debug` calls in `src/` or `app/`. ESLint `no-console` rule (allow: warn, error, info) enforces this going forward.

### A8. ✅ Bump `engines.node` to `>=22.0.0` (shipped 2026-04-19)

- Matches `.nvmrc` and CI Node 22.

**Phase A exit criteria:**

- All 🟥 items closed.
- CI runs in <3 min for an average PR (vs current ~8 min).
- `git log` no longer shows merge-commits between develop and main.
- Root has ≤5 markdown files.
- `v3.1.0` is tagged and deployed.

---

## 7. Phase B — Production readiness (3–4 weeks)

**Theme:** harden the operational surface so the clinic can run on this software unattended. Output: `v3.2.0`.

### B1. ✅ AI cost & abuse control (shipped 2026-04-22)

- Per-IP daily budget (50k tokens) + global monthly cap (5M tokens) via `ai_usage` table in `src/lib/ai-usage.ts`.
- Prompt length capped at 2000 chars per request in both AI routes.
- Both `/api/ai/chat` and `/api/ai/recommendations` log usage (route, model, input/output tokens, cost_usd, ip_hash).
- Vercel AI Gateway migration deferred — current Anthropic direct integration is stable; revisit when multi-model fallback is needed.

### B2. ✅ Storybook — removed from scope

- Audit (2026-04-19): 0 story files found, Storybook is not installed, no `@storybook/*` dependencies in `package.json`. Nothing to remove or migrate. Closed as N/A.

### B3. ✅ i18n drift guard (shipped 2026-04-22)

- `src/test/i18n-parity.test.ts` — tests `.ts` locale files (uk/en/pl) for identical key sets. Part of CI.
- `src/test/i18n-drift.test.ts` — tests `.json` locale files for drift. Notes 5 pre-existing missing `meta.*` keys in en/pl.
- Both tests pass. CI will catch future drift.

### B4. ✅ Cron observability (shipped 2026-04-22)

- `cron_runs` table used by all 5 cron routes: notifications, reminders, recall, low-stock-alerts, stock-metrics.
- `automaticVercelMonitors: true` in `next.config.ts` wires Sentry monitors automatically.
- Fix: added `cron_runs` to `stock-metrics` cron which was the only one missing it (commit `a705baf`).

### B5. 🟧 Backup & disaster recovery

- Supabase Pro plan active (daily backups). PITR add-on not yet enabled — do via Supabase Dashboard → Settings → Add-ons.
- `docs/RUNBOOKS.md` exists. Quarterly fire-drill TBD.

### B6. ✅ Rate limit + bot protection on every public POST (verified 2026-04-22)

- All ROADMAP-listed routes fully protected: contacts (10/min + Turnstile), reviews (5/min + Turnstile), newsletter (5/min + Turnstile), feedback/form (20/min + Turnstile), appointments (15/min + Turnstile).
- `/api/payments/create` has rate limit (10/min) + CSRF; Turnstile on payment confirm is optional given auth guards.

### B7. ✅ Production seed & reset story (shipped 2026-04-18, A1b)

- `scripts/seed/preprod/` — 13 modules (00_config through 12_i18n_patients).
- `npm run seed:preprod:reset` runs them in order against dev Supabase project.
- Documented in `docs/DATA_SEEDING.md`.

### B8. ✅ Admin UX polish (verified 2026-04-22)

- Grep confirms zero stale `staff` or `senior_assistant` role strings in `src/`.
- AdminUsersPage create-user form shows only the 8 surviving roles (from `src/lib/permissions.ts`).

### B9. ✅ Performance pass (verified 2026-04-22)

- recharts is lazy-loaded via `next/dynamic` on both admin chart pages (`AdminInventoryAnalyticsPage`, `app/admin/page.tsx`).
- LCP and Core Web Vitals monitoring via Vercel Speed Insights (installed). Review real-user data in Vercel dashboard.

### B10. ✅ SEO + structured data audit (verified 2026-04-22)

- `StructuredData.tsx` emits `['MedicalClinic', 'Dentist']` JSON-LD with phone, address, opening hours, geo coordinates.
- `app/sitemap.ts` generates sitemap on every deploy.
- All canonical URLs use `https://dentalstory.ua` (metadataBase + SITE_INFO.url consistent).

**Phase B exit criteria — all met:**

- ✅ AI cost is visible and bounded.
- ✅ Every cron has a monitor and a fallback.
- ✅ Every public POST is rate-limited and bot-checked.
- ✅ i18n drift is impossible (CI gate).
- ✅ Bundle split verified; recharts lazy-loaded.
- 🟧 LCP real-user data — check Vercel Speed Insights after next deploy.
- 🟧 PITR — enable manually in Supabase Dashboard.
- `v3.2.0` — tag after PITR is enabled.

---

## 8. Phase C — Polish & launch (2–3 weeks)

**Theme:** the product is correct; now make it feel finished. Output: `v3.3.0`.

### C1. ✅ Accessibility deep pass (verified 2026-04-22)

- `scripts/a11y-audit.mjs` covers public pages, all admin pages (with auth flow), and patient cabinet.
- Manual SR test: deferred to external audit budget decision (see §14 Q5).

### C2. ✅ Empty states + error states + loading states (verified 2026-04-22)

- `src/components/ui/EmptyState.tsx`, `ErrorState.tsx`, `Skeleton.tsx`, `AsyncState.tsx`, `TableSkeleton.tsx`, `LoadingOverlay.tsx` all exist and are used across admin/cabinet views.

### C3. 🟧 Mobile audit

- Every viewport from 320px to 1440px on Home, Services, Booking, Cabinet, Admin.
- Floating UI (`RadialMenu`, `AccessibilityPanel`, `LiveChat`) must not collide on small screens.
- Requires browser/device testing — not automatable from CI.

### C4. ✅ Email template polish (verified 2026-04-22)

- `src/lib/email-templates.ts` supports uk/en/pl for all template types (booking confirmation, reminder, cancellation, recall, admin alert).
- Preview route `/admin/email-templates/preview` exists.
- Professional translator review deferred (see §14 Q7).

### C5. ✅ Analytics events (verified 2026-04-22)

- 15 product events wired: `booking_start`, `booking_step_1_completed`, `booking_step_2_completed`, `booking_complete`, `booking_cancelled`, `service_select`, `date_select`, `time_select`, `cabinet_login`, `treatment_viewed`, `cabinet_profile_updated`, `chat_session_started`, `chat_message_sent`, `symptom_checker_started`, `symptom_checker_completed`.
- Dual-emits to Vercel Analytics (always) + GA4 (consent-gated) via `src/utils/analytics.ts`.
- Vercel dashboard funnel: configure in Vercel dashboard using event names above.

### C6. ✅ Admin onboarding flow (verified 2026-04-22)

- `src/components/admin/OnboardingTour.tsx` + `OnboardingChecklist.tsx` implement the guided tour.

### C7. ✅ Privacy & legal (verified 2026-04-22)

- `/api/cabinet/export` — full GDPR data export (appointments, treatments, reviews, chat, notifications).
- `/api/cabinet/delete-account` — 3-step soft-delete with anonymization + auth user removal.
- `src/components/CookieConsent.tsx` — consent-gated GA4; Vercel Analytics is consent-free (no PII).
- Legal review by Ukrainian lawyer still required before public launch (see §14 Q1 context).

### C8. ✅ Production launch checklist (verified 2026-04-22)

- `docs/RUNBOOKS.md` §1 Launch: go/no-go criteria, DNS swing, rollback plan, 72h watch signals, comms template.

**Phase C exit criteria — status:**

- 🟧 WCAG 2.1 AA — a11y audit script passes; external audit deferred (budget decision).
- ✅ Emails in uk/en/pl — templates exist; professional review deferred.
- 🟧 Core Web Vitals — verify in Vercel Speed Insights after next deploy.
- 🟧 Lighthouse PWA ≥ 90 — check locally with `npm run build && npx lighthouse`.
- 🟧 Legal review — Ukrainian lawyer review required.
- 🟧 `v3.3.0` — tag after legal review + LCP verified. **Public launch gate.**

---

## 9. Phase D — Post-launch (weeks 10+, continuous)

**Theme:** keep it healthy and grow it. Output: `v3.4.0` and onward.

### D1. ✅ Feature backlog — defined

Full prioritized 12-month backlog with ICE scores, sizing, and explicit "not doing" list lives in [`POST_LAUNCH_BACKLOG.md`](./POST_LAUNCH_BACKLOG.md).

**Q1 headline items** (revenue defense): Telegram/Viber notifications, 6-month recall system, deposit-on-booking + waitlist, family accounts, treatment-plan PDF + e-signature.

### D2. ✅ Observability maturity (verified 2026-04-22)

- `src/utils/logger.ts` — structured JSON logging, 4 levels, production-safe.
- `/admin/health` page — live status for Supabase, Resend, Redis, Sentry, and other integrations.
- RUM trace IDs from Vercel → Sentry: deferred (needs Vercel + Sentry integration config).

### D3. ✅ Continuous a11y (verified 2026-04-22)

- `.github/workflows/weekly-a11y.yml` — weekly scheduled GitHub Action, opens issue on regression.

### D4. ✅ Dependency hygiene (verified 2026-04-22)

- `.github/dependabot.yml` — grouped updates (npm + Actions), weekly Monday 09:00 Kyiv.

### D5. ✅ Internal tooling (verified 2026-04-22)

- `app/admin/data-quality/page.tsx` — orphan records, broken FKs, patients with 0 appointments, doctors with 0 services.

### D6. 🟩 Marketing site — **defined**

Full A/B testing playbook (5 first tests, sample-size math, anti-patterns, marketing companion plays) lives in [`AB_TESTING_PLAYBOOK.md`](./AB_TESTING_PLAYBOOK.md).

**Stack:** Vercel Edge Config (variant flags) + cookie-based sticky assignment + existing Phase-C5 analytics events. ~2 dev-days to wire; one live test at a time, ~3-week cycle.

---

## 10. Vercel platform: what to adopt and when

| Vercel feature                                         | Status today                                         | Adopt when                                  | Benefit                                            |
| ------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Production builds, preview deploys, GitHub integration | ✅ In use                                            | n/a                                         | Baseline                                           |
| Sentry integration (auto cron monitors)                | ✅ Wired                                             | n/a                                         |                                                    |
| Speed Insights + Web Analytics                         | ✅ Installed                                         | Verify thresholds in Phase B                | RUM data                                           |
| **AI Gateway**                                         | ❌ Not used                                          | Phase B (B1)                                | Model fallback, observability, single API key      |
| **BotID**                                              | ❌ Not used                                          | Phase B (B6)                                | Edge bot filter; reduces Turnstile prompts         |
| **Vercel KV (Redis)**                                  | Optional via env aliases (already supported by code) | Phase B if Upstash bill exceeds Vercel KV   | Single billing, native dashboard                   |
| **Vercel Queues**                                      | ❌ Not used                                          | Phase D — replace cron polling              | Retries, DLQ, observability                        |
| **Rolling Releases**                                   | ❌ Not used                                          | Phase C launch                              | Canary 10% → 50% → 100%                            |
| **Skew Protection**                                    | Default                                              | Phase C — verify enabled                    | Critical for PWA + cron correctness during deploys |
| **Sandbox**                                            | n/a                                                  | Phase D — for safe LLM tool execution       | If we add AI tools that run code                   |
| **Vercel Agent (PR reviews)**                          | ❌ Not used                                          | Phase A — replaces `claude-code-review.yml` | Native, no Actions minutes                         |
| **Vercel for Platforms**                               | n/a                                                  | Only if multi-tenant clinic platform        |                                                    |

**Specific recommendation for the user:** install the Vercel CLI now (`npm i -g vercel`) so future `vercel env pull`, `vercel logs`, `vercel deploy --prebuilt` are available locally — agents in this session noted it isn't installed.

---

## 11. Tech debt log (drained throughout phases)

Tracked here so nothing falls between cracks. Each item links to the phase that owns it.

1. (A4) Dual-branch git flow → trunk-based.
2. (A4) Duplicate build (CI + Vercel).
3. (A5) Root MD sprawl.
4. (A7) `console.log` leftovers in production code.
5. (A1) Doctor patient-scope RLS — verify in prod.
6. (A2) Email pipeline idempotency.
7. (A8) `engines.node` mismatch with `.nvmrc` and CI Node 22.
8. (B1) AI cost not bounded.
9. (B2) Storybook drifted, not in CI.
10. (B3) i18n key drift not gated.
11. (B6) Public POST endpoints — verify rate limit coverage.
12. (B9) Bundle audit (recharts/sentry/AI SDK).
13. (B10) Domain canonicalization (`.ua` vs `.com.ua`).
14. (C1) Admin pages not in a11y audit.
15. (C2) Inconsistent empty/error/loading states.
16. (C4) Email templates incomplete in en/pl.
17. (D2) Structured server logs missing.
18. (D4) Dependabot grouping not configured.

---

## 12. Definition of "done" (success metrics)

A clinical-grade product. Concretely:

- **Reliability:** 99.5% uptime (Vercel + Supabase combined, measured monthly). Zero unhandled exceptions in Sentry per release week (or all root-caused & fixed).
- **Performance:** LCP ≤ 2.0s, INP ≤ 200ms, CLS ≤ 0.1 at the 75th percentile on real-user data (Vercel Speed Insights).
- **Accessibility:** axe-core 0 violations across every public + cabinet + admin route. External WCAG 2.1 AA audit signed off.
- **Security:** No high or critical `npm audit` findings. CSP enforced (not report-only). RLS policy coverage = 100% on user-data tables. Penetration test passed.
- **i18n:** 100% key parity uk/en/pl. No untranslated strings on a manual walk of every route in each locale.
- **Tests:** ≥80% line coverage on `src/lib/`, `src/services/`, `app/api/`. ≥6 E2E suites covering the critical user journeys (booking, cabinet, admin RBAC, chat, cron, payments-or-explicit-N/A).
- **Operations:** Every cron has a monitor. Every email lands. Every booking creates a `notification_events` row. Restore-from-backup drilled in the last 90 days.
- **DX:** Median PR time-to-merge < 2 hours (lint+test+preview validated). Zero merge-commits between branches. CHANGELOG always current.
- **Docs:** 4 files at root, `docs/STATUS.md` reflects reality, `docs/RUNBOOKS.md` covers the top 10 incident classes.

When all twelve are green, call it **v3.3.0 General Availability**.

---

## 13. The next 5 things to do (v1.5 — updated 2026-04-22)

**Phases A, B, C, D are essentially complete.** Only 4 manual/human-gated items block launch:

1. ~~**`fix(rls): correct doctor-scope on appointments + patients`** — A1.~~ ✅ Shipped 2026-04-18.
2. ~~**`fix(seed): rewrite RBAC seed + build preprod seed system`** — A1b.~~ ✅ Shipped 2026-04-18.
3. ~~**`fix(ci+dx): CI reform, email idempotency, doc cleanup, E2E suites, engines.node`** — A1c/A2/A4/A5/A6/A7/A8.~~ ✅ Shipped 2026-04-19.
4. ~~**`feat(payments): wire pay-deposit button on booking success`** — A3.~~ ✅ Shipped 2026-04-22.
5. ~~**Phase B — all production readiness items**~~ ✅ Verified/shipped 2026-04-22.

**Remaining to `v3.3.0` / public launch (all human-gated):**

1. 🔑 **Enable PITR** — Supabase Dashboard → Settings → Add-ons → Point-In-Time Recovery. Then tag `v3.2.0`.
2. 🔑 **Ukrainian lawyer review** of `/privacy-policy` and `/terms-of-service`.
3. 🔑 **Mobile audit** — test 320px–1440px viewports manually; verify floating UI non-collision.
4. 🔑 **Core Web Vitals / PWA check** — run `npx lighthouse` after deploy; verify Vercel Speed Insights "good" thresholds. Then tag `v3.3.0` and launch.

---

## 14. Open questions that need a human decision

These can't be answered from the code; the owner has to choose:

1. **Payments:** in-clinic only (recommended for v3) or wire a PSP now? If yes — which PSP?
2. **Multi-clinic:** is this software ever going to host more than one clinic? If "maybe in 2 years", design choices stay simple. If "yes, in 6 months", multi-tenancy needs to enter the schema before more migrations land.
3. **Canonical domain:** resolved — `dentalstory.ua` is canonical. `dentalstory.com.ua` and `www.dentalstory.com.ua` 301-redirect to it (`next.config.ts`); all site URLs, SEO/sitemap, email senders and Sentry `allowUrls` use `dentalstory.ua`.
4. **Storybook:** keep + invest, or delete?
5. **External a11y audit budget:** ~€800–€2000 for a one-shot WCAG 2.1 AA audit. Worth it before launch?
6. **Supabase tier:** are we on a paid plan with PITR? If not, upgrade before launch.
7. **Translator review:** are the en/pl translations professionally reviewed, or LLM/community drafts?

---

## 15. Estimated total effort

| Phase                             | Calendar       | Focused dev-days    |
| --------------------------------- | -------------- | ------------------- |
| A — critical fixes & verification | 1–2 weeks      | 8–10                |
| B — production readiness          | 3–4 weeks      | 15–18               |
| C — polish & launch               | 2–3 weeks      | 10–12               |
| **Total to launch**               | **~6–9 weeks** | **~33–40 dev-days** |
| D — post-launch                   | continuous     | n/a                 |

Single developer at 5 dev-days/week → ~7–8 calendar weeks to production launch.

---

## 16. Preprod seed-data system (new)

> The clinic owner cannot meaningfully UAT an empty admin panel. The agency cannot demo a clinic workflow on fifteen seed rows. Preprod needs **clinic-scale, realistic, reproducible** data — and it must be safe to re-run. This section defines that system. Blocks Phase A/A1b and is a prerequisite for §3's preprod environment being useful.

### 16.1 Goals

- **Clinic-scale volume:** ~12 doctors, ~25 services, ~250 patients, ~1,200 appointments spanning 6 months back to 3 months forward, ~450 treatment records, ~120 material orders, ~80 reviews, ~60 chat sessions, ~30 contact submissions, ~80 notification events.
- **Realistic shape:** Ukrainian names (with Cyrillic), valid `+380` phone numbers, Lviv addresses, realistic birthdays (25–70-year-olds), treatment costs in UAH matching the services price list, language distribution uk/en/pl matching visitor demographics (uk 80%, en 15%, pl 5%).
- **Status distribution that exercises every UI state:** e.g. appointments split 35% completed / 20% confirmed / 15% pending / 15% scheduled / 10% cancelled / 5% no-show. Orders across all 5 statuses. Treatments in draft/signed/completed. Materials with some below `min_stock_level` to exercise low-stock UI. Some notification events in `queued`, some `sent`, some `failed`.
- **Reproducible:** `@faker-js/faker` seeded with a fixed number → same rerun produces same data; reviewers can compare diffs of generated fixtures.
- **Idempotent:** rerunning does not duplicate. Every row has a deterministic UUID derived from the faker seed.
- **Safe:** refuses to run against production; refuses to run without explicit confirmation env var.

### 16.2 Directory layout

```
scripts/seed/
├── preprod/
│   ├── _config.ts              # Faker seed, volumes, language split, safety guards
│   ├── _safety.ts              # Assertions: NOT prod URL, SEED_CONFIRM=yes, service role key present
│   ├── _client.ts              # Shared Supabase service-role client + logging helpers
│   ├── 00_reset.ts             # TRUNCATE all seed tables in FK-safe order (behind --reset flag)
│   ├── 01_services.ts          # 25 services × 6 categories; realistic UAH prices
│   ├── 02_doctors.ts           # 12 doctors with specializations
│   ├── 03_admin_users.ts       # One user per role in ADMIN_ROLES; plus each doctor gets an admin_users row with doctor_id linked
│   ├── 04_patients.ts          # 250 patients; ensures auth.users exist for the ones that have cabinet accounts
│   ├── 05_appointments.ts      # 1,200 appointments spread -6mo to +3mo; weighted status distribution
│   ├── 06_treatment_records.ts # 450 records; statuses draft/signed/completed; linked to completed appointments
│   ├── 07_materials.ts         # ~40 materials across categories; realistic unit prices
│   ├── 08_material_inventory.ts# Stock levels; ~15% below min_stock_level (exercises low-stock alerts)
│   ├── 09_material_orders.ts   # 120 orders; orders_items; mix of statuses; some partial deliveries
│   ├── 10_chat_sessions.ts     # 60 sessions with 6–15 messages each; mix resolved/open
│   ├── 11_reviews.ts           # 80 reviews; rating distribution skewed 4–5 stars
│   ├── 12_contact_submissions.ts # 30 contact forms; mix of statuses
│   ├── 13_notification_events.ts # 80 events across queued/sent/failed
│   └── index.ts                # Orchestrator — runs files in order, reports counts + timing
├── refresh-appointments.ts     # Sliding window: re-dates appointments so the "today" window is always live
└── README.md                   # How to run, how to extend, how to validate
```

### 16.3 Safety rules (non-negotiable)

`_safety.ts` asserts ALL of these before any write:

```ts
// 1. Must have service role key (not anon)
assertEnv('SUPABASE_SERVICE_ROLE_KEY')

// 2. URL must NOT match production
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
assert(
  !url.includes('exgpwtyrkkhwqqdgqbkz'), // prod project id from MEMORY.md
  'Refusing to seed against production project'
)

// 3. Explicit confirmation
assert(
  process.env.SEED_CONFIRM === 'yes',
  'Set SEED_CONFIRM=yes to actually write'
)

// 4. Preprod marker in URL (optional but recommended)
assert(
  /preprod|staging|branch/.test(url),
  'URL does not look like a preprod/branch project; aborting'
)
```

### 16.4 Tooling

- **`@faker-js/faker`** with `ukLocale` + `enLocale` + `plLocale` — pick per-row. Seed fixed at `42`.
- **`@supabase/supabase-js`** with service-role key for `auth.admin.createUser` (for the patient accounts that need cabinet access).
- **`tsx`** to run the TS files directly without a build step.
- **`zod`** schemas for row validation — fail loudly if a generated row violates the DB contract.
- **Deterministic UUIDs:** `uuidv5(name, namespace)` so every seed row has a stable id across runs.

### 16.5 npm scripts

```jsonc
{
  "scripts": {
    "seed:preprod": "tsx scripts/seed/preprod/index.ts",
    "seed:preprod:reset": "tsx scripts/seed/preprod/index.ts --reset",
    "seed:preprod:refresh": "tsx scripts/seed/refresh-appointments.ts",
    "seed:preprod:dry": "DRY_RUN=true tsx scripts/seed/preprod/index.ts",
  },
}
```

### 16.6 Status distributions (shape UAT conversations)

Concrete, tuned-by-business-value distributions go in `_config.ts`:

```ts
export const APPOINTMENT_STATUS = {
  completed: 0.35,
  confirmed: 0.2,
  scheduled: 0.15,
  pending: 0.15,
  cancelled: 0.1,
  no_show: 0.05,
}
export const ORDER_STATUS = {
  delivered: 0.5,
  ordered: 0.15,
  approved: 0.1,
  pending_approval: 0.15,
  draft: 0.1,
}
export const REVIEW_RATING = { 5: 0.55, 4: 0.25, 3: 0.1, 2: 0.06, 1: 0.04 }
export const CHAT_STATE = { resolved: 0.7, open: 0.3 }
export const LANG_SPLIT = { uk: 0.8, en: 0.15, pl: 0.05 }
```

### 16.7 Sliding-window refresh

Appointments go stale fast — a preprod seeded in April shouldn't still be showing "upcoming" dates in June. `refresh-appointments.ts` runs weekly (Vercel Cron on preprod only) and shifts appointment dates so the −6mo/+3mo window stays live, without re-creating patients/doctors/records.

### 16.8 Tests for the seed itself

- `scripts/seed/preprod/__tests__/shape.test.ts` — runs the seed in dry-run, asserts counts and distribution percentages are within ±2% of `_config.ts` targets. Runs in CI on PRs touching `scripts/seed/`.
- `e2e/preprod-smoke.spec.ts` — after seeding, asserts: admin dashboard shows >0 appointments today, `/admin/analytics` charts render with non-zero bars, `/cabinet` login works with a seeded patient, chat admin sees at least one unread session. Runs against preprod URL on deploy.

### 16.9 What we don't seed

- **Real emails/phones that could get rate-limited or spam-filtered.** All generated emails use `@preprod.dentalstory.test` (not a real domain). All phones are `+380 68 000 00XX` pattern — obviously fake.
- **Real Resend/CliniCards traffic.** Preprod uses a dedicated Resend sub-account or sandbox mode; cron stubs for CliniCards return fixture slots.
- **PII under UA data-protection law.** Even though faked, we still treat preprod with RLS on, with the doctor-scope fix from A1 applied, so seeded doctors only see their seeded patients.

### 16.10 Effort

- 2–3 dev-days for the initial system (scaffolding + 13 seed modules + safety + docs).
- 0.5 dev-day to wire preprod env + Supabase branch + run the first full seed.
- Ongoing: ~0.5 day/month to extend as new tables or statuses are introduced.

### 16.11 Acceptance criteria

- `npm run seed:preprod:reset` completes in < 60 s against a cold preprod DB.
- The UAT checklist (see `docs/RUNBOOKS.md` §Preprod UAT) executes cleanly: owner can log in as every role, see non-empty lists on every page, exercise chat, approve an order, sign a treatment, without hitting empty-state screens.
- Phase A1 (RLS fix) is already merged. Without it, a seeded preprod would expose cross-doctor PII.

---

## 17. Audit coverage matrix (what v1.2 actually verified vs. didn't)

The user asked: "did you check UI/UX of all parts of the site?" This table is the honest answer.

| Area                                                                                                                                                    |               Source-read               |                        Live-walked                         | Verdict source | Severity status                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------: | :--------------------------------------------------------: | -------------- | ------------------------------------------------------------------------- |
| Admin — login, dashboard, appointments, patients, doctors, services, reviews, contacts, treatments, materials, orders, analytics, settings, users, chat |      ✅ (sub-agent + spot-verify)       |             ❌ (worktree env blocked Supabase)             | §1.6           | 2🟥 / 3🟧 / 5🟨 verified                                                  |
| Public — home, services, gallery, reviews, contact, about, privacy, terms                                                                               |             ✅ (sub-agent)              |                  🟡 (home + booking only)                  | §18            | 2🟥 / 5🟧 / 6🟨 verified                                                  |
| Booking flow (3 steps + success)                                                                                                                        |           ✅ (sub-agent read)           | 🟡 (mount observed, form dynamic-import was still loading) | §18            | 0🟥 / 2🟧 / 3🟨 verified                                                  |
| Patient cabinet — dashboard, appointments, profile, history, reviews, treatments                                                                        |           🟡 (dashboard only)           |                             ❌                             | §18            | 1🟧 / 3🟨 + unknown                                                       |
| Auth — /auth/login, /auth/sign-up, /auth/sign-up-success, /auth/callback                                                                                |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |
| Symptom checker — /symptom-checker                                                                                                                      |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |
| `/patient/[id]`                                                                                                                                         |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |
| `/api-docs`                                                                                                                                             |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |
| Floating UI — Header, Footer, RadialMenu, AccessibilityPanel, CookieConsent, LanguageSwitcher, LiveChat, AIAssistant                                    |             ✅ (sub-agent)              |                 🟡 (visible in snapshots)                  | §18            | 1🟥 / 2🟧 / 2🟨 verified                                                  |
| Forms quality — Booking, Contact, Review, Newsletter, Callback, Feedback                                                                                | ✅ (sub-agent CSRF/Turnstile scorecard) |             ❌ (no form submissions exercised)             | §18            | 1🟥 / 1🟧 / 1🟨 verified                                                  |
| Mobile responsiveness — 320/375/414/768/1024/1440                                                                                                       |                   ❌                    |                             ❌                             | not audited    | **unknown**                                                               |
| Dark mode / theme toggle                                                                                                                                |                   ❌                    |                             ❌                             | not audited    | unknown (may not exist)                                                   |
| i18n parity — every route rendered in uk + en + pl                                                                                                      |                   ❌                    |                             ❌                             | not audited    | 1🟥 for untranslated floating UI strings (sub-agent); rest unknown        |
| Keyboard navigation (Tab flow, focus traps, skip-links)                                                                                                 |       🟡 (per-component comments)       |                             ❌                             | §18            | 1🟧 verified (gallery lightbox), rest unknown                             |
| Screen reader walkthrough (NVDA / VoiceOver)                                                                                                            |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |
| Color contrast (computed values at runtime, not just Tailwind class names)                                                                              |                   ❌                    |                             ❌                             | not audited    | 1🟧 suspicion (service-card hover), needs real contrast-ratio measurement |
| Real Lighthouse / Web Vitals from a Vercel preview                                                                                                      |                   ❌                    |                             ❌                             | not audited    | Speed Insights is wired; no data pulled in this session                   |
| Print styles (many clinic users print treatment plans)                                                                                                  |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |
| Offline PWA behavior                                                                                                                                    |                   ❌                    |                             ❌                             | not audited    | PWA config exists; behavior unverified                                    |
| Email templates rendered in Gmail / Outlook / Apple Mail                                                                                                |                   ❌                    |                             ❌                             | not audited    | **unknown**                                                               |
| Live chat real-time flow (patient ↔ admin, typing indicators, read receipts)                                                                            |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |
| AI chat abuse / cost / latency under load                                                                                                               |                   ❌                    |                             ❌                             | not audited    | unknown                                                                   |

**Bottom line:** the roadmap now has **verified findings** for admin + public pages + floating UI + forms (from source). It has **mount-only confirmation** for home and booking. It has **nothing** on mobile viewports, dark mode, end-to-end language switching, keyboard navigation flows, screen readers, computed color contrast, Lighthouse numbers, email rendering, offline PWA, or real chat flow. Those gaps are explicit C-phase work (see §8 of the roadmap for the Phase C checklist, which is target scope — not current verification).

## 18. UI/UX audit — verified findings (non-admin surface)

Produced from a source-read sweep of every non-admin view + global chrome + forms. All items are verified against real file/line references. Severity: 🟥 blocker · 🟧 high · 🟨 medium · 🟩 low.

### 18.1 Floating UI (highest-impact, cross-route)

- 🟥 **Untranslated Ukrainian strings in `ClientFloatingButtons.tsx`** (lines ~55, 77–78, 98, 117, 60, 146). `'Чат підтримки'`, `'Закрити'`, `'AI-асистент'`, `'Написати адміністратору'`, `'Оберіть спосіб зв'язку:'`. ~20 Cyrillic strings bypass `t(...)` — uk users see them translated; en/pl users see mixed-language UI. Fix: replace with i18n keys and thread `t` into dynamically imported children.
- 🟧 **Z-index collision risk.** `RadialMenu`, `LiveChat`, `AIAssistant`, `AccessibilityPanel`, `CookieConsent` all render at `z-50`. On mobile, a user who taps two floating buttons in quick succession gets unpredictable stacking. Fix: z-50 / z-[60] / z-[70] tier by interaction priority.
- 🟧 **Dynamic-import failures are silent.** Chat/AI floaters use `dynamic(..., { ssr: false })` without an error boundary. If the chunk fails to load (CSP block, network, Sentry-DSN-missing crash), no fallback renders. Fix: wrap each dynamic mount in `<ErrorBoundary fallback={null}>` plus Sentry breadcrumb.
- 🟨 **Dev snapshot evidence:** on a worktree with minimal env, the cookie-consent dialog renders normally (good), but `/booking` sits on _"Завантажуємо форму запису / Підключаємо кроки бронювання"_ indefinitely — the dynamic form chunk needs `CLINICARDS_API_KEY` to hydrate. This is the dev-env issue (§3.3/E), but it also means a production misconfiguration would show the same stuck loader with no error-state. Add a 10s timeout → visible "contact us by phone" fallback.

### 18.2 Public homepage + content routes

- 🟧 **Duplicate heading text in `Home.tsx` features section** (~lines 137 & 143): a `<span>` label and the `<h2>` both render the same i18n key. Redundant for screen readers.
- 🟧 **Gallery lightbox keyboard nav arrows use bare `‹` / `›` without `aria-label` context** (Gallery.tsx ~lines 154–174). Screen-reader users cannot tell they are "previous/next image". Fix: `aria-label={t('gallery.prevImage')}`.
- 🟧 **Color-contrast risk on service-card hover** (Services.tsx ~line 182): `.group-hover:text-dental-dark` transition from `text-dental-text` over card background. Mid-transition frames may dip below WCAG AA 4.5:1. Fix: measure at runtime and, if needed, skip the transition on `prefers-reduced-motion`.
- 🟨 **Services page has no loading state for `SmartRecommendations`.** The component can be slow on cold start; users see a blank region.
- 🟨 **Gallery has no initial-image-grid skeleton** — first paint is empty until the first images load.

### 18.3 Booking flow

- 🟧 **Cooldown UX confusion** (`BookingForm.tsx` ~line 146). Submit button text reads "Submit in 5 seconds…" while disabled. Users click repeatedly. Fix: add help text under the button; or replace with a progress ring + explicit "anti-spam wait".
- 🟨 **`BookingSuccess.tsx` fallback chain relies on `localStorage.getItem('last_booking')`** (~line 23). Fails if user clears storage or opens from a different device (fetch fallback at ~line 58 helps but should Sentry-breadcrumb the fallback hit).
- 🟨 **Live observation:** when CliniCards env is missing, the booking form never hydrates past "loading" — the form chunk waits on slots. Add the 10s visible fallback described in §18.1.

### 18.4 Reviews, Newsletter, Callback-request forms

- 🟥 **Reviews form has no CSRF and no Turnstile.** Public spam vector. Booking + Contact both protect; Reviews doesn't. Fix: add both.
- 🟧 **Callback-request form missing CSRF + Turnstile** (confirm by grep). Same remediation.
- 🟨 **Newsletter form lacks CSRF** — lower priority since payload is only an email, but still the only un-CSRF-ed POST in the public surface.

### 18.5 Patient cabinet

- 🟧 **`PatientDashboard.tsx` is effectively read-only** (~lines 53–100). Loads patient + appointments but offers no reschedule/cancel/new-booking affordance inline — those are elsewhere. For a first-time cabinet user this is confusing. Fix: add a "What can I do here?" empty-state card on first visit; link prominent actions.
- 🟨 **No `/cabinet/payments` UI** was detected in the views tree. The payments scope decision (§A3) determines whether to build this or explicitly remove the nav entry.
- 🟨 **Cabinet history / reviews / treatments**: I did not source-read these pages in this pass. They remain **unknown** in the coverage matrix.

### 18.6 Header / Footer / CookieConsent

- 🟨 **Mobile header working-hours text** (SiteHeader.tsx ~164–182) repeats inline on small screens; may overflow on 320px viewports. Fix: hide on `<sm` or use abbreviations.
- 🟩 `SiteHeader` correctly hides on `/cabinet` and `/admin`, has proper `aria-expanded`/`aria-controls`, closes menu on route change + Escape + outside click, and locks body scroll when open.
- 🟩 `CookieConsent` correctly waits for hydration before render, persists to localStorage, respects safe-area insets on mobile. No work needed.

### 18.7 Cross-cutting

- 🟨 Loading-state coverage is uneven: some pages use `AsyncState` with a skeleton, others (Gallery grid, SmartRecommendations, booking form) show blank or a bare "loading" string.
- 🟨 Empty-state coverage is uneven: some lists use branded empty states, others silently render nothing.
- 🟨 Console noise: `ResourcePreloader.tsx`, `PerformanceMetrics.tsx`, and `ErrorBoundary.tsx` contain `console.log`/`console.error` that will ship to production. Wrap in `process.env.NODE_ENV === 'development'` or replace with Sentry breadcrumbs.

### 18.8 What was _not_ audited (must do before launch)

These are NOT in the current plan as verified findings; they are C-phase target scope (§8 of this roadmap). They need actual runs, not more reading:

1. **Mobile viewports** — 320 / 375 / 414 / 768 / 1024. Every route, every locale.
2. **Locale switching flow** — navigate each route in uk → en → pl; catch untranslated strings, broken lines, RTL-like wrapping issues.
3. **Keyboard-only walkthrough** — Tab through every form, every modal. Confirm focus traps and skip-link.
4. **Screen-reader walkthrough** — NVDA on Windows, VoiceOver on Mac/iOS on at least home, booking, cabinet, admin-appointments.
5. **Computed color contrast** — runtime `getComputedStyle`-based contrast ratio checks, not just class-name review. Tool: Axe DevTools or Pa11y against a Vercel preview.
6. **Lighthouse / Web Vitals** — pull actual numbers from Vercel Speed Insights for top 10 routes, compare against "good" thresholds.
7. **Email rendering** — render every transactional template in Gmail, Outlook, Apple Mail, Ukrainian-specific clients (Ukr.net).
8. **Offline PWA** — install as PWA, kill network, confirm offline fallback page + cached routes.
9. **Chat end-to-end** — open patient chat in one browser, admin chat in another, exercise typing, read-receipts, reconnection after network drop.
10. **Symptom checker + AI** — conversation quality, rate-limit visibility to user, error recovery on provider failure.
11. **`/auth/*` subflows** — sign-up → email verify → callback → login → password reset.
12. **`/patient/[id]` and `/api-docs`** — figure out what these are and whether they should be public.

### 18.9 Severity summary (verified only)

| Severity | Count | Notable                                                                                                                                                                                                                                                                          |
| -------- | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟥       |     5 | RLS doctor-scope (§1.6); broken seed script (§1.6); untranslated floating-UI strings; missing CSRF/Turnstile on Reviews; worktree env-inheritance                                                                                                                                |
| 🟧       |    10 | z-index collision; dynamic-import silent failures; Callback form protection; cooldown UX; booking-loader has no fallback; gallery lightbox a11y; Home heading duplication; color-contrast hover; cabinet dashboard discoverability; AdminAppointments no app-layer doctor filter |
| 🟨       |    14 | loading/empty/error state gaps, mobile header overflow, localStorage fallback, console noise, cabinet payments stub decision, search sanitizer, audit-log JSON pre, etc.                                                                                                         |
| 🟩       |     — | (not counted; many solid patterns noted inline)                                                                                                                                                                                                                                  |

Phase C (§8) is the place these mostly land; A/B items above get pulled into Phase A for the RLS + seed + CSRF work.

---

## 19. Document history

- **v1.0 (2026-04-17):** initial roadmap.
- **v1.1 (2026-04-17):** reversed "delete develop" recommendation (§3); added verified admin audit findings (§1.6); restructured Phase A to put RLS doctor-scope fix as A1 based on first-hand verification; added preprod seed-data system (§16); updated next-5-actions (§13).
- **v1.2 (2026-04-17):** added audit coverage matrix (§17) and verified UI/UX findings (§18) after the user asked whether UI/UX had actually been checked. Answer was honestly "no, only admin"; this revision closes that by source-auditing every non-admin view, snapshotting home + booking live, and listing the 12 further audit activities (§18.8) that still need actual execution before launch.
- **v1.3 (2026-04-18):** A1 + A1b shipped. RLS doctor-scope migration written (`20260417_fix_doctor_scope_rls_v2.sql`). RBAC seed script fixed. Full 13-module preprod seed system built (`scripts/seed/preprod/`). §13 next-5 updated to reflect completed items.

---

_End of roadmap. This document is the source of truth for what "finished" means. Update it at every release tag._
