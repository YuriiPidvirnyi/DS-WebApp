# API Reference

## Overview

DentalStory WebApp exposes 25 Next.js App Router API routes under `/api/`. All routes return JSON responses with a standard envelope:

```json
{ "success": true, "data": ... }
{ "success": false, "error": "..." }
```

**Base URL:** `http://localhost:3000` (dev) / `https://dentalstory.com.ua` (prod)  
**OpenAPI spec:** `public/openapi.json` (viewable at `/api-docs`)

### Common security

- **CSRF:** Mutation endpoints require `x-csrf-token` header (32+ chars, generated client-side via `sessionStorage`)
- **Rate limiting:** Per-IP via Upstash Redis. Edge middleware: 60 req/min. Per-route limits vary (e.g., feedback: 20 req/min)
- **Auth:** Supabase session cookies. Admin routes check `admin_users` table membership
- **Payments:** admin `/api/payments/*` routes require `Authorization: Bearer <CRON_SECRET>`
- **Scheduled jobs:** run on Supabase `pg_cron` (no HTTP API) — see [Scheduled Jobs](#scheduled-jobs-supabase-pg_cron--no-http-api)

---

## Public Endpoints

### GET /api/doctors

List active doctors ordered by experience.

- **Caching:** ISR `revalidate = 120` (2 min)
- **Response:** `{ success, data: Doctor[] }`

### GET /api/services

List active services ordered by category and price.

- **Caching:** ISR `revalidate = 60` (1 min)
- **Response:** `{ success, data: Service[] }`

### GET /api/appointments/slots

Available time slots for a given date.

- **Query params:** `date` (required), `doctorId` (optional)
- **Source:** CliniCards API with Redis cache (60s TTL), falls back to generated slots when CliniCards is unavailable
- **Response:** `{ success, data: Slot[] }`

### POST /api/contacts

Submit contact form.

- **CSRF:** Required
- **Rate limit:** Per-IP
- **Body:** `{ name, phone, email?, subject?, message? }`
- **Side effect:** Forwards to CliniCards if configured
- **Response:** `{ success, data: { id } }`

### GET /api/reviews

List approved reviews.

- **Response:** `{ success, data: Review[] }`

### POST /api/reviews

Submit a new review for moderation.

- **CSRF:** Required
- **Body:** `{ name, email?, rating, service, doctor?, comment, visitDate?, wouldRecommend? }`
- **Response:** `{ success, data: { id } }` (status: 201)

### POST /api/newsletter

Subscribe to newsletter.

- **CSRF:** Required
- **Body:** `{ email }`
- **Response:** `{ success }`

### POST /api/feedback/form

Record micro-feedback on a form.

- **CSRF:** Required
- **Rate limit:** 20 req/min
- **Body:** `{ form, rating: 'up'|'down', refId?, comment? }`
- **Response:** `{ success, data: { recorded: boolean } }`

### POST /api/turnstile/verify

Verify Cloudflare Turnstile CAPTCHA token server-side.

- **Body:** `{ token }`
- **Response:** `{ success }` (no-ops gracefully if `TURNSTILE_SECRET_KEY` is not configured)

### GET /api/health

Liveness check.

- **Response:** `{ status: 'ok', version, timestamp, environment, clinicards?: { status } }`

---

## Authenticated Endpoints

Require valid Supabase session cookie.

### GET /api/appointments

List current user's appointments.

- **Response:** `{ success, data: Appointment[] }`

### POST /api/appointments

Create a new appointment.

- **CSRF:** Required
- **Body:** `{ doctorId, serviceId, appointmentDate, appointmentTime, patientName, notes? }`
- **Side effects:** Queues `booking_confirmation` email (patient) + `new_booking_admin` email (admin)
- **Response:** `{ success, data: Appointment }` (status: 201)

### GET /api/appointments/[id]/summary

Minimal non-sensitive appointment data for the booking success page. Only accessible by the appointment owner.

- **Response:** `{ success, data: { id, doctorName, serviceName, date, time } }`

### PATCH /api/appointments/[id]/reminder-preference

Update reminder preference for an appointment.

- **Body:** `{ channel: 'email'|'sms'|'both'|'none' }`
- **Response:** `{ success }`

### POST /api/ai/chat

AI chat assistant (streaming).

- **CSRF:** Required
- **Rate limit:** Per-IP
- **Body:** `{ messages: Message[] }`
- **Response:** Streaming text response via AI SDK
- **Config:** `maxDuration = 30`

### POST /api/ai/recommendations

AI-powered service recommendations.

- **Body:** `{ symptoms, context? }`
- **Response:** Structured recommendation JSON
- **Config:** `maxDuration = 30`

---

## Admin Endpoints

Require `admin_users` table membership (checked via `getAdminAccess`).

### GET /api/appointments (admin mode)

List all appointments with filters.

- **Query params:** `status`, `doctorId`, `dateFrom`, `dateTo`, `search`
- **Response:** `{ success, data: Appointment[] }`

### GET /api/appointments/[id]

Fetch single appointment detail.

### PATCH /api/appointments/[id]

Update appointment (status, notes, reschedule).

- **Body:** Partial appointment fields
- **Side effect:** Queues `appointment_cancellation` email on cancel

### DELETE /api/appointments/[id]

Delete appointment.

### GET /api/admin/analytics

Dashboard analytics with Redis caching (5 min).

- **Response:** `{ success, data: { appointments, revenue, patients, ... } }`

### POST /api/admin/analytics

Refresh analytics cache.

- **Body:** `{ action: 'refresh', period? }`

### GET /api/materials

List materials catalog with optional filters.

- **Query params:** `category`, `isActive`, `search`

### POST /api/materials

Create material catalog entry.

- **Body:** `{ nameUk, nameEn?, namePl?, category, unit, sku?, minStockLevel?, supplier* }`

### PATCH /api/materials/[id]

Update material.

### DELETE /api/materials/[id]

Delete material.

### GET /api/material-orders

List material orders.

### POST /api/material-orders

Create material order with line items.

### GET /api/material-orders/[id]

Fetch single order with items.

### PATCH /api/material-orders/[id]

Update order status/details. On delivery status, inventory is auto-updated.

### DELETE /api/material-orders/[id]

Delete/cancel order.

### GET /api/treatment-records

List treatment records.

### POST /api/treatment-records

Create treatment record with line items.

- **Body:** `{ appointmentId?, patientId, doctorId, toothNumbers?, diagnosis?, notes?, items: [{ serviceId, toothNumber?, quantity, priceAtTime }] }`

### GET /api/treatment-records/[id]

Fetch treatment record with items.

### PATCH /api/treatment-records/[id]

Update treatment record (status, payment, notes).

### DELETE /api/treatment-records/[id]

Delete treatment record.

---

## Scheduled Jobs (Supabase `pg_cron` — no HTTP API)

Scheduled work migrated off Vercel Cron / `/api/cron/*` routes to Supabase-native
scheduling. There are **no cron HTTP endpoints** anymore. See
[RUNBOOKS §4](./RUNBOOKS.md#4-cron-job-failures) for operations.

- **Sender:** the `process-notifications` **edge function** (Deno) drains
  `notification_events` (`status='queued'`, `scheduled_at <= now()`) and sends via the
  Resend REST API. Invoked every 5 min by `pg_cron` → `pg_net.http_post`, gated by
  `Authorization: Bearer <NOTIFY_FN_SECRET>` (== Vault `process_notifications_invoke_secret`);
  `verify_jwt=false`. Not part of the Next.js API surface.
- **Producers** (`pg_cron` → plpgsql, no HTTP): `run_reminders_job` (daily 18:00 UTC,
  reminders delivered 07:00 UTC), `run_recall_job` (18:10 UTC), `run_low_stock_job`
  (weekdays 08:00 UTC), `run_stock_metrics_job` (21:55 UTC).

> `CRON_SECRET` no longer gates any scheduled job — it now only secures the admin
> **payment** routes (`/api/payments/*`).

---

## E2E Helper

### GET/POST /api/e2e/auth-links

Non-production helper for E2E tests. Generates Supabase auth links via service role key. Only available when `NODE_ENV !== 'production'`.

---

## Error Responses

| Status | Meaning                                                 |
| ------ | ------------------------------------------------------- |
| 400    | Validation error (missing/invalid fields)               |
| 403    | CSRF token missing/invalid, or insufficient permissions |
| 404    | Resource not found                                      |
| 429    | Rate limit exceeded                                     |
| 500    | Internal server error                                   |

Rate limit responses include headers:

```
X-RateLimit-Remaining: <number>
Retry-After: <seconds>
```

---

## Client SDK

The client-side API wrapper is at `src/services/api.ts`. It provides:

- `api.get(url)`, `api.post(url, body)`, `api.patch(url, body)`, `api.delete(url)`
- Automatic CSRF token injection from `sessionStorage`
- `AbortError` -> `APIError` with `code: 'ABORTED'`
- Domain-specific services: `src/services/appointments.ts`, `reviews.ts`, `contacts.ts`, `reminders.ts`, `subscriptions.ts`, `feedback.ts`
