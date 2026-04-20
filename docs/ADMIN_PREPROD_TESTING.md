# Admin Preprod Testing Guide

Testing guide for the DentalStory admin panel on the preprod (staging) environment.
Covers seeding, accounts for all roles, data clearing, access matrix, and real test flows.

---

## Prerequisites

1. A `.env.local` with preprod credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<preprod-project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
2. Node.js 22+ and `npm ci --legacy-peer-deps` already run.
3. For git worktrees: run `npm run link-env` first to symlink `.env.local`.

> The seed system refuses to run against the production URL. If `NEXT_PUBLIC_SUPABASE_URL` matches `dentalstory.com.ua`, it aborts.

---

## Seeding Test Data

### Full seed (first time or after full reset)

```bash
npm run seed:preprod
```

Runs all 12 modules in dependency order. Creates doctors, services, 9 admin accounts, 25 UA patients, 180 appointments spread over ±8 months, 40 treatment records, 30 materials, 15 orders, 20 chat sessions, 35 reviews, and notification events. Idempotent — safe to re-run.

### Refresh transactional data only (keep patients/admins)

```bash
npm run seed:preprod:wipe
```

Deletes appointments, treatments, orders, chat, reviews, notifications — then re-seeds them. Patient and admin accounts are preserved.

### Seed EN + PL patient accounts

```bash
node scripts/seed-i18n-test-patients.mjs
```

Creates 10 English-named and 10 Polish-named patients as full auth users with patient records. Used to test multilingual scenarios (patient names, addresses, notes in Latin script).

### Partial seed (specific modules)

```bash
npx tsx scripts/seed/preprod/index.ts --only=chat,reviews
```

Available module names: `doctors`, `services`, `admins`, `patients`, `appointments`, `treatments`, `materials`, `orders`, `chat`, `reviews`, `notifications`.

---

## Admin Credentials

All admin accounts use password: **`PreprodTest!2026`**

| Email                              | Role              | What they can do                                                                          |
| ---------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `seed.superadmin@dentalstory.ua`   | superadmin        | Everything — user management, all settings, all data                                      |
| `seed.admin@dentalstory.ua`        | admin             | Everything except user management and patient deletion                                    |
| `seed.receptionist@dentalstory.ua` | receptionist      | Appointments (full), patients (view/edit), chat                                           |
| `seed.doctor1@dentalstory.ua`      | doctor            | Own appointments only, own patients/treatments, inventory view, orders                    |
| `seed.doctor2@dentalstory.ua`      | doctor            | Same as doctor1 (linked to different specialization)                                      |
| `seed.assistant@dentalstory.ua`    | assistant         | All appointments (view), patients (view), treatments (draft), inventory, orders           |
| `seed.billing@dentalstory.ua`      | billing_manager   | Analytics, all appointments/patients/treatments (read-only), orders/inventory (read-only) |
| `seed.inventory@dentalstory.ua`    | inventory_manager | Inventory (edit), orders (create), chat                                                   |
| `seed.analyst@dentalstory.ua`      | analyst           | Analytics, all clinical data (read-only), chat                                            |

Login URL: `https://<preprod-domain>/admin/login`

---

## Patient Credentials

### Ukrainian patients (25 accounts)

Seeded by the preprod system. Emails follow the pattern `<firstname>.<lastname>@preprod.dentalstory.ua` (all lowercase, no diacritics). Password: **`Patient!2026`**

To see exact emails, run:

```sql
select email from auth.users where email like '%preprod.dentalstory.ua' limit 30;
```

### English patients (10 accounts)

Password: **`PatientTest!2026`**

| Email                                 | Name             |
| ------------------------------------- | ---------------- |
| `en-patient01@preprod.dentalstory.ua` | Emma Thompson    |
| `en-patient02@preprod.dentalstory.ua` | James Wilson     |
| `en-patient03@preprod.dentalstory.ua` | Sophie Clarke    |
| `en-patient04@preprod.dentalstory.ua` | Oliver Bennett   |
| `en-patient05@preprod.dentalstory.ua` | Charlotte Davies |
| `en-patient06@preprod.dentalstory.ua` | Harry Morrison   |
| `en-patient07@preprod.dentalstory.ua` | Grace Anderson   |
| `en-patient08@preprod.dentalstory.ua` | Liam Turner      |
| `en-patient09@preprod.dentalstory.ua` | Amelia Hughes    |
| `en-patient10@preprod.dentalstory.ua` | Noah Walker      |

### Polish patients (10 accounts)

Password: **`PatientTest!2026`**

