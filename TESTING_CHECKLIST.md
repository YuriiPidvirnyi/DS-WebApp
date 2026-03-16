# Dental Story - Functional Testing Checklist

## 1. HOMEPAGE & NAVIGATION
- [ ] Logo redirects to homepage
- [ ] Navigation menu links work correctly
- [ ] Language switcher (UK/EN/PL) changes UI language
- [ ] Dropdown menu closes on click outside
- [ ] Mobile menu opens/closes properly
- [ ] All hero section CTA buttons are clickable
- [ ] Footer links navigate correctly

## 2. BOOKING FLOW (Critical Path)
- [ ] Select service from dropdown populated from API
- [ ] Select doctor from dropdown (filtered by service)
- [ ] Date picker shows available dates
- [ ] Time slots update based on selected date
- [ ] Cooldown prevents double-submission
- [ ] Turnstile CAPTCHA appears and validates
- [ ] Error message if required fields empty
- [ ] Success message shows after booking
- [ ] Email confirmation is sent
- [ ] Appointment appears in `/cabinet` after login

## 3. AUTHENTICATION
- [ ] Sign up form validates email format
- [ ] Password requirements enforced
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials (error message shown)
- [ ] Session persists on page reload
- [ ] Logout clears session and redirects to home
- [ ] Protected routes redirect to login if not authenticated
- [ ] `/cabinet` requires authentication
- [ ] `/admin` requires admin role

## 4. CABINET (User Dashboard)
- [ ] User profile displays correctly
- [ ] Name, email, phone show correctly
- [ ] "My Appointments" tab shows user's bookings
- [ ] Appointment date/time/doctor display correctly
- [ ] Status badges show (pending, confirmed, completed)
- [ ] Can cancel upcoming appointments
- [ ] "Edit Profile" button opens edit form
- [ ] Profile updates save correctly

## 5. ADMIN DASHBOARD
- [ ] Total appointments counter updates
- [ ] Revenue chart displays correctly
- [ ] Appointments table shows upcoming bookings
- [ ] Popular services chart renders
- [ ] Quick actions (edit, approve, deny) work
- [ ] Search/filter appointments works
- [ ] Export to CSV works (if enabled)
- [ ] Admin pages require admin authentication

## 6. CONTACT FORM
- [ ] All fields required validation works
- [ ] Email format validation
- [ ] Submit button disabled while loading
- [ ] Success message appears after submission
- [ ] Form clears after successful submission
- [ ] Error handling for server errors

## 7. INTERNATIONALIZATION (i18n)
- [ ] All UI text updates when language changes
- [ ] Form labels translated
- [ ] Error messages translated
- [ ] Success messages translated
- [ ] Button text translated
- [ ] Page titles updated
- [ ] Locale persists in localStorage

## 8. ERROR HANDLING
- [ ] Network error shows user-friendly message
- [ ] 404 page displays for non-existent routes
- [ ] 500 error page shown for server errors
- [ ] Error boundary catches component crashes
- [ ] "Retry" button works on error pages
- [ ] Errors logged to Sentry (if configured)

## 9. ACCESSIBILITY
- [ ] Tab navigation works through interactive elements
- [ ] Screen reader can read all text
- [ ] ARIA labels present on buttons
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Keyboard can open/close dropdowns

## 10. PERFORMANCE
- [ ] Page loads within 3 seconds
- [ ] Smooth animations/transitions
- [ ] No console errors
- [ ] Images lazy load correctly
- [ ] No memory leaks in DevTools
- [ ] Dynamic imports working (admin dashboard loads on demand)

## 11. MOBILE RESPONSIVENESS
- [ ] Layout reflows correctly on mobile
- [ ] Touch targets are at least 44px
- [ ] Mobile menu visible and functional
- [ ] Forms are usable on small screens
- [ ] No horizontal scrolling
- [ ] Images scale properly

## 12. SECURITY
- [ ] CSRF token in forms
- [ ] Turnstile CAPTCHA prevents bot bookings
- [ ] Session doesn't expose sensitive data
- [ ] Passwords never logged
- [ ] XSS protection working
- [ ] SQL injection prevention (parameterized queries)

## 13. API ROUTES
- [ ] GET /api/doctors returns doctor list
- [ ] GET /api/services returns services list
- [ ] GET /api/appointments returns user appointments
- [ ] POST /api/appointments creates appointment
- [ ] POST /api/contacts submits contact form
- [ ] POST /api/reviews creates review
- [ ] Rate limiting prevents spam
- [ ] Invalid requests return proper error codes

## 14. DATABASE
- [ ] Records save correctly to Supabase
- [ ] RLS policies prevent unauthorized access
- [ ] Relationships work (doctor → appointments)
- [ ] Cascade delete works properly
- [ ] Indexes improve query performance

## 15. FLOATING BUTTONS
- [ ] ChatWidget button visible and functional
- [ ] AIAssistant button visible and functional
- [ ] AccessibilityPanel button visible and functional
- [ ] FloatingQuickActions panel works
- [ ] All buttons use correct dental design colors
- [ ] No overlap between buttons

## KNOWN ISSUES & NOTES

### Database
- [ ] Run `scripts/init_database.sql` in Supabase SQL Editor
- [ ] Verify all tables created
- [ ] Check RLS policies enabled
- [ ] Seed sample data loaded

### Environment Variables
- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] NEXT_PUBLIC_TURNSTILE_SITE_KEY set (if using)
- [ ] TURNSTILE_SECRET_KEY set (if using)
- [ ] UPSTASH_REDIS_REST_URL set (for rate limiting)
- [ ] UPSTASH_REDIS_REST_TOKEN set (for rate limiting)

### Testing Commands
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm start
```

## SIGN-OFF

- [ ] All critical functionality tested
- [ ] No blocking bugs found
- [ ] Performance acceptable
- [ ] Mobile responsive verified
- [ ] Security checks passed
- [ ] Ready for deployment

