# DentalStory — Production Launch Checklist

> Last updated: 2026-04-19

---

## 1. Pre-Launch Checklist

### 1.1 Environment Variables (Vercel → Settings → Environment Variables)

| Variable                                                                                                           | Value source                                                         | Done |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                                                         | Supabase project settings                                            | ☐    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                                                                    | Supabase project settings                                            | ☐    |
| `SUPABASE_SERVICE_ROLE_KEY`                                                                                        | Supabase project settings                                            | ☐    |
| `RESEND_API_KEY`                                                                                                   | Resend dashboard                                                     | ☐    |
| `RESEND_FROM_EMAIL`                                                                                                | Verified sender (e.g. `DentalStory <noreply@dentalstory.ua>`)        | ☐    |
| `ADMIN_NOTIFICATION_EMAIL`                                                                                         | Clinic admin inbox                                                   | ☐    |
| `CRON_SECRET`                                                                                                      | Generate: `openssl rand -hex 32` (now only guards `/api/payments/*`) | ☐    |
| Supabase Vault `process_notifications_invoke_secret`                                                               | `openssl rand -hex 32` (== edge-fn `NOTIFY_FN_SECRET`)               | ☐    |
| Supabase Vault `admin_notification_email`                                                                          | Clinic admin inbox (low-stock recipient)                             | ☐    |
| Edge-fn secrets: `NOTIFY_FN_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `SITE_URL` | Supabase → Edge Functions → secrets                                  | ☐    |
| `UPSTASH_REDIS_REST_URL`                                                                                           | Upstash console                                                      | ☐    |
| `UPSTASH_REDIS_REST_TOKEN`                                                                                         | Upstash console                                                      | ☐    |
| `NEXT_PUBLIC_SITE_URL`                                                                                             | `https://dentalstory.ua`                                             | ☐    |
| `SENTRY_AUTH_TOKEN`                                                                                                | Sentry → Settings → Auth Tokens                                      | ☐    |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`                                                                                  | GA4 property (optional)                                              | ☐    |

### 1.2 Supabase Production

- [ ] Run all pending migrations in order: `supabase db push` or apply via Supabase Dashboard → SQL editor
- [ ] Verify RLS is enabled on all tables (`patients`, `appointments`, `reviews`, `chat_sessions`, `chat_messages`, `treatment_records`, `materials`, `material_inventory`, `material_orders`)
- [ ] Verify `admin_users` seed: at least one `superadmin` row exists
- [ ] Confirm `notification_events` table exists and is empty
- [ ] Confirm `cron_runs` table + producer functions exist (migration `20260718_cron_runs_and_producers.sql`)
- [ ] Confirm `pg_cron` + `pg_net` extensions are installed and `SHOW timezone;` is `UTC`
- [ ] Enable Supabase Realtime for `chat_messages` and `chat_sessions` channels

### 1.3 Email Delivery

- [ ] Verify sender domain `dentalstory.ua` in Resend (DKIM + SPF records set)
- [ ] Send a test booking from `/booking` and confirm both patient and admin emails arrive
- [ ] Check Resend dashboard logs — no bounces or blocks

### 1.4 Scheduled Jobs (Supabase `pg_cron`)

Apply `20260718_cron_schedules.sql`, then verify with `SELECT jobid, jobname, schedule, active FROM cron.job;` (5 active jobs):

| `cron.job.jobname`       | Schedule (UTC) | Purpose                                                |
| ------------------------ | -------------- | ------------------------------------------------------ |
| `ds-drain-notifications` | `*/5 * * * *`  | Invoke `process-notifications` edge fn → send emails   |
| `ds-reminders`           | `0 18 * * *`   | Schedule 24h appointment reminders (deliver 07:00 UTC) |
| `ds-recall`              | `10 18 * * *`  | 3-touch recall producer                                |
| `ds-low-stock`           | `0 8 * * 1-5`  | Alert on low material inventory (weekdays)             |
| `ds-stock-metrics`       | `55 21 * * *`  | Snapshot daily stock metrics                           |

- [ ] Isolation-test the edge fn: insert a `queued` event → `curl` it with `Authorization: Bearer $NOTIFY_FN_SECRET` → assert `{success:true,processed:1}`, row → `sent` + `resend_id`, and a wrong bearer → 401
- [ ] Dry-run the producers by hand (`SELECT public.run_reminders_job();` …) → correct `notification_events`, re-run → 0 duplicates
- [ ] Check `/admin/analytics` → Cron Health widget shows last run times

### 1.5 Turnstile (Cloudflare)

- [ ] Swap Turnstile site key from test/dev key to production key in Vercel env vars
- [ ] Verify contact form and booking form pass Turnstile in production

### 1.6 Sentry

- [ ] Confirm `SENTRY_DSN` is wired (check `sentry.client.config.ts` and `sentry.server.config.ts`)
- [ ] Trigger a test error and confirm it appears in Sentry project dashboard

### 1.7 PWA

- [ ] Confirm `manifest.json` has correct `start_url` and icons
- [ ] Test install prompt on Chrome mobile

### 1.8 Final Smoke Test

- [ ] Homepage loads at `https://dentalstory.ua`
- [ ] `/booking` form submits → confirmation email received
- [ ] `/admin` login works with production admin credentials
- [ ] `/cabinet` patient login and data visible
- [ ] `/api-docs` loads OpenAPI spec