| Email                                 | Name                 |
| ------------------------------------- | -------------------- |
| `pl-patient01@preprod.dentalstory.ua` | Katarzyna Wiśniewska |
| `pl-patient02@preprod.dentalstory.ua` | Piotr Kowalczyk      |
| `pl-patient03@preprod.dentalstory.ua` | Magdalena Nowak      |
| `pl-patient04@preprod.dentalstory.ua` | Tomasz Zieliński     |
| `pl-patient05@preprod.dentalstory.ua` | Anna Wróbel          |
| `pl-patient06@preprod.dentalstory.ua` | Marek Jabłoński      |
| `pl-patient07@preprod.dentalstory.ua` | Agnieszka Krawczyk   |
| `pl-patient08@preprod.dentalstory.ua` | Krzysztof Dąbrowski  |
| `pl-patient09@preprod.dentalstory.ua` | Monika Pawlak        |
| `pl-patient10@preprod.dentalstory.ua` | Rafał Woźniak        |

---

## Role Access Matrix

✅ = full access · 👁 = read-only · 🔒 = blocked (redirected)

| Page                  | superadmin | admin | receptionist |  doctor   | assistant | billing | inventory | analyst |
| --------------------- | :--------: | :---: | :----------: | :-------: | :-------: | :-----: | :-------: | :-----: |
| `/admin` (dashboard)  |     ✅     |  ✅   |      ✅      |    ✅     |    ✅     |   ✅    |    ✅     |   ✅    |
| `/admin/appointments` |     ✅     |  ✅   |      ✅      |  👁 own   |    ✅     |   👁    |    🔒     |   👁    |
| `/admin/patients`     |     ✅     |  ✅   |      ✅      |    👁     |    👁     |   👁    |    🔒     |   👁    |
| `/admin/treatments`   |     ✅     |  ✅   |      👁      |  👁 own   | 👁 draft  |   👁    |    🔒     |   👁    |
| `/admin/materials`    |     ✅     |  ✅   |      🔒      |    👁     |    👁     |   👁    |    ✅     |   👁    |
| `/admin/orders`       |     ✅     |  ✅   |      🔒      | ✅ create | ✅ create |   👁    | ✅ create |   👁    |
| `/admin/analytics`    |     ✅     |  ✅   |      🔒      |    🔒     |    🔒     |   ✅    |    🔒     |   ✅    |
| `/admin/data-quality` |     ✅     |  ✅   |      🔒      |    🔒     |    🔒     |   ✅    |    🔒     |   ✅    |
| `/admin/chat`         |     ✅     |  ✅   |      ✅      |    ✅     |    ✅     |   ✅    |    ✅     |   ✅    |
| `/admin/contacts`     |     ✅     |  ✅   |      ✅      |    🔒     |    ✅     |   🔒    |    🔒     |   🔒    |
| `/admin/reviews`      |     ✅     |  ✅   |      🔒      |    🔒     |    🔒     |   🔒    |    🔒     |   🔒    |
| `/admin/services`     |     ✅     |  ✅   |      🔒      |    🔒     |    🔒     |   🔒    |    🔒     |   🔒    |
| `/admin/doctors`      |     ✅     |  ✅   |      🔒      |    🔒     |    🔒     |   🔒    |    🔒     |   🔒    |
| `/admin/settings`     |     ✅     |  ✅   |      🔒      |    🔒     |    🔒     |   🔒    |    🔒     |   🔒    |
| `/admin/users`        |     ✅     |  🔒   |      🔒      |    🔒     |    🔒     |   🔒    |    🔒     |   🔒    |
| `/admin/health`       |     ✅     |  ✅   |      🔒      |    🔒     |    🔒     |   🔒    |    🔒     |   🔒    |

---

## Test Flows by Page

### Dashboard `/admin`

**Test with:** any role

1. Log in → confirm redirect to `/admin`.
2. Verify KPI cards render (appointments today, active patients, revenue).
3. Confirm onboarding tour shows on first login (`localStorage` key `ds_admin_tour_done` absent). Complete all 5 steps.
4. Reload → confirm tour does not re-appear.
5. As `billing_manager` or `analyst`: navigate directly to `/admin/users` → confirm redirect to `/admin` (access denied).

---

### Appointments `/admin/appointments`

**Test with:** `seed.receptionist` (full access), `seed.doctor1` (own-only), `seed.analyst` (blocked)

**As receptionist:**

1. Open appointments list — confirm seeded appointments appear with patient names, dates, statuses.
2. Filter by date range (past week) — list narrows.
3. Click an appointment → edit modal opens → change status to `confirmed` → save.
4. Create new appointment: pick a patient from list, pick a service, pick a doctor, pick a date/time → confirm saves.
5. Cancel an appointment → status becomes `cancelled`.

**As doctor (doctor1):**

