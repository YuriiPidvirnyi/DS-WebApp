# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development

- `npm run dev` - Start Next.js development server (port 3000, Turbopack)
- `npm run dev:restart` - Free port 3000, clear `.next/dev/cache/turbopack`, then `npm run dev` (see also Claude Code `/restart_ds_web_app`)
- `npm run dev:kill` / `npm run dev:clear-turbo` - Individual steps used by `dev:restart`
- `npm run build` - Build for production (Next.js)
- `npm run start` - Start production server

### Code Quality and Testing

- `npm run lint` - Run ESLint (max 100 warnings allowed)
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking (full project)
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests once with Vitest
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:coverage` - Run tests with coverage

### End-to-End Testing

- `npm run test:e2e:auth` - Run auth E2E tests (mocked Supabase)
- `npm run test:e2e:auth:live` - Run auth E2E tests against live Supabase
- `npm run test:e2e:auth:links:live` - Run auth email link tests (live)

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16 App Router (TypeScript)
- **Styling**: Tailwind CSS 3 + CSS custom properties
- **Fonts**: Nunito (headings) + Rubik (body) via `next/font/google`
- **Routing**: Next.js App Router (file-based, `app/` directory)
- **Auth**: Supabase (`@supabase/ssr`) — requires `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: i18next + react-i18next (Ukrainian default, EN + PL)
- **Icons**: Lucide React
- **PWA**: @ducanh2912/next-pwa with Workbox
- **Monitoring**: Sentry (@sentry/nextjs), Vercel Analytics
- **Email**: Resend (`resend`) — transactional emails (booking confirmation, reminders, cancellation)
- **Cache**: Redis via @upstash/redis (requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- **Testing**: Vitest (unit), Playwright (e2e/auth)

### Key Directory Structure

```
app/                     # Next.js App Router pages
├── layout.tsx           # Root layout (fonts, metadata, providers)
├── page.tsx             # Homepage → renders src/views/Home
├── providers.tsx        # Client-side providers
├── i18n-provider.tsx    # i18n wrapper (client)
├── app-initializer.tsx  # Analytics + reminders init
├── about/               # /about route
├── admin/               # /admin route (auth-protected)
├── api/                 # API routes
├── auth/                # Auth flow (login, sign-up)
├── booking/             # /booking route
├── cabinet/             # Patient cabinet (auth-protected)
├── contact/             # /contact route
├── gallery/             # /gallery route
├── reviews/             # /reviews route
├── services/            # /services route
├── patient/[id]/        # /patient/[id] route
└── symptom-checker/     # AI symptom checker

src/
├── components/          # Reusable UI components
│   ├── ui/              # Basic UI primitives (Button, Input, Logo, etc.)
│   ├── admin/           # Admin-specific components
│   └── providers/       # Context providers
├── contexts/            # React contexts (AdminAuthContext)
├── content/             # Static JSON data (gallery, images)
├── hooks/               # Custom React hooks
├── i18n/                # i18next configuration
├── lib/                 # External service clients (supabase/, redis.ts)
├── locales/             # Translation files (uk, en, pl)
├── services/            # API services and external integrations
├── styles/              # globals.css (Tailwind base + brand CSS vars)
├── types/               # TypeScript types
├── utils/               # Utility functions
├── views/               # Page-level view components (imported by app/ pages)
└── test/                # Test utilities (test-utils.tsx)
```

### Brand System (v2)

Colors defined in `tailwind.config.js` and `src/styles/globals.css`:

| Token                                | HEX       | Usage                           |
| ------------------------------------ | --------- | ------------------------------- |
| `dental.primary`                     | `#AECED3` | Surface fills, card backgrounds |
| `dental.primary-600` / `dental-teal` | `#5A8A94` | CTAs, links, focus rings        |
| `dental.dark` / `dental-navy`        | `#2C3E42` | Headings, dark text             |
| `dental.text`                        | `#4A5E63` | Body copy                       |
| `dental.secondary`                   | `#D1CAC0` | Warm neutral surfaces           |

**Accessibility rule**: Never use white text on Brand Blue (`#AECED3`) — contrast ratio fails WCAG AA.

**Fonts**: Nunito (`--font-nunito`) for headings, Rubik (`--font-rubik`) for body. Both loaded in `app/layout.tsx` via `next/font`.

### Development Patterns

#### Component Architecture

- Pages in `app/` are thin wrappers — actual content in `src/views/`
- UI primitives in `src/components/ui/`
- Next.js App Router handles code splitting automatically
- Error boundaries via `app/global-error.tsx` and `src/components/ErrorBoundary.tsx`
- Floating UI: `ClientFloatingButtons` renders `RadialMenu` + `AccessibilityPanel`

#### State Management

- Form state: React Hook Form + Zod schemas
- Global accessibility prefs: `AccessibilityProvider` (Context)
- API state: custom services with Redis caching in `src/lib/redis.ts`

#### Auth

- Supabase auth via `@supabase/ssr`
- Client: `src/lib/supabase/client.ts`
- Server: `src/lib/supabase/server.ts`
- Middleware: `src/lib/supabase/middleware.ts`
- Guard: All auth calls check env vars before initializing client

#### API Integration

- CliniCards API for available slots only (`src/lib/clinicards-client.ts`)
- Appointments CRUD: Supabase (source of truth)
- Sentry tunnel at `/monitoring`
- Rate limiting in `proxy.ts` middleware (60 req/min per IP)
- OpenAPI docs at `/api-docs`

#### Notifications & Email

- Queue: `notification_events` table in Supabase (type, appointment_id, recipient_email, status, scheduled_at)
- Processor: `/api/cron/notifications` — Vercel Cron (every 5 min), picks up `queued` events where `scheduled_at <= now()`, sends via Resend
- Reminder scheduler: `/api/cron/reminders` — Vercel Cron (daily 18:00 UTC), inserts `appointment_reminder` events for tomorrow's appointments, scheduled for 09:00 Kyiv time
- Templates: `src/lib/email-templates.ts` — branded HTML emails (booking confirmation, reminder, cancellation, admin alert)
- Client: `src/lib/email.ts` — Resend wrapper with graceful fallback when not configured
- On booking: queues `booking_confirmation` (patient) + `new_booking_admin` (admin)
- On cancellation: queues `appointment_cancellation` (patient)
- Reminders: auto-scheduled 24h before appointment (deferred via `scheduled_at`)

#### Clinical Records & Inventory

- **Treatment records**: `treatment_records` + `treatment_record_items` tables
  - Admin creates treatment acts linking appointment → patient → doctor → services performed
  - Each item tracks service, tooth number, quantity, price at time of service
  - Status flow: draft → signed → completed
  - Payment tracking: unpaid, partial, paid, waived, refunded
  - Patient views own treatment history at `/cabinet/treatments` (RLS-protected)
  - Admin CRUD at `/admin/treatments` via `/api/treatment-records`
- **Materials catalog**: `materials` table + `material_inventory` for stock levels
  - Categories: composite, filling, instrument, implant, hygiene, anesthesia, other
  - Low-stock alerts when quantity < min_stock_level
  - Admin CRUD at `/admin/materials` via `/api/materials`
- **Material orders**: `material_orders` + `material_order_items`
  - Any staff/assistant can create orders
  - Status flow: draft → pending_approval → approved → ordered → delivered
  - Urgency levels: low, normal, high, critical
  - On delivery: inventory auto-updated
  - Admin/assistant UI at `/admin/orders` via `/api/material-orders`
- **Treatment materials used**: `treatment_materials_used` — tracks which materials were consumed per treatment, registered by assistant
- **Admin roles**: `admin_users.role` supports `superadmin`, `admin`, `staff`, `doctor`, `assistant`

#### Live Chat

- DB: `chat_sessions` + `chat_messages` tables with Supabase Realtime
- Admin: `useAdminChat` hook + `/admin/chat` page — session list, message history, unread badges
- Patient: `useLiveChat` hook + `LiveChat.tsx` widget — name prompt, auth check, optimistic sends

#### Testing Strategy

- Unit tests: Vitest + @testing-library/react (6 test files, 39 tests)
- Custom render wrapper in `src/test/test-utils.tsx`
- Import `screen`, `waitFor` etc. directly from `@testing-library/react`, not from test-utils
- E2E: Playwright (`e2e/` directory) — auth flows with mocked and live Supabase
- CI runs lint, typecheck, unit tests, and build (`.github/workflows/ci.yml`)

### Environment Variables

| Variable                          | Required  | Description                                                          |
| --------------------------------- | --------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`            | No        | Site URL (default: `https://dentalstory.com.ua`)                     |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | No        | GA4 measurement ID                                                   |
| `NEXT_PUBLIC_SUPABASE_URL`        | For auth  | Supabase project URL                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | For auth  | Supabase anon key                                                    |
| `UPSTASH_REDIS_REST_URL`          | For cache | Upstash Redis URL                                                    |
| `UPSTASH_REDIS_REST_TOKEN`        | For cache | Upstash Redis token                                                  |
| `SENTRY_AUTH_TOKEN`               | No        | For source map upload (skipped if missing)                           |
| `RESEND_API_KEY`                  | For email | Resend API key                                                       |
| `RESEND_FROM_EMAIL`               | No        | Sender address (default: `DentalStory <noreply@dentalstory.com.ua>`) |
| `ADMIN_NOTIFICATION_EMAIL`        | No        | Email for admin booking alerts                                       |
| `CRON_SECRET`                     | For cron  | Bearer token for `/api/cron/*` routes                                |
| `SUPABASE_SERVICE_ROLE_KEY`       | For cron  | Service role key for server-side Supabase calls                      |
