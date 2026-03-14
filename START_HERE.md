## 🚀 START HERE - Dental Story Quick Guide

Welcome to **Dental Story**! This is a production-ready dental clinic web application. Here's how to get started in 3 minutes.

---

## ⚡ Option 1: I Just Want to Run It (3 min)

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with these:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
UPSTASH_REDIS_REST_URL=https://your-redis
UPSTASH_REDIS_REST_TOKEN=your-token
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-key (optional)
TURNSTILE_SECRET_KEY=your-secret (optional)

# 3. Get a Supabase project:
# → Go to supabase.com, create project (free)
# → Settings → API → Copy keys above

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
```

That's it! The app is running locally. 🎉

---

## 📚 Choose Your Next Step

### 👨‍💻 I'm a Developer
→ Read: **QUICK_START.md** (complete setup guide)

### 🚀 I Want to Deploy  
→ Read: **DEPLOYMENT_GUIDE.md** (4 deployment options)

### 🧪 I Want to Test
→ Read: **TESTING_GUIDE.md** (manual & automated testing)

### 📖 I Want Full Documentation
→ Read: **README.md** (complete reference)

### 📋 I Want Project Overview
→ Read: **STATUS.md** (what's done & stats)

---

## 🎯 What Can You Do?

| Feature | Demo | Code |
|---------|------|------|
| **Book Appointment** | /booking | `src/components/BookingForm.tsx` |
| **User Dashboard** | /cabinet | `app/cabinet/page.tsx` |
| **Admin Stats** | /admin | `app/admin/page.tsx` |
| **Multi-language** | Click flag | `src/locales/` |
| **Contact Form** | /contact | `src/components/ContactForm.tsx` |
| **AI Chat** | Bottom right | `src/components/ChatWidget.tsx` |

---

## 🔧 Environment Setup Help

### Get Supabase Keys
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Settings → API
4. Copy `Project URL` and `anon key`

### Get Upstash Redis (for rate limiting)
1. Go to [upstash.com](https://upstash.com)
2. Create Redis database
3. Console → REST API
4. Copy REST URL and token

### (Optional) Get Cloudflare Turnstile
1. Go to [cloudflare.com](https://cloudflare.com)
2. Go to Turnstile
3. Create widget (CAPTCHA)
4. Copy site key and secret

---

## 🐛 Troubleshooting

### "Can't connect to database"
```bash
# Make sure .env.local has correct keys:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Then restart dev server
npm run dev
```

### "Appointments not saving"
1. Go to Supabase Dashboard
2. SQL Editor
3. Paste `scripts/init_database.sql`
4. Click "Run"

This creates tables in your database.

### "Booking button doesn't work"
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Share error in debugging

---

## 📝 Common Commands

```bash
npm run dev              # Start dev server (port 3000)
npm test                # Run tests
npm run typecheck       # Check for TypeScript errors
npm run build           # Build for production
npm start               # Run production build
npm run test:e2e       # Run E2E tests
```

---

## 🗂️ Important Files

```
dental-story/
├── app/page.tsx              ← Homepage
├── app/booking/page.tsx      ← Booking page
├── app/cabinet/page.tsx      ← User dashboard
├── app/admin/page.tsx        ← Admin dashboard
├── scripts/init_database.sql ← Database setup
├── src/components/           ← UI components (95+)
├── src/locales/              ← Translations (UK, EN, PL)
└── .env.local                ← Your config (create this)
```

---

## 🎓 Learning Path

**Day 1: Get Familiar**
1. Run locally: `npm run dev`
2. Explore pages: /, /booking, /about, /contact
3. Test booking form
4. Create account in /auth/sign-up

**Day 2: Understand Structure**
1. Read `QUICK_START.md`
2. Explore `src/components/`
3. Check `app/api/` routes
4. Review database schema

**Day 3: Deploy**
1. Follow `DEPLOYMENT_GUIDE.md`
2. Deploy to Vercel or Docker
3. Test in production
4. Monitor with Sentry

---

## 📞 Need Help?

| Question | Answer |
|----------|--------|
| How do I add a feature? | Edit components in `src/components/` or create API route in `app/api/` |
| How do I change colors? | Edit `src/styles/globals.css` - change CSS variables |
| How do I add language? | Copy `src/locales/en.json`, rename to `src/locales/xx.json`, translate |
| How do I add doctor? | In Supabase, run: `INSERT INTO doctors (first_name, last_name, specialization) VALUES (...)` |
| How do I add service? | In Supabase, run: `INSERT INTO services (name_uk, name_en, category, price_uah) VALUES (...)` |
| How do I debug? | Use DevTools (F12) or add `console.log("[v0] ...", variable)` in code |

---

## ✅ Pre-Launch Checklist

Before deploying to production:

- [ ] All `.env` variables set
- [ ] Database migrations ran: `scripts/init_database.sql`
- [ ] Tests pass: `npm test && npm run test:e2e`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Tested on mobile
- [ ] Lighthouse score 90+

---

## 🎉 You're Ready!

**Your next step:**

```bash
# Option A: Continue developing locally
npm run dev

# Option B: Deploy to production
# See DEPLOYMENT_GUIDE.md

# Option C: Run tests
npm test
```

---

## 📚 Documentation Map

| Document | Read When | Time |
|----------|-----------|------|
| **This file** | First | 3 min |
| **QUICK_START.md** | Before developing | 5 min |
| **README.md** | As reference | 10 min |
| **DEPLOYMENT_GUIDE.md** | Before deploying | 15 min |
| **TESTING_GUIDE.md** | When testing | 10 min |
| **STATUS.md** | To understand status | 5 min |

---

**Happy coding! 🚀**

---

### Quick Links

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com)
- [GitHub Issues](https://github.com)

### Support
- Email: support@dentalstory.ua
- GitHub Discussions: [Link]
- Discord: [Link]

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: March 14, 2024
