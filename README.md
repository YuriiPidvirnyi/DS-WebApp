# Dental Story - Professional Dental Clinic WebApp

A modern, fully-featured website for a dental clinic (Dental Story) built with Next.js 16, React 19, Supabase, and Tailwind CSS.

## Features

### 🎯 Core Features

- **Online Appointment Booking** - Real-time doctor/service/time slot selection with Turnstile CAPTCHA
- **Patient Cabinet** - Personal account with appointment history and profile management
- **Admin Dashboard** - Analytics, appointment management, revenue tracking with Recharts
- **Multi-language Support** - Ukrainian, English, Polish (i18n with react-i18next)
- **Contact Forms** - Email submissions with backend processing and validation
- **Reviews System** - Patient reviews and ratings with verification
- **AI Assistant** - Chat support powered by AI SDK
- **Accessibility Panel** - Font size, contrast, language settings

### 🔒 Security

- Supabase authentication with Row Level Security (RLS)
- CSRF protection on all forms
- Turnstile CAPTCHA for bot prevention
- Rate limiting via Upstash Redis (proxy.ts)
- Secure session handling with HTTP-only cookies
- XSS protection and parameterized queries

### 🎨 Design & UX

- Responsive mobile-first design
- Accessible components (WCAG 2.1 AA)
- Smooth animations and transitions
- Dental-themed color system with design tokens
- Tailwind CSS with custom semantic tokens

### ⚡ Performance

- Next.js 16 with Turbopack bundler (default)
- Dynamic component imports for code splitting
- Image optimization with next/image
- Caching strategies (60-120s API cache, 1-year static)
- PWA support with offline capability

### 🧪 Testing

- Unit tests (Vitest + React Testing Library)
- E2E tests (Playwright)
- Accessibility audits (@axe-core/playwright, WCAG 2.1 AA)
- Error boundaries with Sentry integration

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn/bun
- Supabase account (free tier available)
- Upstash Redis (for rate limiting)
- Cloudflare Turnstile account (for CAPTCHA, optional)

## Installation

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd dental-story
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
bun install
```

### 3. Set Up Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# CAPTCHA (Cloudflare Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token
```

### 4. Set Up Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or use existing
3. Go to SQL Editor
4. Copy entire content of `scripts/init_database.sql`
5. Paste and click "Run" to execute migration

The repo also ships incremental schema changes in `supabase/migrations/` (30+ SQL files — RLS policies, audit logs, materials, treatments, payments, chat, etc.). Apply them in order after the initial script, or run the preprod seeding pipeline documented in [docs/DATA_SEEDING.md](docs/DATA_SEEDING.md).

Expected core tables created by `init_database.sql`:

- `doctors`, `services`, `appointments`, `reviews`, `working_hours`, `patients`, `contact_submissions`

Additional tables introduced by migrations include `admin_users` (RBAC), `materials` + `material_inventory` + `material_orders`, `treatment_records` + `treatment_record_items`, `notification_events`, `chat_sessions` + `chat_messages`, `admin_audit_logs`, and the payments tables. See [docs/DATABASE.md](docs/DATABASE.md) for the authoritative schema reference.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in browser.

## Project Structure

```
app/                   # Next.js App Router pages
├── layout.tsx         # Root layout (fonts, metadata, providers)
├── page.tsx           # Homepage → src/views/Home
├── api/               # API route handlers (public, authenticated, admin, cron, payments)
├── auth/              # Login, signup, password reset, email callback
├── booking/           # Multi-step booking flow
├── cabinet/           # Patient portal (appointments, profile, treatments, payments)
├── admin/             # Admin dashboard (14 sub-pages — analytics, patients, doctors,
│                      #  services, appointments, materials, orders, treatments, users,
│                      #  reviews, contacts, chat, email-templates, settings)
├── symptom-checker/   # AI symptom checker
└── ...                # about, contact, gallery, reviews, services, privacy, terms

src/
├── components/        # UI primitives, booking steps, admin widgets, providers
├── views/             # Page-level view components (imported by app/ pages)
├── hooks/             # Custom React hooks (useBookingForm, useLiveChat, ...)
├── lib/               # Supabase (client/server/middleware), Redis, email, security
├── services/          # Client-side API services
├── locales/           # i18n translations (uk, en, pl — ~3000 keys each)
├── styles/            # globals.css (Tailwind + design tokens)
├── types/             # TypeScript types
└── utils/             # Utility functions

e2e/                   # Playwright specs (auth, booking, admin, smoke, a11y)
supabase/migrations/   # Database migrations (30+ SQL files)
scripts/               # a11y audit, seeding pipeline, helpers
proxy.ts               # Edge middleware (CSP + nonce, rate limit, auth, security headers)
```

