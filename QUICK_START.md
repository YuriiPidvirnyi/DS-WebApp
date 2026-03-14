## Dental Story - Quick Start Guide (5 minutes)

### ⚡ Fast Setup

#### 1. Clone & Install (1 min)
```bash
git clone <your-repo>
cd dental-story
npm install
```

#### 2. Create `.env.local` (1 min)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-token
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key
```

#### 3. Set Up Database (2 min)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project (free tier)
3. Go to SQL Editor
4. Open file: `scripts/init_database.sql`
5. Copy → Paste → Run

#### 4. Start Dev Server (1 min)
```bash
npm run dev
```
Open http://localhost:3000 ✓

---

## What You Get

| Feature | Status |
|---------|--------|
| 📅 **Booking System** | ✓ Full multi-step form with calendar |
| 👤 **User Cabinet** | ✓ Personal appointments dashboard |
| 🎛️ **Admin Dashboard** | ✓ Analytics & appointment management |
| 🌐 **Multi-language** | ✓ Ukrainian, English, Polish |
| 🔒 **Auth** | ✓ Supabase with RLS policies |
| 💬 **AI Chat** | ✓ Chat widget with AI responses |
| ♿ **Accessibility** | ✓ Accessibility panel with font/contrast |
| 📱 **Mobile** | ✓ Fully responsive design |
| 🧪 **Tests** | ✓ 1450+ lines of unit & E2E tests |

---

## First Steps

### 1. Test Booking (Without Login)
1. Go to http://localhost:3000/booking
2. Select service, doctor, date, time
3. Click "Запис на прийом"
4. Complete CAPTCHA (if enabled)

✓ Appointment saved to database

### 2. Create User Account
1. Click "Вхід/Sign Up" in header
2. Enter email & password
3. Click "Sign Up"

✓ Account created in Supabase

### 3. View Appointments
1. Click "Особистий кабінет" (Cabinet) in header
2. See your appointments list
3. Click appointment to reschedule/cancel

✓ RLS policies ensure you only see your appointments

### 4. Access Admin Dashboard
1. Add admin role to your user in Supabase:
   - Go to SQL Editor
   - Run: `UPDATE auth.users SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"admin"') WHERE email = 'your@email.com'`
2. Go to http://localhost:3000/admin
3. See stats, charts, appointments

✓ Admin dashboard with analytics

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage |
| `app/booking/page.tsx` | Booking page |
| `app/cabinet/page.tsx` | User dashboard |
| `app/admin/page.tsx` | Admin dashboard |
| `src/components/BookingForm.tsx` | Multi-step booking |
| `src/components/ContactForm.tsx` | Contact form |
| `app/api/appointments/route.ts` | API: create appointment |
| `src/locales/uk.json` | Ukrainian translations |
| `scripts/init_database.sql` | Database schema |
| `proxy.ts` | Middleware (rate limit, CSP) |

---

## Common Tasks

### Change Language
```typescript
// In any page/component
import { useTranslation } from 'react-i18next'

export default function MyComponent() {
  const { t } = useTranslation()
  
  return <h1>{t('booking.title')}</h1>
}
```

### Add New Doctor
```sql
-- In Supabase SQL Editor
INSERT INTO doctors (first_name, last_name, specialization)
VALUES ('Іван', 'Сидоренко', 'Терапевт');
```

### Add New Service
```sql
INSERT INTO services (name_uk, name_en, category, duration_minutes, price_uah)
VALUES ('Отбілювання зубів', 'Teeth Whitening', 'treatment', 60, 1200);
```

### Test Email
Check database:
```sql
SELECT email, created_at FROM auth.users;
SELECT * FROM contact_submissions;
```

### Run Tests
```bash
npm test                    # Unit tests
npm run test:e2e           # End-to-end tests
npm run typecheck          # Type errors
```

---

## Environment Variables (Required)

| Variable | Where to Get |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → API Keys |
| `UPSTASH_REDIS_REST_URL` | Upstash Console → Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Redis → Token |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → Site Keys |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile → Site Keys |

**How to Get Supabase Keys:**
1. Create project at supabase.com (free tier)
2. Project Settings → API
3. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Troubleshooting

### "Can't connect to database"
```bash
# Check env vars
echo $NEXT_PUBLIC_SUPABASE_URL

# Or edit .env.local and restart
npm run dev
```

### "Booking button doesn't work"
1. Check console (F12) for errors
2. Verify `scripts/init_database.sql` ran
3. Check Supabase RLS policies enabled

### "Admin dashboard 403 error"
1. Add admin role: See "Key Files to Know" section
2. Refresh page
3. Clear browser cache

### "Language not changing"
1. Clear browser localStorage: `localStorage.clear()`
2. Refresh page
3. Try different language

---

## Next: Deploy to Production

When ready to launch:

```bash
# 1. Build locally
npm run build

# 2. Push to GitHub
git push

# 3. Vercel auto-deploys
# → Check https://vercel.com/dashboard

# Or deploy manually
npm i -g vercel
vercel --prod
```

See `DEPLOYMENT_GUIDE.md` for detailed steps.

---

## Useful Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm test                 # Run unit tests
npm run test:e2e        # Run E2E tests
npm run typecheck       # Check TypeScript
npm run lint            # Run linter
npm run lint:fix        # Fix linting issues
npm run format          # Format code
npm run analyze         # Analyze bundle size
```

---

## Need Help?

1. **Check Docs**: `README.md`, `DEPLOYMENT_GUIDE.md`, `TESTING_CHECKLIST.md`
2. **Read Code**: Most features in `src/components/` are well-commented
3. **Debug**: Use `console.log("[v0] ...")` in code
4. **Error Logs**: Check browser DevTools (F12) → Console, Network tabs

---

## What to Build Next?

- [ ] Add payment integration (Stripe)
- [ ] Email notifications on appointment
- [ ] SMS reminders
- [ ] Video consultations
- [ ] Patient feedback surveys
- [ ] Advanced reporting

See `IMPLEMENTATION_PHASES_COMPLETE.md` for what's already done.

---

**Happy coding! 🚀**
