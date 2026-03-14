# Testing Guide - Dental Story

## Quick Test Commands

```bash
# Run all unit tests
npm test

# Run specific test
npm test BookingForm

# Run E2E tests
npm run test:e2e

# View coverage
npm test -- --coverage

# Type checking
npm run typecheck
```

## Manual Testing Checklist

### Homepage (/)
- [ ] Logo visible and clickable
- [ ] Navigation menu works
- [ ] Language switcher shows 3 languages
- [ ] Hero section displays correctly
- [ ] "Записатися" button in hero works
- [ ] Services section shows cards
- [ ] Footer displays all links

### Booking Page (/booking)
- [ ] Page loads
- [ ] Service dropdown populated
- [ ] Doctor dropdown populated
- [ ] Date picker works
- [ ] Time slots appear
- [ ] Can select slot
- [ ] Turnstile CAPTCHA appears (if enabled)
- [ ] "Запис" button works
- [ ] Success message shows
- [ ] Appointment in database

### Authentication (/auth/login, /auth/sign-up)
- [ ] Sign up creates account
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Session persists on reload
- [ ] Logout clears session

### Cabinet (/cabinet)
- [ ] Requires login
- [ ] Shows user appointments
- [ ] Displays personal profile
- [ ] Can edit profile
- [ ] Can cancel appointment

### Admin Dashboard (/admin)
- [ ] Requires admin role
- [ ] Shows stats cards
- [ ] Charts render
- [ ] Appointments table displays
- [ ] Quick actions work

### Error Pages
- [ ] Go to /nonexistent
- [ ] Should show 404 page
- [ ] "Go back" button works

### API Testing

Using curl or Postman:

```bash
# Get doctors
curl http://localhost:3000/api/doctors

# Get services
curl http://localhost:3000/api/services

# Create appointment (requires auth)
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"doctor_id":"uuid","service_id":"uuid",...}'

# Get user appointments (requires auth)
curl http://localhost:3000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Testing

```bash
# Lighthouse audit
npm run lighthouse

# Expected scores:
# Performance: >= 90
# Accessibility: >= 95
# Best Practices: >= 90
# SEO: >= 90
```

## Security Testing

### CSRF Protection
- [ ] Contact form has CSRF token
- [ ] Booking form has CSRF token
- [ ] POST requests require token

### XSS Prevention
- [ ] Try `<script>alert('xss')</script>` in forms
- [ ] Should be escaped, not executed
- [ ] Check browser console - no errors

### SQL Injection
- [ ] Try `' OR '1'='1` in search/filter
- [ ] Should not bypass validation
- [ ] Query should fail safely

### Rate Limiting
- [ ] Submit form 11 times rapidly
- [ ] 11th request should be rate limited
- [ ] Error message "Too many requests"

## Mobile Testing

Use Chrome DevTools mobile emulation:

1. Press F12
2. Click device icon (top-left)
3. Test on iPhone 12, Pixel 5

- [ ] Layout responsive
- [ ] Touch targets >= 44px
- [ ] No horizontal scroll
- [ ] Forms usable

## Accessibility Testing

Using browser DevTools:

1. Press F12
2. Go to Lighthouse
3. Run accessibility audit

Expected:
- [ ] Score >= 95
- [ ] No contrast issues
- [ ] All buttons have labels
- [ ] Links descriptive

### Keyboard Navigation
- [ ] Can tab through form
- [ ] Can submit with Enter
- [ ] Focus visible
- [ ] Can open dropdowns

### Screen Reader
Using NVDA or JAWS:
- [ ] Page title announced
- [ ] Buttons announced
- [ ] Form labels announced
- [ ] Images have alt text

## Database Testing

In Supabase SQL Editor:

```sql
-- Check doctors table
SELECT COUNT(*) FROM doctors WHERE is_active = true;

-- Check services
SELECT COUNT(*) FROM services WHERE is_active = true;

-- Check appointments (yours)
SELECT * FROM appointments 
WHERE patient_id = (SELECT id FROM auth.users() LIMIT 1);

-- Check RLS policies working
SELECT * FROM appointments; -- Should fail if not authenticated
```

## E2E Test Scenarios

### Booking Flow
1. Go to /booking
2. Select service (e.g., "Консультація")
3. Select doctor
4. Pick date 5 days from now
5. Select time slot 14:00
6. Click "Запис"
7. Complete CAPTCHA
8. Verify success message
9. Verify in database

### Admin Workflow
1. Login as admin
2. Go to /admin
3. Verify stats load
4. Check charts render
5. View appointments table
6. Click appointment
7. Update status
8. Verify change saved

### Language Switching
1. On any page
2. Click language selector
3. Choose "English"
4. Verify page translated
5. Check localStorage has `i18nextLng: 'en'`
6. Reload page
7. Verify still English

## Load Testing

Using Apache Bench:

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3000/

# Expected: < 1 second avg response
```

## Regression Testing

After any change:

```bash
# Run all tests
npm test
npm run test:e2e
npm run typecheck

# Manual smoke test
npm run dev
# Visit: /, /booking, /cabinet (after login), /admin
```

## Common Issues During Testing

### CAPTCHA fails
- [ ] Verify NEXT_PUBLIC_TURNSTILE_SITE_KEY set
- [ ] Check Cloudflare Turnstile status
- [ ] Try incognito mode

### Database queries fail
- [ ] Verify NEXT_PUBLIC_SUPABASE_URL set
- [ ] Check Supabase project status (green icon)
- [ ] Verify RLS policies

### Language not switching
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Hard refresh: Ctrl+Shift+R
- [ ] Check console for i18n errors

### Admin dashboard shows 403
- [ ] Add admin role in Supabase:
  ```sql
  UPDATE auth.users 
  SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"admin"') 
  WHERE email = 'your@email.com';
  ```
- [ ] Logout and login again

## Test Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Unit Tests | 80%+ | ✓ |
| E2E Tests | Critical paths | ✓ |
| Integration | API + DB | ✓ |
| Performance | Lighthouse 90+ | ✓ |
| Security | OWASP Top 10 | ✓ |
| Accessibility | WCAG AA | ✓ |

---

**Happy Testing! 🧪**
