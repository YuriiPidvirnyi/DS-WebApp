# Architecture

## System Overview

```
                                    ┌─────────────────┐
                                    │   Vercel CDN     │
                                    │  (Edge Network)  │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │    proxy.ts      │
                                    │  (Edge Middleware)│
                                    │  CSP, HSTS, Auth │
                                    └────────┬────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
                 ┌────────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐
                 │  App Router   │  │  API Routes   │  │  Static     │
                 │  (SSR/SSG)    │  │  (/api/*)     │  │  Assets     │
                 │  React 18     │  │  25 handlers  │  │  PWA/fonts  │
                 └────────┬──────┘  └───────┬───────┘  └─────────────┘
                          │                 │
                 ┌────────▼──────┐          │
                 │  Client SPA   │          │
                 │  Providers    │          │
                 │  i18n, a11y   │          │
                 └───────────────┘          │
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
           ┌────────▼──────┐      ┌────────▼──────┐      ┌────────▼──────┐
           │   Supabase    │      │ Upstash Redis │      │   External    │
           │  PostgreSQL   │      │   (Cache +    │      │   Services    │
           │  Auth + RLS   │      │  Rate Limit)  │      │               │
           │  Realtime     │      └───────────────┘      │ - CliniCards  │
           │  Storage      │                             │ - Resend      │
           └───────────────┘                             │ - Sentry      │
                                                         │ - Turnstile   │
                                                         │ - Vercel      │
                                                         └───────────────┘
```

---

## Request Flow

### Public page request

```
Browser → Vercel CDN → proxy.ts (CSP + security headers)
       → App Router (SSR or cached SSG)
       → HTML with hydration payload
       → Client hydration (providers, i18n init, analytics)
```

### API request (authenticated)

```
Client (fetch wrapper + CSRF token)
  → proxy.ts (updateSession: refresh Supabase cookies)
  → API route handler
    → validateCSRF()
    → checkRateLimit() via Redis
    → Supabase query (with user context / RLS)
  → JSON response
```

### Admin request

```
Client → proxy.ts → updateSession
  → Middleware checks admin_users membership
  → API route: getAdminAccess() → service-role Supabase client
  → Admin-level queries (bypass RLS)
  → JSON response
```

---

## Authentication Flow

```
┌──────────┐    ┌────────────┐    ┌───────────┐
│  Browser │───►│ /auth/login │───►│ Supabase  │
│          │    │ /auth/signup│    │   Auth    │
│          │◄───│ /auth/callback│◄─│  (email)  │
└──────────┘    └────────────┘    └───────────┘
     │
     │  Session cookies (HTTP-only)
     │
     ▼
┌──────────────┐
│   proxy.ts   │  updateSession() on every request
│  middleware  │  Refreshes Supabase auth cookies
└──────┬───────┘
       │
       ├── /cabinet/*  → requires auth (redirect to /auth/login)
       ├── /admin/*    → requires admin_users membership (redirect to /admin/login)
       └── /api/*      → session available in route handlers
```

---

## Data Flow

### Booking

```
BookingForm (src/components/BookingForm.tsx)
  │
  ├── Step 1: GET /api/services → service list
  ├── Step 2: GET /api/doctors → doctor list
  ├── Step 3: GET /api/appointments/slots?date=...&doctorId=... → available slots
  ├── Step 4: POST /api/turnstile/verify → CAPTCHA
  └── Step 5: POST /api/appointments → create appointment
                │
                ├── Insert into Supabase `appointments` table
                ├── Queue `booking_confirmation` notification
                └── Queue `new_booking_admin` notification
                         │
                         ▼
               Cron: /api/cron/notifications → Resend email
```

### Email notifications

```
Booking/Cancellation → Insert notification_events (status: queued)
                                    │
Cron (every 5 min) ─── GET /api/cron/notifications
                                    │
                         ┌──────────▼──────────┐
                         │  Pick queued events  │
                         │  where scheduled_at  │
                         │    <= now()          │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Resend API         │
                         │   (HTML templates    │
                         │    from email-        │
                         │    templates.ts)      │
                         └──────────┬──────────┘
                                    │
                         Update status: sent/failed

Cron (daily 18:00 UTC) ─── GET /api/cron/reminders
                                    │
                         Insert appointment_reminder events
                         for tomorrow, scheduled_at = 09:00 Kyiv
```

### Live chat

```
Patient (LiveChat.tsx)          Admin (AdminChatPage)
       │                               │
       ├── useLiveChat hook            ├── useAdminChat hook
       │                               │
       ▼                               ▼
  Supabase Realtime subscription on chat_messages
       │
       ├── INSERT chat_message → trigger updates session
       └── Real-time delivery to both sides
```

---

## Key Files

| Layer      | File                             | Purpose                                     |
| ---------- | -------------------------------- | ------------------------------------------- |
| Edge       | `proxy.ts`                       | CSP, security headers, auth session refresh |
| Auth       | `src/lib/supabase/middleware.ts` | Route protection (/cabinet, /admin)         |
| Auth       | `src/lib/supabase/client.ts`     | Browser Supabase client                     |
| Auth       | `src/lib/supabase/server.ts`     | Server Supabase client (cookies)            |
| Auth       | `src/lib/supabase/admin.ts`      | Service-role admin client                   |
| Cache      | `src/lib/redis.ts`               | Upstash Redis: cache, rate limit, sessions  |
| Security   | `src/lib/api-security.ts`        | CSRF validation, rate limiting helpers      |
| Email      | `src/lib/email.ts`               | Resend client wrapper                       |
| Email      | `src/lib/email-templates.ts`     | HTML email templates                        |
| External   | `src/lib/clinicards-client.ts`   | CliniCards API client (slots)               |
| Client     | `src/services/api.ts`            | Fetch wrapper with CSRF                     |
| Monitoring | `src/utils/sentry.ts`            | Sentry helpers                              |
| Monitoring | `instrumentation.ts`             | Server/edge Sentry init                     |
| Monitoring | `instrumentation-client.ts`      | Browser Sentry init                         |
| i18n       | `src/i18n/config.ts`             | i18next setup, lazy loading                 |
| Styles     | `src/styles/globals.css`         | Tailwind + design tokens                    |
| Config     | `next.config.ts`                 | PWA, Sentry, headers, imports               |

---

## Deployment

**Platform:** Vercel  
**Build:** `next build` (output: standalone)  
**Environment:** Node.js 20, managed by Vercel  
**CDN:** Vercel Edge Network (global)  
**Cron:** Vercel Cron (`vercel.json` schedule)

### Environment separation

| Environment | Supabase project       | Redis        | Sentry                      | Domain               |
| ----------- | ---------------------- | ------------ | --------------------------- | -------------------- |
| Production  | `exgpwtyrkkhwqqdgqbkz` | Upstash prod | `sentry-dentalstory-webapp` | `dentalstory.com.ua` |
| Development | Same (with anon key)   | Optional     | Optional                    | `localhost:3000`     |

### Graceful degradation

All external services degrade gracefully when not configured:

- **Supabase missing:** Auth pages show, but login/signup won't work
- **Redis missing:** Rate limiting disabled, caching bypassed
- **Resend missing:** Email notifications silently skipped
- **CliniCards missing:** Appointment slots fall back to generated defaults
- **Sentry missing:** Error tracking disabled
- **Turnstile missing:** CAPTCHA skipped
