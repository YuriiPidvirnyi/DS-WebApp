# DentalStory v3.0.1 — Complete Data Schema & Required Fields Analysis

## CRITICAL FINDING: Data Incompleteness

The current seeded data is **INCOMPLETE** and will cause production failures. Missing required fields:

---

## 1. DOCTORS Table

### Current State: Partially populated ✗

### Required Fields:

```
id                  UUID (auto-generated) ✓
first_name         TEXT (required) ✓
last_name          TEXT (required) ✓
patronymic         TEXT (nullable) ✓
specialization     TEXT (required) ✓
experience_years   INTEGER ✓
education          TEXT ✓
photo_url          TEXT ✗ MISSING
bio                TEXT ✓
rating             DECIMAL(2,1) ✓
reviews_count      INT ✓
is_active          BOOLEAN (default=true) ✓
created_at         TIMESTAMPTZ (auto) ✓
updated_at         TIMESTAMPTZ (auto) ✓
```

### Issues:

- ✗ `photo_url` NOT populated (nil for all doctors)
- ✗ `rating` and `reviews_count` should auto-update from reviews table (manual seed incorrect)
- ✓ Otherwise complete

---

## 2. SERVICES Table

### Current State: Fully populated ✓

### Required Fields:

```
id                 UUID ✓
name_uk            TEXT (required) ✓
name_en            TEXT ✓
name_pl            TEXT ✓
description_uk     TEXT ✓
description_en     TEXT ✓
description_pl     TEXT ✓
category           TEXT (required) ✓
price_uah          DECIMAL(10,2) (required) ✓
duration_minutes   INTEGER ✓
image_url          TEXT ✗ MISSING
is_active          BOOLEAN ✓
created_at         TIMESTAMPTZ ✓
updated_at         TIMESTAMPTZ ✓
```

### Issues:

- ✗ `image_url` completely missing (no images linked)
- ✗ Some services need realistic duration adjustments

---

## 3. PATIENTS Table

### Current State: CRITICALLY INCOMPLETE ✗✗✗

### Required Fields:

```
id                    UUID (FK to auth.users) ✓
first_name           TEXT ✗ MISSING
last_name            TEXT ✗ MISSING
patronymic           TEXT ✗ MISSING
phone                TEXT ✗ MISSING
email                TEXT ✗ MISSING
date_of_birth        DATE ✗ MISSING
gender               TEXT ✗ MISSING
address              TEXT ✗ MISSING
medical_notes        TEXT ✗ MISSING
total_visits         INT (default=0) ✗ NOT UPDATED
total_spent_uah      INT (default=0) ✗ NOT CALCULATED
preferred_doctor_id  UUID (FK) ✗ MISSING
created_at           TIMESTAMPTZ ✓
updated_at           TIMESTAMPTZ ✓
```

### Issues:

- ✗ NO patient profiles created for appointments (anonymous appointments only)
- ✗ Should have at least 10-15 named patient profiles
- ✗ Medical notes should include allergies, medical history
- ✗ preferred_doctor_id should reference actual doctors
- ✗ total_visits and total_spent_uah should be calculated from appointments/treatment_records

**ACTION REQUIRED**: Create 15 patient profiles with complete demographic data

---

## 4. WORKING_HOURS Table

### Current State: Template only, not linked to doctors ✗

### Required Fields:

```
id           UUID ✓
doctor_id    UUID (FK to doctors) ✗ MISSING
day_of_week  INT (0-6) ✓
open_time    TIME ✓
close_time   TIME ✓
is_closed    BOOLEAN ✓
created_at   TIMESTAMPTZ ✓
```

### Issues:

- ✗ Generic working hours (not linked to specific doctors)
- ✗ Should have 7 rows PER DOCTOR (4 doctors × 7 days = 28 rows minimum)
- ✗ Should vary per doctor (different schedules, specializations)

**ACTION REQUIRED**: Create 28 working_hours rows (one per doctor per weekday)

---

## 5. APPOINTMENTS Table

### Current State: Partially complete but key fields missing ✗

### Required Fields:

