# DentalStory — Operational Runbooks

> Maintained by the DentalStory engineering team.
> Last updated: 2026-04-21.
> Owner: Yurii Pidvirnyi

---

## Table of Contents

1. [Launch](#1-launch)
2. [Deployment & Rollback](#2-deployment--rollback)
3. [Incident Response](#3-incident-response)
4. [Cron Job Failures](#4-cron-job-failures)
5. [Database Issues](#5-database-issues)
6. [Email Delivery Issues](#6-email-delivery-issues)
7. [Redis / Cache Issues](#7-redis--cache-issues)
8. [On-Call Handoff](#8-on-call-handoff)

---

## 1. Launch

> Full pre-launch checklist: [`docs/LAUNCH.md`](./LAUNCH.md)

### 1.1 Go/No-Go Criteria

All of the following must be green before cutting DNS:

| Check                                          | Verified by                     | Done |
| ---------------------------------------------- | ------------------------------- | ---- |
| CI pipeline green on `main`                    | GitHub Actions                  | ☐    |
| All env vars set in Vercel (prod)              | [`LAUNCH.md §1.1`](./LAUNCH.md) | ☐    |
| Supabase migrations applied                    | `supabase db push`              | ☐    |
| At least one `superadmin` row in `admin_users` | Supabase dashboard              | ☐    |
| Test booking email received (patient + admin)  | Manual test                     | ☐    |
| Turnstile prod key active                      | Vercel env                      | ☐    |
| Sentry test error confirmed                    | Sentry dashboard                | ☐    |
| All 3 cron jobs respond 200 with `CRON_SECRET` | Manual curl                     | ☐    |
| `a11y:audit` passes on prod URL                | `npm run a11y:audit`            | ☐    |
| Lighthouse PWA score ≥ 90                      | Chrome DevTools                 | ☐    |

### 1.2 DNS Swing Window

**Planned window:** low-traffic hour (02:00–04:00 Kyiv time / 23:00–01:00 UTC).

Steps:

1. **-24h**: Lower TTL on `dentalstory.ua` and `www.dentalstory.ua` to 300s.
2. **T-0**: Update DNS records:
   - `CNAME www` → `cname.vercel-dns.com`
   - `A @` → Vercel anycast IP (get from Vercel Dashboard → Domains)
3. **T+2min**: Verify with `dig +short dentalstory.ua`.
4. **T+5min**: `curl -I https://dentalstory.ua` — expect `HTTP/2 200`, `x-vercel` header present.
5. **T+48h**: Restore TTL to 3600s.

### 1.3 Rollback Plan

If a critical issue appears within 15 minutes of DNS swing:

1. Revert DNS records to previous values (TTL is still 300s — propagates fast).
2. Confirm old site is serving traffic with `curl -I`.
3. File a post-mortem in `docs/POST_MORTEMS/YYYY-MM-DD.md`.

If the issue appears after DNS has fully propagated (>15min after swing):

1. Vercel Dashboard → Deployments → find the last known-good deployment.
2. Click **Promote to Production** (~30s, no DNS change).
3. If a DB migration caused the issue: apply a down-migration or restore from Supabase snapshot (see §5).

### 1.4 72-Hour Post-Launch Watch

Assign an on-call engineer for the first 72 hours. Check every 2 hours:

| Signal          | Tool                           | Alert threshold                        |
| --------------- | ------------------------------ | -------------------------------------- |
| JS errors       | Sentry → Issues                | Any new `fatal` or unhandled rejection |
| Function errors | Vercel → Functions logs        | HTTP 500 rate > 1%                     |
| Cron health     | `/admin/analytics` Cron widget | Any cron shows `failed`                |
| Email delivery  | Resend dashboard               | Bounce rate > 2%                       |
| DB queries      | Supabase → Reports             | Slow query > 2s or pool exhaustion     |
| Realtime chat   | Supabase → Realtime            | Dropped connections                    |

### 1.5 Customer Communication

Send to existing patients after DNS propagates. Ukrainian template:

---

**Шановні пацієнти DentalStory!**

Раді повідомити, що наш новий онлайн-кабінет пацієнта тепер доступний на [dentalstory.ua](https://dentalstory.ua).

Тепер ви можете:

- **Записатися на прийом** онлайн у зручний для вас час
- **Переглядати свої записи** та історію лікування в особистому кабінеті
- **Отримувати нагадування** про майбутні прийоми на email

Для входу перейдіть на [dentalstory.ua/auth/login](https://dentalstory.ua/auth/login) і зареєструйтесь за адресою своєї електронної пошти.

З повагою,
Команда DentalStory

---

### 1.6 Weekly Post-Launch Review (first 4 weeks)

Every Monday:

- [ ] Review Sentry issue list — resolve or assign all new issues
- [ ] Check Resend delivery stats — confirm open rate, no bounce spikes
- [ ] Review Vercel Analytics — Core Web Vitals LCP/CLS/INP for top 5 pages
- [ ] Review Supabase usage — storage, DB size, bandwidth
- [ ] Check low-stock alerts in `/admin/materials`
- [ ] Review cron run history in `/admin/analytics`
- [ ] Check Upstash Redis usage — confirm cache hit rate is healthy

---

## 2. Deployment & Rollback

### 2.1 Normal Deployment

Deployments are automatic via Vercel on push to `main`. The flow is:

```
feature/* → develop (preprod) → main (production)
```

- All PRs must target `develop`.
- `develop` promotes to `main` only after a preprod sign-off.
- CI must be green: lint + typecheck + unit tests + a11y audit.

### 2.2 Emergency Hotfix

```bash
git checkout -b hotfix/short-description main
# ... fix ...
git push origin hotfix/short-description
# Create PR targeting main directly (bypass develop for true emergencies)
# After merge, cherry-pick back to develop:
git checkout develop && git cherry-pick <commit>
```

### 2.3 Promote a Previous Deployment

1. Vercel Dashboard → Project → Deployments.
2. Find the target deployment (use git SHA or date).
3. ⋮ menu → **Promote to Production**.
4. Takes ~30s. Zero-downtime. No DNS changes.

### 2.4 Preview Deployments

Every PR gets a preview URL (`https://<branch>.ds-web-app.vercel.app`).
Use preview URLs to validate UI changes before merging.

---

## 3. Incident Response

### Severity Levels

| Level         | Definition             | Response time | Example                              |
| ------------- | ---------------------- | ------------- | ------------------------------------ |
| P0 — Critical | Site down or data loss | 15 min        | 500 on all routes, DB unreachable    |
| P1 — High     | Core flow broken       | 1h            | Booking form fails, admin login down |
| P2 — Medium   | Degraded experience    | 4h            | Email not sending, cron skipped      |
| P3 — Low      | Minor issue            | Next sprint   | UI glitch, slow query                |

### P0 / P1 Response Steps

1. **Acknowledge** — comment in the incident Slack thread (or WhatsApp): "I'm on it."
2. **Diagnose** — check in order:
   - Vercel Function logs (check for 500s).
   - Sentry → Issues (latest events).
   - Supabase → Logs (DB errors).
   - Vercel → Deployments (was there a recent deploy?).
3. **Contain** — if a bad deploy caused it: promote previous deployment (see §2.3).
4. **Fix** — hotfix branch → PR → merge (see §2.2).
5. **Verify** — smoke test the affected flow on production.
6. **Post-mortem** — within 48h, write `docs/POST_MORTEMS/YYYY-MM-DD-short-description.md`:
   - Timeline
   - Root cause
   - Impact
   - Fix
   - Prevention

---

## 4. Cron Job Failures

### 4.1 Cron Inventory

| Route                     | Schedule                     | Purpose                          |
| ------------------------- | ---------------------------- | -------------------------------- |
| `/api/cron/notifications` | Every 5 min                  | Sends queued emails              |
| `/api/cron/reminders`     | Daily 15:00 UTC (18:00 Kyiv) | Queues 24h appointment reminders |
| `/api/cron/low-stock`     | Daily 08:00 UTC              | Alerts on low material stock     |
| `/api/cron/recall`        | Weekly Monday 08:00 UTC      | Sends 6-month recall messages    |

All runs are recorded in the `cron_runs` table and visible at `/admin/analytics` → Cron Health.

### 4.2 Diagnosing a Failed Cron

```sql
-- Most recent run per cron name
SELECT name, status, started_at, finished_at, processed, error
FROM cron_runs
ORDER BY started_at DESC
LIMIT 20;
```

### 4.3 Manual Cron Trigger

```bash
curl -X POST https://dentalstory.ua/api/cron/notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

Replace the path for other crons. Expect `{"success":true}` with HTTP 200.

### 4.4 Common Failure Modes

| Symptom                               | Likely cause                        | Fix                                                    |
| ------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| `error: "supabase unavailable"`       | Missing `SUPABASE_SERVICE_ROLE_KEY` | Set env var in Vercel                                  |
| `error: "resend unavailable"`         | Missing or invalid `RESEND_API_KEY` | Update key in Vercel + Resend dashboard                |
| `status: "running"` stuck for > 5 min | Cron timed out                      | Check Vercel function logs; increase timeout if needed |
| Cron not firing at all                | Vercel Cron not configured          | Verify `vercel.json` cron section and Vercel Dashboard |

---

## 5. Database Issues

### 5.1 Connection Pool Exhaustion

Supabase uses PgBouncer. If you see "too many clients":

1. Check Supabase Dashboard → Reports → Database connections.
2. Identify the offending query in Supabase → Logs → Postgres.
3. Short-term: restart the Supabase project (Dashboard → Settings → Restart).
4. Long-term: audit server-side code for missing `supabase.auth.signOut()` or unreleased connections.

### 5.2 Slow Query

1. Supabase Dashboard → Reports → Query Performance.
2. If the slow query has no index: add one via a migration.
3. Migration template:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_idx_<table>_<col>.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_<table>_<col> ON <table>(<col>);
```

4. Apply: `supabase db push` (preprod first, then prod).

### 5.3 Restoring from Snapshot (Supabase)

1. Supabase Dashboard → Database → Backups.
2. Select the snapshot closest to before the incident.
3. Click **Restore** — this creates a new Supabase project.
4. Update `NEXT_PUBLIC_SUPABASE_URL` and keys in Vercel to point to the restored project.
5. Validate: run smoke tests, check `admin_users` seed.

### 5.4 Applying a Down-Migration

If a migration must be reverted:

```bash
# Write a reverse migration manually
# File: supabase/migrations/YYYYMMDDHHMMSS_revert_<original_name>.sql
supabase db push
```

Supabase does not support automatic down-migrations — always write the reverse SQL explicitly.

---

## 6. Email Delivery Issues

### 6.1 Checking Delivery Status

1. Resend Dashboard → Emails → filter by recipient or date.
2. Check event log: `queued → delivered` or `bounced / spam`.

### 6.2 Resend Quota Exceeded

- Free plan: 100 emails/day, 3000/month.
- If quota hit: upgrade plan in Resend dashboard, or throttle `notification_events` queue.

### 6.3 Email in Queue But Not Sent

Check `notification_events` table:

```sql
SELECT id, type, status, scheduled_at, attempts, last_error
FROM notification_events
WHERE status != 'sent'
ORDER BY scheduled_at DESC
LIMIT 20;
```

If `status = 'failed'` with `last_error`:

- `resend_unavailable`: check `RESEND_API_KEY`.
- `recipient_not_found`: the appointment row was deleted.
- Network error: transient; trigger `/api/cron/notifications` manually.

### 6.4 Email Lands in Spam

1. Verify SPF/DKIM records for `dentalstory.ua` in your DNS provider.
2. Use [mail-tester.com](https://mail-tester.com) to score the email.
3. Ensure `From` header matches a verified Resend sender domain.

---

## 7. Redis / Cache Issues

### 7.1 Cache Miss Storm

If Redis is unavailable, all API routes degrade gracefully (fall through to DB). No action needed short-term.

Monitor: Upstash Dashboard → Usage → Requests/s spike.

### 7.2 Stale Cache

Force-invalidate a specific key:

```bash
# Via Upstash CLI or dashboard
DEL "dentalstory:doctors:list"
```

Or restart the Vercel deployment — serverless functions don't share in-memory state, so a new deploy is the equivalent of a restart.

### 7.3 Redis Quota Exceeded

- Upstash free tier: 10,000 commands/day.
- If exceeded: upgrade plan in Upstash dashboard.
- To reduce pressure: increase TTL values in `src/lib/redis.ts`.

---

## 8. On-Call Handoff

### End-of-shift checklist

Before handing off to the next on-call engineer:

- [ ] All P0/P1 incidents resolved or escalated with written status.
- [ ] Sentry issue list reviewed — no unacknowledged `fatal` errors.
- [ ] Cron runs for last 24h checked — no `failed` status.
- [ ] Resend dashboard — no bounce spike.
- [ ] Brief the incoming engineer: "Here's what happened, here's what's still open."

### Escalation contacts

| Role                   | Contact                                              | When to escalate                         |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Engineering lead       | Yurii Pidvirnyi                                      | P0 or P1 after 15 min without resolution |
| Supabase support       | [support.supabase.com](https://support.supabase.com) | DB unreachable or data loss              |
| Vercel support         | [vercel.com/help](https://vercel.com/help)           | Deployment infrastructure down           |
| Resend support         | [resend.com/help](https://resend.com)                | Email delivery systemic failure          |
| Cloudflare (Turnstile) | [dash.cloudflare.com](https://dash.cloudflare.com)   | Captcha blocking all form submissions    |