1. Open appointments list — confirm only appointments where `doctor_id` matches this doctor are visible.
2. Attempt to navigate to another doctor's patient directly — should not appear in list.
3. Edit / cancel buttons should be absent (doctor lacks `appointments:edit` and `appointments:cancel`).

**As analyst:**

1. Navigate to `/admin/appointments` → confirm visible (analyst has `appointments:view_all`).
2. Confirm no create/edit/cancel actions are available.

---

### Patients `/admin/patients`

**Test with:** `seed.admin` (full), `seed.doctor1` (view only), `seed.inventory` (blocked)

**As admin:**

1. Search for "Emma Thompson" (EN patient) — confirm found.
2. Search for "Katarzyna" (PL patient) — confirm found.
3. Open patient record → verify all fields populated (phone, DOB, address, medical notes).
4. Edit patient → change address → save → confirm persisted.
5. Delete a patient: confirm confirmation dialog appears; cancel deletion (do not permanently delete seeded data).

**As doctor:**

1. Open patients list — all patients visible (doctor has `patients:view`).
2. Confirm edit/delete buttons are absent.

**As inventory_manager:**

1. Navigate to `/admin/patients` → confirm redirect (no `patients:view` permission).

---

### Treatments `/admin/treatments`

**Test with:** `seed.admin` (full), `seed.doctor1` (own + draft), `seed.receptionist` (view all, no create)

**As admin:**

1. List shows treatment records with status badges (draft, signed, completed).
2. Open a draft record → confirm items listed with service name, tooth number, price.
3. Change status to `signed` → confirm status updates.
4. Create new treatment record: link to an existing appointment → add a service item → save as draft.

**As doctor1:**

1. List shows only own patients' treatments (doctor scope enforced at DB level via RLS).
2. Open a draft record → edit items → save.
3. Sign a record (has `treatments:sign`).
4. Try to open a treatment for a patient not in their scope — should not appear in list.

**As receptionist:**

1. List visible (has `treatments:view_all`).
2. No create/edit/sign buttons visible.

---

### Materials `/admin/materials`

**Test with:** `seed.inventory` (full), `seed.doctor1` (view only), `seed.receptionist` (blocked)

**As inventory_manager:**

1. List shows 30 seeded materials with category, stock quantity, unit.
2. Filter by category (e.g., `composite`) — list narrows.
3. Edit a material → change `min_stock_level` → save.
4. Confirm low-stock badge appears for items below `min_stock_level`.
5. Create a new material → fill all fields → save → appears in list.

**As doctor:**

1. List visible (has `inventory:view`). Edit button absent.

**As receptionist:**

1. Navigate to `/admin/materials` → redirected (no `inventory:view`).

---

### Material Orders `/admin/orders`

**Test with:** `seed.assistant` (create), `seed.admin` (approve/delete), `seed.billing` (view only)

**As assistant:**

1. List shows seeded orders with status, urgency, supplier.
2. Create new order: add 2–3 items from materials catalog, set urgency `high` → submit.
3. Confirm status is `pending_approval`.
4. Approve button absent (assistant lacks `orders:approve`).

**As admin:**

1. Find the pending order created above.
2. Approve it → status changes to `approved`.
3. Mark as `delivered` → confirm inventory quantities updated (check `/admin/materials`).
4. Delete an order → confirm removed from list.

**As billing_manager:**

1. List visible (has `orders:view`). No create/approve/delete actions.

---

### Analytics `/admin/analytics`

**Test with:** `seed.billing` (full access), `seed.receptionist` (blocked)

**As billing_manager:**

1. Page loads with revenue charts, appointment counts, patient growth.
2. Change date range filter → charts update.
3. Export report button (if present) → confirm works or graceful error.

**As receptionist:**

1. Navigate to `/admin/analytics` → confirm redirect.

---

### Data Quality `/admin/data-quality`

**Test with:** `seed.analyst`

1. Page loads QA audit results.
2. Check for records flagged with missing data (phone, DOB).
3. Confirm export/download works.

---

### Live Chat `/admin/chat`

**Test with:** `seed.receptionist`

**Setup:** In a separate browser / incognito session, log in as a patient (e.g., `en-patient01@preprod.dentalstory.ua`). Open the chat widget on the public site (`/`).

1. Patient sends a message. Admin chat page shows unread badge.
2. Open the session in admin → read the message.
3. Type a reply → send → confirm appears in both admin and patient views in real time.
4. Mark session as resolved.

---

### Contact Submissions `/admin/contacts`

**Test with:** `seed.receptionist`

1. Submit a contact form on the public site (`/contact`) with a test name/email/message.
2. Open `/admin/contacts` → confirm submission appears.
3. Mark as reviewed.