> Authoritative architecture, routes, and runtime behavior live in [CLAUDE.md](CLAUDE.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). This tree is a snapshot.

## API Endpoints

### Public Endpoints

- `GET /api/doctors` - List active doctors
- `GET /api/services` - List active services
- `GET /api/appointments/slots` - Available time slots (CliniCards + fallback)
- `POST /api/contacts` - Submit contact form
- `POST /api/reviews` - Submit review
- `POST /api/newsletter` - Subscribe to newsletter
- `POST /api/feedback/form` - Micro-feedback submission
- `GET /api/health` - Health check
- `POST /api/turnstile/verify` - CAPTCHA verification

### Authenticated Endpoints

- `GET/POST /api/appointments` - List own / create appointment
- `PATCH/DELETE /api/appointments/[id]` - Update / cancel appointment
- `GET /api/appointments/[id]/summary` - Appointment summary
- `POST /api/appointments/[id]/reminder-preference` - Set reminder preference
- `POST /api/ai/chat` - AI chat assistant
- `GET /api/ai/recommendations` - Smart recommendations

### Admin Endpoints (requires admin_users membership)

- `GET /api/admin/analytics` - Dashboard analytics
- `GET/POST /api/materials` - Materials CRUD
- `PATCH/DELETE /api/materials/[id]` - Material management
- `GET/POST /api/material-orders` - Order management
- `PATCH /api/material-orders/[id]` - Order status updates
- `GET/POST /api/treatment-records` - Treatment records CRUD
- `PATCH /api/treatment-records/[id]` - Treatment record updates

### Cron Endpoints (requires CRON_SECRET)

- `POST /api/cron/notifications` - Process notification queue (every 5 min)
- `POST /api/cron/reminders` - Schedule appointment reminders (daily 18:00 UTC)

## Configuration

### Design System

Edit `src/styles/globals.css` to customize colors:

```css
:root {
  --color-primary-600: hsl(172, 71%, 44%); /* Dental teal */
  --color-secondary-50: hsl(0, 0%, 98%); /* Light background */
  --color-dark: hsl(0, 0%, 17%); /* Text color */
  --color-muted: hsl(0, 0%, 47%); /* Secondary text */
}
```

All components use semantic tokens: `dental-primary-*`, `dental-secondary-*`, `dental-dark`, `dental-muted`, `dental-success`, `dental-error`, `dental-warning`.

### Localization

Edit `src/i18n/config.ts`:

```typescript
export const config = {
  defaultLanguage: 'uk',
  supportedLanguages: ['uk', 'en', 'pl'],
  fallbackLanguage: 'en',
}
```

Add new language by:

1. Creating `src/locales/xx.json`
2. Adding to `supportedLanguages` array

## Testing

```bash
npm run test              # Unit tests (Vitest)
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:e2e:auth     # E2E auth flows (mocked Supabase)
npm run test:e2e:ui-smoke # UI smoke tests (Select, language)
npm run a11y:audit        # Accessibility audit (10 routes, axe-core)
npm run typecheck         # TypeScript type checking
npm run lint              # ESLint
npm run format:check      # Prettier check
```

## Building & Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

### Deploy to Other Platforms

**Netlify:**

```bash
netlify deploy --prod
```

**Docker:**

```bash
docker build -t dental-story .
docker run -p 3000:3000 dental-story
```

**Railway/Render:**

- Connect GitHub repo
- Set environment variables
- Auto-deploy on push

