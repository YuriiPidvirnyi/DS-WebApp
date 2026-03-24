# Database Schema

## Overview

**Database:** PostgreSQL (Supabase-hosted)  
**Client:** `@supabase/ssr` (browser + server), `@supabase/supabase-js` (service role for cron)  
**Migrations:** Sequential SQL files in `supabase/migrations/`  
**Auth:** Supabase Auth (`auth.users`), extended by `public.patients` and `public.admin_users`

No ORM is used. All queries go through the Supabase client (PostgREST) or raw SQL via service role.

---

## Tables

### Core tables (full schema)

| Table                    | Purpose                                                | RLS                                              |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------ |
| `doctors`                | Clinic doctors with specialization, experience, rating | Public read (active), admin all                  |
| `services`               | Service catalog with i18n names, pricing in UAH        | Public read (active), admin all                  |
| `patients`               | Patient profiles (extends `auth.users` via FK)         | Own read/update, admin read                      |
| `appointments`           | Booking records with status lifecycle                  | Own read/update, public insert, admin all        |
| `reviews`                | Patient reviews with moderation                        | Public read (approved), public insert, admin all |
| `contact_submissions`    | Contact form entries                                   | Public insert, admin all                         |
| `working_hours`          | Doctor availability by day of week                     | Public read, admin all                           |
| `newsletter_subscribers` | Email newsletter subscriptions                         | Public insert/update, admin all                  |

### Chat (Supabase Realtime)

| Table           | Purpose                             | RLS                             |
| --------------- | ----------------------------------- | ------------------------------- |
| `chat_sessions` | Active patient-admin conversations  | Patient own + admin read/update |
| `chat_messages` | Individual messages within sessions | Session-scoped read/insert      |

### Clinical records

| Table                    | Purpose                                                 | RLS                         |
| ------------------------ | ------------------------------------------------------- | --------------------------- |
| `treatment_records`      | Treatment acts linking appointment -> patient -> doctor | Patient own read, admin all |
| `treatment_record_items` | Individual procedures within a treatment                | Inherits from parent record |

### Inventory

| Table                      | Purpose                                                 | RLS       |
| -------------------------- | ------------------------------------------------------- | --------- |
| `materials`                | Consumable materials catalog (SKU, supplier, min stock) | Admin all |
| `material_inventory`       | Current stock levels per material                       | Admin all |
| `material_orders`          | Purchase orders for materials                           | Admin all |
| `material_order_items`     | Line items within orders                                | Admin all |
| `treatment_materials_used` | Materials consumed per treatment                        | Admin all |

### Admin & system

| Table                              | Purpose                                                    | RLS                     |
| ---------------------------------- | ---------------------------------------------------------- | ----------------------- |
| `admin_users`                      | Admin role membership (source of truth for access)         | Self-read only          |
| `admin_audit_log`                  | Audit trail for admin actions                              | Admin read only         |
| `notification_events`              | Email notification queue (booking, reminder, cancellation) | Admin all               |
| `form_feedback_events`             | Micro-feedback on forms (thumbs up/down)                   | Admin read              |
| `appointment_reminder_preferences` | Per-appointment reminder opt-in/out                        | Patient own, admin read |

---

## Key Relationships

```
auth.users
  └── patients (1:1, FK on id)
       ├── appointments (1:N via patient_id)
       │    ├── treatment_records (1:N via appointment_id)
       │    │    ├── treatment_record_items (1:N)
       │    │    └── treatment_materials_used (1:N)
       │    └── notification_events (1:N via appointment_id)
       ├── reviews (1:N via patient_id)
       └── chat_sessions (1:N via patient_id)
            └── chat_messages (1:N via session_id)

doctors
  ├── appointments (1:N via doctor_id)
  ├── treatment_records (1:N via doctor_id)
  └── working_hours (1:N via doctor_id)

services
  ├── appointments (1:N via service_id)
  └── treatment_record_items (1:N via service_id)

materials
  ├── material_inventory (1:1 via material_id)
  ├── material_order_items (1:N via material_id)
  └── treatment_materials_used (1:N via material_id)
```

---

## Status Enumerations

**Appointment status:** `pending` -> `confirmed` -> `completed` | `cancelled` | `no_show`

**Treatment record status:** `draft` -> `signed` -> `completed`

**Payment status:** `unpaid` | `partial` | `paid` | `waived` | `refunded`

**Review status:** `pending` -> `approved` | `rejected`

