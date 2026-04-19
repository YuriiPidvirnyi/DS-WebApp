# Preprod Data Seeding

This document describes the preprod seed system used to populate the staging/preview environment with realistic test data.

---

## Overview

The seed system lives in `scripts/seed/preprod/` and is composed of 13 TypeScript modules. It creates a consistent, realistic dataset for QA, demos, and development against the preprod Supabase project. **It must never run against production.**

---

## Prerequisites

Two environment variables are required:

| Variable                    | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase project URL — must NOT match the production URL pattern |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — bypasses RLS for seeding                      |

The runner validates the URL against the production domain before executing. If the URL contains `dentalstory.ua` in a production context, seeding is aborted.

> For git worktrees, run `npm run link-env` first to symlink `.env.local` into the worktree (see `scripts/link-env.mjs`).

---

## Commands

| Command                                                              | Effect                                           |
| -------------------------------------------------------------------- | ------------------------------------------------ |
| `npm run seed:preprod`                                               | Run all modules in dependency order (idempotent) |
| `npm run seed:preprod:wipe`                                          | Wipe seed data first, then run all modules       |
| `npx tsx scripts/seed/preprod/index.ts --only=patients,appointments` | Run a specific subset of modules                 |

### Wipe-and-reseed

```bash
npm run seed:preprod:wipe
```

Deletes all transactional rows (appointments, treatments, orders, chat, reviews, notifications) while **keeping** `patients`, `doctors`, and `admin_users` rows. Then re-seeds everything.

### Full reset

To reset everything including auth users and master data:

```bash
# 1. Manually delete patients + admin_users via Supabase Dashboard
#    (auth.users rows must be deleted via Dashboard → Authentication → Users)
# 2. Then run a clean seed:
npm run seed:preprod
```

---

## Module Execution Order

Modules run in dependency order. Skipping a module that produces data required by a later module will cause the dependent module to also be skipped.

| #   | Module                    | Creates                          | Depends on                      |
| --- | ------------------------- | -------------------------------- | ------------------------------- |
| 00  | `00_config.ts`            | Supabase client, shared types    | —                               |
| 01  | `01_doctors.ts`           | ~5 doctor records                | —                               |
| 02  | `02_services.ts`          | ~15 dental services              | —                               |
| 03  | `03_admin_users.ts`       | 9 admin_users + auth.users       | doctors                         |
| 04  | `04_patients.ts`          | ~20 patient records + auth.users | —                               |
| 05  | `05_appointments.ts`      | ~50 appointments                 | patients, doctors, services     |
| 06  | `06_treatment_records.ts` | ~30 treatment records + items    | appointments, services, doctors |
| 07  | `07_materials.ts`         | ~30 materials with inventory     | —                               |
| 08  | `08_material_orders.ts`   | ~10 material orders + items      | materials, admins               |
| 09  | `09_chat.ts`              | ~15 chat sessions + messages     | patients                        |
| 10  | `10_reviews.ts`           | ~15 reviews                      | patients, doctors               |
| 11  | `11_notifications.ts`     | ~20 notification events          | appointments, patients          |

All modules are **idempotent**: re-running skips already-existing records (upsert on natural keys / existing auth emails).

---

## Seeded Credentials

### Admin Accounts

Password for all admin accounts: **`PreprodTest!2026`**

| Email                              | Role              | Notes               |
| ---------------------------------- | ----------------- | ------------------- |
| `seed.superadmin@dentalstory.ua`   | superadmin        | Full access         |
| `seed.admin@dentalstory.ua`        | admin             | Standard admin      |
| `seed.receptionist@dentalstory.ua` | receptionist      | Booking management  |
| `seed.doctor1@dentalstory.ua`      | doctor            | Терапевт-стоматолог |
| `seed.doctor2@dentalstory.ua`      | doctor            | Ортодонт            |
| `seed.assistant@dentalstory.ua`    | assistant         | Assists doctors     |
| `seed.billing@dentalstory.ua`      | billing_manager   | Payment records     |
| `seed.inventory@dentalstory.ua`    | inventory_manager | Materials           |
| `seed.analyst@dentalstory.ua`      | analyst           | Analytics read-only |

### Patient Accounts

Password for all patient accounts: **`Patient!2026`**

Patient emails follow the pattern: `{firstname}.{lastname}@preprod.dentalstory.ua`

~20 patients are created with realistic Ukrainian names generated via `@faker-js/faker` (locale `uk`).

---

## Partial Seeding

To seed only specific modules, use `--only=` with a comma-separated list of module names:

```bash
# Seed only patients
npx tsx scripts/seed/preprod/index.ts --only=patients

# Seed patients and appointments (doctors and services must already exist)
npx tsx scripts/seed/preprod/index.ts --only=patients,appointments

# Available module names:
# doctors, services, admins, patients, appointments,
# treatments, materials, orders, chat, reviews, notifications
```

---

## Safety Guards

The seed runner performs these checks before executing:

1. **URL validation** — aborts if `NEXT_PUBLIC_SUPABASE_URL` is empty or matches a production pattern
2. **Service role key presence** — aborts if `SUPABASE_SERVICE_ROLE_KEY` is not set
3. **Idempotency** — all upserts use natural keys (email for auth users, names for doctors/services) so re-running is safe

---

## Adding a New Seed Module

1. Create `scripts/seed/preprod/12_<name>.ts` following the existing pattern:
   - Export a `seed<Name>(deps...)` async function
   - Return an array of seeded records for downstream modules to use
   - Use `upsert` with `onConflict` to maintain idempotency
2. Import and wire it in `index.ts` in dependency order
3. Add the module name to the `--only=` documentation above