## Key Technologies

| Tech           | Purpose                      |
| -------------- | ---------------------------- |
| Next.js 16     | Framework with App Router    |
| React 19       | UI library                   |
| TypeScript     | Type safety                  |
| Tailwind CSS 3 | Styling with design tokens   |
| Supabase       | Backend, database, auth, RLS |
| Upstash Redis  | Rate limiting, caching       |
| Recharts       | Data visualization           |
| react-i18next  | Multi-language support       |
| Zod            | Form validation              |
| Sentry         | Error tracking (optional)    |
| Playwright     | E2E testing                  |
| Vitest         | Unit testing                 |
| Resend         | Transactional emails         |
| AI SDK         | AI chat and recommendations  |

## Monitoring & Analytics

### Error Tracking (Sentry)

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

Errors auto-reported. Dashboard at sentry.io.

### Performance Monitoring

- Vercel Analytics + Speed Insights
- Web Vitals tracking via `web-vitals`

### Database Performance

- Monitor slow queries in Supabase Dashboard
- Check RLS policy performance
- Verify indexes are used

## Security Checklist

- [x] HTTPS enforced in production
- [x] Environment variables secured (.env.local never committed)
- [x] Database RLS policies active
- [x] CSRF protection enabled (proxy.ts)
- [x] CAPTCHA prevents automated bookings
- [x] Rate limiting prevents abuse (Upstash)
- [x] Passwords hashed by Supabase
- [x] Sessions HTTP-only cookies
- [x] SQL injection prevented (parameterized queries)
- [x] XSS protection enabled

## Performance Tips

1. **CDN** - Use Vercel Edge Network for static assets
2. **Compression** - Enabled by default (Gzip, Brotli)
3. **Images** - All images use next/image with lazy loading
4. **Caching** - API responses cached 60-120 seconds
5. **Bundle** - Use `npm run build -- --analyze` to check bundle size
6. **Monitoring** - Set up Sentry for performance tracking

## Troubleshooting

### Database Connection Fails

```
Error: Failed to fetch from Supabase
```

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is active in Dashboard
- Ensure `scripts/init_database.sql` was executed

### Appointments Not Saving

```
Error: row-level security policy blocked
```

- Check RLS policies in Supabase
- Verify user is authenticated
- Check browser DevTools Network tab for response

### Language Not Switching

```
i18n: failed to load locale
```

- Verify locale files exist in `src/locales/`
- Check localStorage for `i18nextLng`
- Clear browser cache and reload

### Rate Limiting Errors

```
Error: Too many requests
```

- Check UPSTASH_REDIS_REST_TOKEN is correct
- Verify Upstash project is active
- Check IP is not banned in rate limiting rules

### Turnstile CAPTCHA Not Showing

```
Turnstile widget failed to load
```

- Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
- Check Cloudflare Turnstile status
- Clear browser cache

## Development Tips

### Enable Debug Logging

```typescript
// In any file
console.log('[v0] Debug message:', variable)
```

### Test Email Locally

Use Supabase auth emails in development. In production, connect SMTP.

### Mock API Responses

Create `.mocks/` directory with MSW (Mock Service Worker) setup.

### Performance Profiling

```bash
npm run build -- --debug
```

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and test locally
3. Commit with clear message: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📧 Email: support@dentalstory.ua
- 📞 Phone: +380 67 123 45 67
- 🌐 Website: https://dentalstory.ua
- 💬 Chat: Available on website (AI Assistant)

---

**Version**: see [package.json](package.json) and [CHANGELOG.md](CHANGELOG.md)  
**Roadmap**: [docs/ROADMAP.md](docs/ROADMAP.md)  
**Maintained by**: Dental Story Development Team

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, data flow, infrastructure
- [docs/ROADMAP.md](docs/ROADMAP.md) — Phased delivery plan and upcoming work
- [docs/RUNBOOKS.md](docs/RUNBOOKS.md) — Deployment, DNS swing, rollback, incident response
- [docs/STATUS.md](docs/STATUS.md) — Current phase progress and open blockers