**Material order status:** `draft` -> `pending_approval` -> `approved` -> `ordered` -> `delivered`

**Notification event status:** `queued` -> `sent` | `failed`

**Chat session status:** `active` | `closed`

---

## Row Level Security (RLS)

All tables have RLS enabled. Access patterns:

| Pattern       | Implementation                                                         |
| ------------- | ---------------------------------------------------------------------- |
| Public read   | `FOR SELECT USING (is_active = true)` or `USING (status = 'approved')` |
| Own data      | `USING (auth.uid() = patient_id)` or `USING (auth.uid() = id)`         |
| Admin access  | `USING (public.is_admin())` -- checks `admin_users` membership         |
| Public insert | `FOR INSERT WITH CHECK (true)` -- open for forms                       |

The `public.is_admin()` function checks `admin_users` table membership for the current JWT user.

### Legacy admin check

The initial schema used `(auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true` for admin checks. Later migrations introduced the `public.is_admin()` function backed by `admin_users` table. Both patterns exist; `admin_users` membership is the canonical source of truth (enforced in middleware).

---

## Triggers and Functions

| Function                           | Trigger                                                     | Purpose                                                      |
| ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `handle_new_user()`                | `on_auth_user_created` (after INSERT on `auth.users`)       | Auto-creates `patients` row on signup                        |
| `update_chat_session_on_message()` | `trg_chat_message_insert` (after INSERT on `chat_messages`) | Updates session `last_message`, `unread_count`, `updated_at` |

---

## Migrations

Located in `supabase/migrations/`, ordered by date prefix:

| File                                            | Purpose                                                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `00000000000000_full_schema.sql`                | Complete schema: doctors, services, patients, appointments, reviews, contacts, chat, newsletter, seed data |
| `20260318_live_chat.sql`                        | Chat sessions + messages tables                                                                            |
| `20260320_admin_users.sql`                      | Admin users table with role management                                                                     |
| `20260321_admin_audit_and_restore.sql`          | Audit log table + restore RPC                                                                              |
| `20260321_align_rls_admin_checks.sql`           | Standardize RLS to `is_admin()` function                                                                   |
| `20260321_clinical_and_inventory.sql`           | Treatment records, materials, inventory, orders                                                            |
| `20260321_expand_notification_events.sql`       | Expand notification types and add processing metadata                                                      |
| `20260321_notification_scheduled_at.sql`        | Add `scheduled_at` column for deferred notifications                                                       |
| `20260322_remove_legacy_admin_claim.sql`        | Remove JWT-based admin claims                                                                              |
| `20260323_admin_restore_safeguards.sql`         | Safeguards for audit log restore operations                                                                |
| `20260323_admin_users_add_missing_columns.sql`  | Add `display_name`, `last_login_at`                                                                        |
| `20260323_admin_users_rls_policies.sql`         | RLS policies for admin_users                                                                               |
| `20260323_appointment_reminder_preferences.sql` | Reminder opt-in/out per appointment                                                                        |
| `20260323_feedback_and_notification_events.sql` | Form feedback events table                                                                                 |
| `20260324_security_linter_hardening.sql`        | Security policy hardening                                                                                  |

### Applying migrations

Migrations are designed to be run via Supabase SQL Editor or `supabase db push`. Each migration is idempotent where possible (`IF NOT EXISTS`, `DROP ... IF EXISTS`).

The full schema migration (`00000000000000_full_schema.sql`) is destructive (drops and recreates all base tables). Use it only for fresh setups.

---

## Seed Data

The full schema migration includes seed data:

- **4 doctors** with Ukrainian names, specializations, and ratings
- **15 services** across categories (therapy, surgery, implantology, orthodontics, hygiene, prosthetics) with UAH pricing
- **7 working hours** entries (Mon-Fri 09:00-20:00, Sat 10:00-16:00, Sun closed)
- **5 sample reviews** (approved, Ukrainian text)

---

## Admin User Setup

Admin access is controlled by the `admin_users` table, not JWT claims.

To add an admin:

1. Create user via Supabase Auth Dashboard
2. Insert into `admin_users`:

```sql
INSERT INTO public.admin_users (id, role, display_name)
VALUES ('<user-uuid>', 'admin', 'Name');
```

Roles: `superadmin`, `admin`, `staff`, `doctor`, `assistant`

---

## Realtime

Chat tables (`chat_sessions`, `chat_messages`) are added to the `supabase_realtime` publication for live updates via Supabase Realtime subscriptions.