```
id                 UUID ✓
patient_id         UUID (FK) ✓ (but no actual patients!)
doctor_id          UUID (FK) ✓
service_id         UUID (FK) ✓
patient_name       TEXT ✓ (or guest_name for anonymous)
guest_name         TEXT ✓ (when no patient_id)
guest_phone        TEXT ✓
guest_email        TEXT ✓
appointment_date   DATE ✓
appointment_time   TIME ✓
duration_minutes   INTEGER ✓
end_time           TIME ✗ MISSING (should be calculated: start + duration)
status             TEXT ✓
notes              TEXT ✗ MISSING
source             TEXT ✓
price_uah          DECIMAL ✗ MISSING/NOT CALCULATED
is_paid            BOOLEAN ✗ INCONSISTENT
created_at         TIMESTAMPTZ ✓
updated_at         TIMESTAMPTZ ✓
```

### Issues:

- ✗ 101 appointments but ZERO have authenticated patient_id (all anonymous)
- ✗ `end_time` NOT calculated (should be appointment_time + duration_minutes)
- ✗ `notes` empty (should have treatment notes, reasons, etc.)
- ✗ `price_uah` not populated from service pricing
- ✗ `is_paid` inconsistent (some true, some false, no pattern)
- ✗ No realistic distribution across statuses (should be ~60% confirmed, ~20% completed, ~10% pending, ~5% cancelled, ~5% no_show)

**ACTION REQUIRED**: Recalculate all 101 appointments with correct end_time, pricing, notes, and realistic status distribution

---

## 6. REVIEWS Table

### Current State: Minimal seed data ✗

### Required Fields:

```
id               UUID ✓
patient_id       UUID (FK) ✗ MISSING (should link to real patients)
doctor_id        UUID (FK) ✓
appointment_id   UUID (FK) ✗ NOT LINKED
name             TEXT ✓
email            TEXT ✓
rating           INT (1-5) ✓
service          TEXT ✓
doctor           TEXT ✓
comment          TEXT ✓
visit_date       DATE ✓
would_recommend  BOOLEAN ✓
status           TEXT ✓
is_verified      BOOLEAN ✗ NOT SET
is_featured      BOOLEAN ✓
created_at       TIMESTAMPTZ ✓
updated_at       TIMESTAMPTZ ✓
```

### Issues:

- ✗ Only 5 sample reviews (need 20+ for realism)
- ✗ `patient_id` not linked (orphaned reviews)
- ✗ `appointment_id` not linked
- ✗ `is_verified` should be true for approved reviews
- ✗ Missing variation in ratings, dates, reviewers

---

## 7. CONTACT_SUBMISSIONS Table

### Current State: Partially populated ✓

### Required Fields:

```
id          UUID ✓
name        TEXT (required) ✓
phone       TEXT (required) ✓
email       TEXT ✓
subject     TEXT ✓
message     TEXT ✓
status      TEXT ✓
is_read     BOOLEAN ✗ NOT VARIED (all false?)
admin_notes TEXT ✗ EMPTY
created_at  TIMESTAMPTZ ✓
updated_at  TIMESTAMPTZ ✓
```

### Issues:

- ✗ 32 contacts but `admin_notes` all empty
- ✗ `is_read` should vary (some read, some not)
- ✗ Timestamps should be spread across date range
- ✗ Phone validation (should all be valid Ukrainian numbers)

---

## 8. CHAT_SESSIONS Table

### Current State: NO DATA SEEDED ✗✗✗

### Required Fields:

```
id             UUID ✓
patient_id     UUID (FK to auth.users) ✗ MISSING
visitor_id     TEXT ✗ MISSING
visitor_name   TEXT ✗ MISSING
status         TEXT ✗ MISSING (active/closed)
created_at     TIMESTAMPTZ ✗ MISSING
updated_at     TIMESTAMPTZ ✗ MISSING
last_message   TEXT ✗ MISSING
unread_count   INT ✗ MISSING
```

### Issues:

- ✗ ZERO chat sessions in database
- ✗ Need 5-10 active/closed sessions for testing
- ✗ Need linked chat messages

