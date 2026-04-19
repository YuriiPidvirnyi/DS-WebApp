# Backup & Disaster Recovery Runbook

## Overview

This document describes backup strategy, recovery procedures, and operational checklists for the DentalStory WebApp. The primary data store is **Supabase Postgres** (project ID: `exgpwtyrkkhwqqdgqbkz`).

---

## 1. Recovery Objectives

| Metric                         | Target                                          |
| ------------------------------ | ----------------------------------------------- |
| RTO (Recovery Time Objective)  | ≤ 4 hours                                       |
| RPO (Recovery Point Objective) | ≤ 24 hours (PITR: up to last 5 min on Pro plan) |

---

## 2. Supabase Point-in-Time Recovery (PITR)

Supabase Pro plan includes PITR with up to **7 days** of history.

### 2.1 Triggering a PITR Restore

1. Go to [Supabase Dashboard → Project → Database → Backups](https://supabase.com/dashboard/project/exgpwtyrkkhwqqdgqbkz/database/backups)
2. Select **Point in Time Recovery**
3. Choose the target timestamp (UTC)
4. Click **Restore** — this creates a new database instance
5. Update env vars in Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) to point to the restored instance
6. Re-test: auth, appointments booking, admin panel login

> **Warning**: PITR restore creates a new project. DNS and connection strings must be updated everywhere (Vercel env, local `.env.local`).

### 2.2 Scheduled Daily Backups

Supabase also takes automatic daily snapshots. Access them at:
`Dashboard → Database → Backups → Scheduled backups`

---

## 3. Manual Data Export

Use `supabase db dump` to export a full schema + data snapshot.

```bash
# Install Supabase CLI
npm install -g supabase

# Log in
supabase login

# Export schema only
supabase db dump --project-ref exgpwtyrkkhwqqdgqbkz -f schema.sql

# Export schema + data (WARNING: includes PII)
supabase db dump --project-ref exgpwtyrkkhwqqdgqbkz --data-only -f data.sql

# Store encrypted — never commit plain SQL dumps with patient data
gpg --symmetric --cipher-algo AES256 data.sql
```

> Store encrypted dumps in a private, access-controlled location (e.g. private S3 bucket or encrypted external drive). **Never commit patient data to Git.**

---

## 4. Accidental Table Wipe Recovery

If a table is accidentally wiped (e.g. wrong `DELETE FROM` without `WHERE`):

### Immediate Steps

1. **Do not write more data** — every new row reduces PITR recoverability
2. Note the exact UTC timestamp of the incident
3. Open Supabase Dashboard → Database → Backups → PITR
4. Restore to 5 minutes _before_ the incident timestamp (see §2.1)
5. Export the recovered table:
   ```sql
   -- Run in the restored project's SQL editor
   COPY patients TO STDOUT WITH CSV HEADER;
   ```
6. Import into the production project via SQL editor or `psql`

### If PITR Is Not Available

Restore from the most recent scheduled snapshot (§2.2), then manually re-apply any events from logs/audit trail since that snapshot.

---

## 5. Contact Chain

| Priority | Contact                                                                     | When                            |
| -------- | --------------------------------------------------------------------------- | ------------------------------- |
| 1        | **Supabase Support** — [support.supabase.com](https://support.supabase.com) | DB-level issues, PITR failures  |
| 2        | **Vercel Support** — [vercel.com/support](https://vercel.com/support)       | Deployment, CDN, env var issues |
| 3        | **Team lead (Yurii Pidvirnyi)** — yurii.pidvirnyi@gmail.com                 | Application-level decisions     |

For production incidents, file a Supabase support ticket with:

- Project ref: `exgpwtyrkkhwqqdgqbkz`
- Incident UTC timestamp
- Description of data affected

---

## 6. Weekly Backup Verification Checklist

Run this every Monday:

- [ ] Open Supabase Dashboard → Database → Backups
- [ ] Confirm latest scheduled snapshot is less than 25 hours old
- [ ] Confirm PITR is enabled (green status on Backups page)
- [ ] Download a test schema dump locally: `supabase db dump --project-ref exgpwtyrkkhwqqdgqbkz -f /tmp/weekly-schema-check.sql`
- [ ] Verify the dump file is non-empty and contains expected table names: `grep -c 'CREATE TABLE' /tmp/weekly-schema-check.sql`
- [ ] Delete the local dump after verification (contains schema, not patient data, but still good hygiene)
- [ ] Log the check in the team's ops channel with date + snapshot age

---

## 7. Storage Backups (Supabase Storage)

Supabase Storage buckets are **not** included in PITR. Back up critical buckets separately:

```bash
# List buckets
supabase storage ls --project-ref exgpwtyrkkhwqqdgqbkz

# Download bucket contents (requires service role key)
# Use supabase-js or the REST API to enumerate and download objects
```

Currently the app uses Storage for treatment record attachments (if configured). Check `SUPABASE_STORAGE_BUCKET` env var.

---

## 8. Redis (Upstash) Recovery

Redis is used for rate-limiting and caching only. **No persistent business data is stored in Redis.** If the Upstash instance is lost:

1. Create a new Upstash Redis database at [console.upstash.com](https://console.upstash.com)
2. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel env
3. The app will self-heal — rate limit counters reset to zero (slightly elevated risk for ~1 hour until counters rebuild), cache misses fall through to Supabase

---

## 9. Environment Variables Recovery

If env vars are lost (e.g. Vercel project accidentally deleted):

- Supabase keys: regenerate at Dashboard → Settings → API
- Resend API key: [resend.com/api-keys](https://resend.com/api-keys)
- Upstash: [console.upstash.com](https://console.upstash.com)
- `CRON_SECRET`: generate a new random string (`openssl rand -hex 32`), update in Vercel + `vercel.json` cron Authorization header
- `SUPABASE_SERVICE_ROLE_KEY`: treat as a secret — rotate via Supabase Dashboard → Settings → API → Reset service role key if compromised