**Access check:** Log in as `seed.doctor1` → navigate to `/admin/contacts` → confirm redirect (doctor lacks `appointments:view_all`).

---

### Reviews `/admin/reviews`

**Test with:** `seed.admin`

1. List shows seeded reviews (UA + EN + PL authors).
2. Toggle review visibility (publish/unpublish).
3. Delete a review → confirm removed.
4. Log in as `seed.receptionist` → navigate to `/admin/reviews` → confirm redirect.

---

### Services `/admin/services`

**Test with:** `seed.admin`

1. List shows seeded services with prices.
2. Edit a service → change price → save.
3. Create new service → fill in name, category, duration, price → save.
4. Deactivate a service → confirm hidden from booking page.

---

### Doctors `/admin/doctors`

**Test with:** `seed.superadmin`

1. List shows seeded doctors with specializations.
2. Edit a doctor's bio/photo URL.
3. Add a new doctor profile.

---

### Settings `/admin/settings`

**Test with:** `seed.admin` (edit), `seed.superadmin` (edit)

1. Clinic info fields populated.
2. Change working hours → save → confirm persisted.
3. Log in as `seed.receptionist` → navigate to `/admin/settings` → confirm redirect.

---

### User Management `/admin/users`

**Test with:** `seed.superadmin` only

1. List shows all 9 seeded admin accounts with role badges.
2. Edit a user's role (e.g., change `seed.analyst` to `billing_manager`) → save.
3. Deactivate a user → confirm they can no longer log in (test by trying to log in as that account).
4. Re-activate the user.
5. Log in as `seed.admin` → navigate to `/admin/users` → confirm redirect (admin lacks `users:view`).

---

### Service Health `/admin/health`

**Test with:** `seed.admin`

1. Page loads and shows service status (Supabase, Redis, email, cron jobs).
2. Confirm last cron run timestamps are recent.

---

## Clearing Test Data

### Wipe transactional data (keep accounts)

```bash
npm run seed:preprod:wipe
```

Removes: appointments, treatments, orders, chat messages/sessions, reviews, notifications. Keeps: patients, doctors, admin_users, materials (catalog), services.

### Clear EN/PL patients only

Via Supabase Dashboard → **Authentication → Users** → filter by `preprod.dentalstory.ua` → delete individually, or run:

```sql
-- Run in Supabase SQL Editor (preprod project only!)
delete from patients
where email like '%@preprod.dentalstory.ua';
-- Then delete the corresponding auth.users via Dashboard UI
```

### Full environment reset

1. Supabase Dashboard → **Authentication → Users** → bulk-delete all `@preprod.dentalstory.ua` and `@dentalstory.ua` test accounts.
2. Supabase Dashboard → **Table Editor** → delete rows from `patients`, `doctors`, `admin_users`.
3. Run `npm run seed:preprod` for a clean slate.

---

## Running Admin E2E Tests

The following Playwright specs cover admin flows in CI (mocked Supabase — no `.env.local` needed):

```bash
# Admin RBAC access control (auth-mocked)
npx playwright test e2e/admin-rbac.spec.ts --config=playwright.auth.config.ts

# Full admin flows (requires live Supabase)
npx playwright test e2e/admin-full-flows.spec.ts --config=playwright.live.config.ts

# Material orders flow
npx playwright test e2e/material-orders-full.spec.ts --config=playwright.live.config.ts

# Treatment records flow
npx playwright test e2e/treatment-records-full.spec.ts --config=playwright.live.config.ts

# QA/data-quality audit
npx playwright test e2e/qa-audit-live.spec.ts --config=playwright.live.config.ts
```

Live-config tests require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. They run against the live preprod Supabase — seed data should be present.

---

## Known Limitations

- **Doctor scope is enforced by RLS only.** The `AdminAppointmentsPage` component does not apply an additional `doctor_id` filter at the application layer. The RLS policy `appointments_scoped_read` is the sole enforcement point — if RLS is ever misconfigured, the app layer has no fallback.
- **Worktrees do not inherit `.env.local`** — run `npm run link-env` in any worktree before running seed scripts or live E2E tests.
- **Onboarding tour uses `localStorage`** — it is browser-local and not tied to the user account. Clear `localStorage` (DevTools → Application → Local Storage → delete `ds_admin_tour_done`) to re-trigger it.
- **`seed.doctor1` and `seed.doctor2`** are both doctor role but linked to different doctor records (Терапевт vs Ортодонт). Their appointment and treatment visibility differs based on what was seeded for each doctor's appointments.
- **No RBAC test for `inventory_manager` on E2E** — the live spec files focus on superadmin/admin/receptionist/doctor flows. Inventory-manager edge cases must be tested manually.