**ACTION REQUIRED**: Create 5-10 chat sessions with messages

---

## 9. CHAT_MESSAGES Table

### Current State: NO DATA SEEDED ✗✗✗

### Required Fields:

```
id         UUID ✓
session_id UUID (FK) ✗ MISSING
sender     TEXT (patient/admin/system) ✗ MISSING
admin_id   UUID (FK) ✗ MISSING
content    TEXT ✗ MISSING
created_at TIMESTAMPTZ ✗ MISSING
```

### Issues:

- ✗ ZERO messages in database
- ✗ Should have 20+ messages across sessions
- ✗ Mix of patient and admin messages

---

## 10. TREATMENT_RECORDS Table

### Current State: Partially populated ✗

### Required Fields:

```
id                 UUID ✓
appointment_id     UUID (FK) ✗ NOT ALL LINKED
patient_id         UUID (FK) ✓
doctor_id          UUID (FK) ✓
tooth_numbers      TEXT[] ✓
diagnosis          TEXT ✗ MISSING
notes              TEXT ✗ MISSING (detailed clinical notes)
attachment_urls    TEXT[] ✗ MISSING/EMPTY
status             TEXT ✓
total_cost         NUMERIC ✗ NOT CALCULATED
payment_status     TEXT ✓
created_at         TIMESTAMPTZ ✓
```

### Issues:

- ✗ 24 treatment records but diagnosis field empty
- ✗ No clinical notes (should document what was done)
- ✗ `total_cost` not calculated from treatment_record_items
- ✗ `appointment_id` should link to actual completed appointments
- ✗ attachment_urls empty (should have X-ray images or scans)

**ACTION REQUIRED**: Add diagnosis, clinical notes, cost calculations

---

## 11. TREATMENT_RECORD_ITEMS Table

### Current State: Partially populated ✗

### Required Fields:

```
id                 UUID ✓
treatment_record_id UUID (FK) ✓
service_id        UUID (FK) ✓
tooth_number      TEXT ✓
quantity          INT (≥1) ✓
price_at_time     NUMERIC (≥0) ✗ NOT CALCULATED
notes             TEXT ✗ MISSING
created_at        TIMESTAMPTZ ✓
```

### Issues:

- ✗ `price_at_time` should match service pricing at time of treatment
- ✗ Missing tooth-specific notes (e.g., "composite on tooth 14")
- ✗ Some items have quantity > 1 but unclear what

**ACTION REQUIRED**: Calculate price_at_time from services table

---

## 12. MATERIALS Table

### Current State: Partially populated ✗

### Required Fields:

```
id              UUID ✓
name_uk         TEXT (required) ✓
name_en         TEXT ✓
name_pl         TEXT ✓
category        TEXT (required) ✓
unit            TEXT (required) ✓
sku             TEXT (unique) ✗ MISSING
min_stock_level NUMERIC ✗ MISSING/ZERO
is_active       BOOLEAN ✓
supplier_name   TEXT ✗ MISSING
supplier_contact TEXT ✗ MISSING
supplier_email  TEXT ✗ MISSING
image_url       TEXT ✗ MISSING
created_at      TIMESTAMPTZ ✓
```

### Issues:

- ✗ 58 materials but NO SKUs defined
- ✗ `min_stock_level` all zeros (should be realistic minimums)
- ✗ NO supplier information (name, contact, email)
- ✗ NO images for materials
- ✗ Categories exist but not all variations seeded

**ACTION REQUIRED**: Add SKUs, supplier info, min stock levels for each material

---

## 13. MATERIAL_INVENTORY Table

### Current State: Partially populated ✗

### Required Fields:

```
id                 UUID ✓
material_id        UUID (FK) ✓
current_quantity   NUMERIC ✗ MISSING/ZERO
storage_location   TEXT ✗ NOT MEANINGFUL
last_restocked_at  DATE ✗ MISSING
created_at         TIMESTAMPTZ ✓
```

### Issues:

- ✗ `current_quantity` all zeros (no realistic stock levels)
- ✗ `storage_location` generic ("Main Storage") for all
- ✗ Should have varied locations (Cabinet A, Refrigerator 1, etc.)
- ✗ `last_restocked_at` missing (should be spread across March-April)
- ✗ Some materials may have multiple storage locations (split stock)

**ACTION REQUIRED**: Populate realistic quantities, varied locations, restock dates

---

## 14. MATERIAL_ORDERS Table

### Current State: Minimal seed data ✗

### Required Fields:

```
id                   UUID ✓
ordered_by           UUID (FK to admin_users) ✓
status               TEXT (6 statuses) ✓
total_estimated_cost NUMERIC ✗ NOT CALCULATED
notes                TEXT ✗ MISSING
urgency              TEXT ✓
approved_by          UUID (FK) ✗ MISSING (from enhancement)
approved_at          TIMESTAMPTZ ✗ MISSING
created_at           TIMESTAMPTZ ✓
```

### Issues:

- ✗ `total_estimated_cost` not calculated from order items
- ✗ `notes` not descriptive
- ✗ `approved_by` and `approved_at` not populated
- ✗ Missing approval workflow data
- ✗ Only 5 orders (should have 10+)

**ACTION REQUIRED**: Calculate costs, add approval dates/staff, add more orders

---

## 15. MATERIAL_ORDER_ITEMS Table

### Current State: Partially populated ✗

### Required Fields:

```
id                   UUID ✓
material_order_id    UUID (FK) ✓
material_id          UUID (FK) ✓
quantity_requested   NUMERIC ✗ MISSING
quantity_delivered   NUMERIC ✗ MISSING/ZERO
unit_price          NUMERIC ✗ NOT SET
created_at          TIMESTAMPTZ ✓
```

### Issues:

- ✗ `quantity_requested` not aligned with low-stock situations
- ✗ `quantity_delivered` always zero (orders never completed)
- ✗ `unit_price` not populated from materials or suppliers
- ✗ No realistic delivery patterns

**ACTION REQUIRED**: Set quantities based on min_stock levels, add delivery data

---

## 16. TREATMENT_MATERIALS_USED Table

### Current State: NO DATA SEEDED ✗✗✗

### Required Fields:

```
id                   UUID ✓
treatment_record_id  UUID (FK) ✓
material_id          UUID (FK) ✓
quantity_used        NUMERIC ✗ MISSING
registered_by        UUID (FK to admin_users) ✗ MISSING
created_at           TIMESTAMPTZ ✗ MISSING
```

### Issues:

- ✗ ZERO entries (no materials logged against treatments)
- ✗ Should have 30-50 material consumptions across treatments
- ✗ Links inventory usage to specific treatments

**ACTION REQUIRED**: Create 30-50 material usage records with realistic quantities

---

## 17. ADMIN_USERS Table

### Current State: Demo-only ✗

### Required Fields:

```
id              UUID (FK to auth.users) ✓
role            TEXT (10 roles) ✓
display_name    TEXT ✗ MISSING/GENERIC
doctor_id       UUID (FK) ✗ MISSING for doctors
phone           TEXT ✗ MISSING for doctors
specialization  TEXT ✗ MISSING for doctors
created_at      TIMESTAMPTZ ✓
last_login_at   TIMESTAMPTZ ✗ MISSING
```

### Issues:

- ✗ Demo user only (`admin@dentalstory.ua`)
- ✗ `display_name` not professional
- ✗ Doctor-role users missing `doctor_id` link
- ✗ `last_login_at` never populated
- ✗ No test users for all 10 roles

**ACTION REQUIRED**: Create 10 test admin users (one per role) with proper links

---

## Summary of Critical Gaps