---

## 2. DNS Swing

1. **Before switching**: TTL on existing A/CNAME records → lower to 300s (5 min) at least 24h before cutover
2. **Cutover**: In your DNS provider, point `dentalstory.ua` and `www.dentalstory.ua` to Vercel's IP / CNAME:
   - CNAME `www` → `cname.vercel-dns.com`
   - A `@` → Vercel's anycast IP (get from Vercel Dashboard → Domains)
3. **Verify**: `dig +short dentalstory.ua` returns Vercel's IP within 5 min (TTL-dependent)
4. **SSL**: Vercel auto-provisions Let's Encrypt cert — wait up to 2 min after DNS propagates
5. **After 48h**: Restore TTL to 3600s

---

## 3. Rollback Plan

If a critical issue is found post-launch:

1. In Vercel Dashboard → Deployments → find the last known-good deployment
2. Click **Promote to Production** on that deployment
3. Rollback completes in ~30 seconds — no DNS changes needed
4. Note the deployment ID format: `dpl_xxxxxxxxxxxx` (visible in URL)
5. If a DB migration caused the issue: apply a down-migration or revert via Supabase snapshot

---

## 4. 72-Hour Post-Launch Monitoring

### What to watch

| Signal                 | Tool                           | Alert threshold                                 |
| ---------------------- | ------------------------------ | ----------------------------------------------- |
| JavaScript errors      | Sentry → Issues                | Any new `fatal` or unhandled rejection          |
| Vercel function errors | Vercel → Functions logs        | HTTP 500 rate > 1%                              |
| DB queries             | Supabase → Reports             | Slow queries > 2s or connection pool exhaustion |
| Cron jobs              | `/admin/analytics` Cron widget | Any cron shows `failed` status                  |
| Email delivery         | Resend dashboard               | Bounce rate > 2%                                |
| Real-time chat         | Supabase → Realtime            | Dropped connections or high latency             |

### Oncall rotation (first 72h)

- Assign at least one person to check Sentry every 2h
- Set up Sentry alert rules: email on first occurrence of any new issue

---

## 5. Customer Communication (Existing Patients)

Ukrainian-language announcement template:

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

## 6. Weekly Post-Launch Review

Run through this list every Monday for the first 4 weeks:

- [ ] Review Sentry issue list — resolve or assign all new issues
- [ ] Check Resend delivery stats — confirm open rate and no bounce spikes
- [ ] Check Vercel Analytics — review Core Web Vitals (LCP, CLS, INP)
- [ ] Review Supabase usage — storage, DB size, bandwidth
- [ ] Check low-stock alerts in `/admin/materials` — reorder if needed
- [ ] Review cron run history in `/admin/analytics`
- [ ] Collect patient feedback from `/reviews` — respond if needed
- [ ] Check Upstash Redis usage — confirm cache hit rate is healthy