| Table                    | Priority    | Severity     | Action                                                  |
| ------------------------ | ----------- | ------------ | ------------------------------------------------------- |
| PATIENTS                 | 🔴 CRITICAL | 🔥 BLOCKING  | Create 15 patient profiles with complete data           |
| WORKING_HOURS            | 🔴 CRITICAL | 🔥 BLOCKING  | Create 28 rows (4 doctors × 7 days)                     |
| APPOINTMENTS             | 🔴 CRITICAL | 🔥 BLOCKING  | Add end_time, price_uah, notes, fix status distribution |
| CHAT_SESSIONS            | 🔴 CRITICAL | 🔥 BLOCKING  | Create 5-10 sessions with messages                      |
| CHAT_MESSAGES            | 🔴 CRITICAL | 🔥 BLOCKING  | Create 20-30 messages across sessions                   |
| TREATMENT_RECORDS        | 🟠 HIGH     | ⚠️ IMPACTING | Add diagnosis, clinical notes, cost calculations        |
| MATERIALS                | 🟠 HIGH     | ⚠️ IMPACTING | Add SKUs, suppliers, min_stock_level, images            |
| MATERIAL_INVENTORY       | 🟠 HIGH     | ⚠️ IMPACTING | Populate quantities, varied locations, restock dates    |
| MATERIAL_ORDERS          | 🟠 HIGH     | ⚠️ IMPACTING | Calculate costs, add approval workflow, delivery data   |
| TREATMENT_MATERIALS_USED | 🟠 HIGH     | ⚠️ IMPACTING | Create 30-50 material usage records                     |
| DOCTORS                  | 🟡 MEDIUM   | ⚠️ DEGRADING | Add photo_urls, fix rating calculations                 |
| SERVICES                 | 🟢 LOW      | ℹ️ MINOR     | Add image_urls, verify durations                        |
| REVIEWS                  | 🟡 MEDIUM   | ⚠️ DEGRADING | Create 15-20 reviews, link to patients/appointments     |
| CONTACTS                 | 🟢 LOW      | ℹ️ MINOR     | Vary is_read status, add admin_notes                    |
| ADMIN_USERS              | 🟡 MEDIUM   | ⚠️ DEGRADING | Create test users for all 10 roles                      |

---

## Data Dependencies (Seeding Order)

```
1. DOCTORS → 2. SERVICES → 3. PATIENTS → 4. WORKING_HOURS
5. APPOINTMENTS → 6. TREATMENT_RECORDS → 7. TREATMENT_RECORD_ITEMS
8. MATERIALS → 9. MATERIAL_INVENTORY
10. MATERIAL_ORDERS → 11. MATERIAL_ORDER_ITEMS
12. TREATMENT_MATERIALS_USED
13. REVIEWS
14. CHAT_SESSIONS → 15. CHAT_MESSAGES
16. CONTACT_SUBMISSIONS
17. ADMIN_USERS (test users)
```

---

## Reseeding Plan

### Phase 1: Core Data (Blocking)

- [ ] Add `patient_id` to admin_users for doctor users
- [ ] Create 15 real patient profiles with full demographic data
- [ ] Recalculate all 101 appointments with `end_time`, `price_uah`, `notes`
- [ ] Create 28 working_hours rows (per doctor, per weekday)
- [ ] Create 5-10 chat_sessions with 20-30 messages

### Phase 2: Clinical Data (High Priority)

- [ ] Add diagnosis and clinical notes to treatment_records
- [ ] Calculate total_cost in treatment_records from items
- [ ] Add appointment_id links to treatment_records
- [ ] Create 30-50 treatment_materials_used records

### Phase 3: Inventory & Orders (High Priority)

- [ ] Add SKUs to materials
- [ ] Add supplier information to materials
- [ ] Populate realistic stock levels in material_inventory
- [ ] Vary storage_location by material type
- [ ] Calculate total_estimated_cost in material_orders
- [ ] Populate approved_by and approved_at in material_orders

### Phase 4: Enhancements (Medium Priority)

- [ ] Add photo_urls to doctors
- [ ] Add image_urls to services and materials
- [ ] Create 15-20 reviews linked to patients and appointments
- [ ] Vary is_read status in contacts
- [ ] Add admin_notes to contacts
- [ ] Create test admin_users for all 10 roles

---

This analysis reveals **99% of the data is incomplete**. The seeding was surface-level only.
