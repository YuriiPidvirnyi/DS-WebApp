# DentalStory v3.0.1 — Complete Data Reseeding Roadmap

## Executive Summary

The current data seed is **incomplete** (0% required fields populated across most tables). This document outlines the complete 4-phase reseeding strategy to populate **ALL required fields** with realistic, production-quality test data.

**Estimated completion**: 2-3 hours with automated SQL scripts

---

## Phase 1: CRITICAL DATA (Foundation) ✅ CREATED

**Status**: SQL script created (`RESEED_PHASE_1_CRITICAL.sql`)
**Priority**: 🔴 BLOCKING — Cannot test without this data
**Scope**: 5 core tables with all required fields

### 1.1 DOCTORS (4 records)

- [x] Add photo_urls (linked to CDN)
- [x] Realistic experience_years
- [x] Proper specialization
- [x] Educational background
- [x] Bio with additional training

### 1.2 SERVICES (15 records)

- [x] All translations (uk/en/pl)
- [x] Add image_urls (product photos)
- [x] Realistic pricing (0-45,000 UAH range)
- [x] Category classification
- [x] Duration in minutes

### 1.3 WORKING_HOURS (28 records)

- [x] Create 4 doctors × 7 days = 28 rows
- [x] Vary schedules per doctor (not identical)
- [x] Sunday closed for all
- [x] Realistic hours (9-20 on weekdays, 10-16 Saturday)
- [x] Add doctor_id FK (critical missing field!)

### 1.4 PATIENTS (15 records)

- [x] 15 Ukrainian names with patronymics
- [x] Valid mobile phone numbers (+380xxx)
- [x] Real email addresses
- [x] Date of birth (ages 25-55)
- [x] Home addresses (Kyiv)
- [x] Medical notes (allergies, conditions, medications)
- [x] Gender
- [x] Preferred doctor links
- [x] **[CRITICAL FIX]** These were ZERO in original data!

### 1.5 APPOINTMENTS (101 records recalculated)

- [x] Add `end_time` = appointment_time + service duration_minutes
- [x] Calculate `price_uah` from service pricing
- [x] Add detailed `notes` (clinical, administrative)
- [x] Realistic `status` distribution:
  - 60% confirmed (61 appointments)
  - 20% completed (20 appointments)
  - 10% pending (10 appointments)
  - 5% cancelled (5 appointments)
  - 5% no_show (5 appointments)
- [x] Varied appointment reasons and follow-ups
- [x] Link to real patient_ids (not all anonymous)

**Script**: Run `RESEED_PHASE_1_CRITICAL.sql`

---

## Phase 2: CLINICAL DATA (Treatment workflows)

**Priority**: 🟠 HIGH — Blocks clinical testing
**Scope**: 4 related tables forming treatment documentation

### 2.1 TREATMENT_RECORDS (24+ records)

Required fields to populate:

```sql
id                 -- UUID (auto)
appointment_id     -- FK to appointments (link to completed/actual visits)
patient_id         -- FK to patients ✓ (already have real patients)
doctor_id          -- FK to doctors ✓
tooth_numbers      -- TEXT[] (e.g., '{"14", "15", "16"}')
diagnosis          -- TEXT ✗ MISSING — describe what was found
notes              -- TEXT ✗ MISSING — detailed clinical notes
attachment_urls    -- TEXT[] ✗ MISSING — X-ray images, scans
status             -- TEXT (draft/signed/completed)
total_cost         -- NUMERIC ✗ CALCULATED from items
payment_status     -- TEXT (unpaid/partial/paid/waived/refunded)
```

### 2.2 TREATMENT_RECORD_ITEMS (60+ items)

Required fields:

```sql
treatment_record_id  -- FK ✓
service_id          -- FK ✓
tooth_number        -- TEXT (tooth number treated)
quantity            -- INT (how many times the service was done)
price_at_time       -- NUMERIC ✗ CALCULATED from services table
notes               -- TEXT ✗ MISSING (e.g., "composite on buccal surface")
```

### 2.3 TREATMENT_MATERIALS_USED (30-50 records) ⭐ CRITICAL

Currently **ZERO records** — this table completely empty!

Required fields:

```sql
treatment_record_id   -- FK to treatment_records
material_id           -- FK to materials
quantity_used         -- NUMERIC (e.g., 2.5 grams of composite)
registered_by         -- UUID FK to admin_users (assistant/doctor who used it)
created_at            -- timestamp
```

**Strategic importance**: Tracks material consumption against treatments

- Needed for inventory costing
- Shows material usage patterns per doctor
- Validates inventory accuracy
- Required for cost calculations

### 2.4 Related Schema Fixes

- Ensure all appointment_id references in treatment_records are valid
- Calculate total_cost in treatment_records = SUM(treatment_record_items.price_at_time)
- Populate registered_by with realistic admin_users

**Deliverables**:

- `RESEED_PHASE_2_CLINICAL.sql` (180+ records across 3 tables)
- Verify foreign key integrity
- Validate cost calculations

---

## Phase 3: INVENTORY & ORDERS (Supply chain)

**Priority**: 🟠 HIGH — Blocks inventory testing
**Scope**: 5 related tables forming order-to-stock workflow

### 3.1 MATERIALS (58 records, enhancements)

Missing required fields:

```sql
id                  -- UUID ✓
name_uk/en/pl       -- TEXT ✓
category            -- TEXT ✓
unit                -- TEXT ✓
sku                 -- TEXT ✗ MISSING (e.g., "COMP-DENT-A2-500G")
min_stock_level     -- NUMERIC ✗ ZERO (should be 10-1000 depending on item)
supplier_name       -- TEXT ✗ MISSING (e.g., "ООО ДентЛоджистик Київ")
supplier_contact    -- TEXT ✗ MISSING (person name)
supplier_email      -- TEXT ✗ MISSING (supplier@company.ua)
image_url           -- TEXT ✗ MISSING (product images)
is_active           -- BOOLEAN ✓
```

### 3.2 MATERIAL_INVENTORY (58+ records)

Missing required fields:

```sql
material_id         -- FK ✓
current_quantity    -- NUMERIC ✗ ALL ZEROS (should be 10-5000)
storage_location    -- TEXT ✗ GENERIC ("Main Storage" for all)
                    -- Should vary: "Cabinet A", "Refrigerator 1", "Shelf B-3"
last_restocked_at   -- DATE ✗ MISSING (should be spread across March-April)
```

### 3.3 MATERIAL_ORDERS (10+ records)

Missing required fields:

```sql
ordered_by          -- FK to admin_users ✓
status              -- TEXT (draft/pending_approval/approved/ordered/delivered/cancelled)
total_estimated_cost -- NUMERIC ✗ NOT CALCULATED (sum of order items)
notes               -- TEXT ✗ MISSING (delivery instructions, vendor notes)
urgency             -- TEXT (low/normal/high/critical)
approved_by         -- UUID FK ✗ MISSING (who approved the order)
approved_at         -- TIMESTAMPTZ ✗ MISSING (approval timestamp)
```

### 3.4 MATERIAL_ORDER_ITEMS (30-40 items)

Missing required fields:

```sql
material_id         -- FK ✓
quantity_requested  -- NUMERIC ✗ (should be calculated from low stock alerts)
quantity_delivered  -- NUMERIC ✗ (currently all zeros)
unit_price          -- NUMERIC ✗ (from supplier pricing)
```

### 3.5 Inventory Functions (from 20260407_materials_enhancement.sql)

Already implemented:

```sql
public.deduct_inventory(material_id, qty, location)  -- Atomically decrease stock
public.add_inventory(material_id, qty, location)     -- Atomically increase stock
```

Need to:

- Test with realistic deductions from treatment_materials_used
- Verify no race conditions
- Document supplier pricing reference

**Deliverables**:

- `RESEED_PHASE_3_INVENTORY.sql` (120+ records across 4 tables)
- Supplier directory (10 realistic vendors)
- Quantity triggers (auto-create orders when stock < min_level)
- Verify atomic functions

---

## Phase 4: USER INTERACTIONS (Chat, reviews, contacts, admin users)

**Priority**: 🟡 MEDIUM — Improves testing completeness
**Scope**: 5 user-facing tables

### 4.1 CHAT_SESSIONS (5-10 records) ⭐ COMPLETELY MISSING

Currently **ZERO records**!

Required fields:

```sql
id              -- UUID
patient_id      -- UUID FK (NULL for anonymous visitors)
visitor_id      -- TEXT (session ID for anonymous)
visitor_name    -- TEXT (e.g., "Дмитро" for anonymous chat)
status          -- TEXT (active/closed)
created_at      -- TIMESTAMPTZ
updated_at      -- TIMESTAMPTZ
last_message    -- TEXT (most recent message preview)
unread_count    -- INT (messages not yet read by recipient)
```

### 4.2 CHAT_MESSAGES (20-30 records) ⭐ COMPLETELY MISSING

Currently **ZERO records**!

Required fields:

```sql
session_id      -- FK to chat_sessions
sender          -- TEXT (patient/admin/system)
admin_id        -- UUID FK (NULL if sender != admin)
content         -- TEXT (actual message content)
created_at      -- TIMESTAMPTZ
```

Sample scenarios:

- Patient asks about appointment scheduling
- Admin responds with available times
- Patient asks about implant costs
- Admin provides pricing and consultation options

### 4.3 REVIEWS (20+ records, enhanced)

Currently 5 minimal records.

Missing fields:

```sql
patient_id      -- UUID FK ✗ (should link to real patients)
appointment_id  -- UUID FK ✗ (should link to actual visits)
is_verified     -- BOOLEAN ✗ (should be true for approved reviews)
```

Expand to:

- 20+ reviews across all doctors
- Vary ratings (3-5 stars, few 4s)
- Link to completed appointments
- Realistic comment content

### 4.4 CONTACT_SUBMISSIONS (32 records, enhance)

Missing fields:

```sql
is_read         -- BOOLEAN ✗ (should vary: some true, some false)
admin_notes     -- TEXT ✗ (responses, assignments, status)
status          -- TEXT (new/in_progress/responded/archived)
```

Enhance:

- Mark some as read
- Add admin responses
- Vary timestamps across date range

### 4.5 ADMIN_USERS (10 test users per role)

Currently 1 demo user only!

Required fields:

```sql
id              -- UUID FK (from auth.users)
role            -- TEXT (10 roles: superadmin, admin, doctor, receptionist, etc.)
display_name    -- TEXT ✗ GENERIC (should be professional names)
doctor_id       -- UUID FK ✗ (for doctor-role users, link to doctors table)
phone           -- TEXT ✗ (for doctor-role users)
specialization  -- TEXT ✗ (for doctor-role users)
created_at      -- TIMESTAMPTZ ✓
last_login_at   -- TIMESTAMPTZ ✗ (should show recent logins)
```

Create test users:

- 1 superadmin: "Максим Шевченко" (admin@dentalstory.ua exists)
- 1 admin: "Ольга Іванова"
- 1 receptionist: "Наталія Куц"
- 1 doctor: "Олена Коваленко" → links to doctor record
- 1 doctor: "Андрій Мельник" → links to doctor record
- 1 senior_assistant: "Світлана Петренко"
- 1 assistant: "Іван Сідоренко"
- 1 staff: "Петро Бобренко"
- 1 billing_manager: "Вероніка Литвин"
- 1 inventory_manager: "Артем Водолаєв"
- 1 analyst: "Людмила Корпанець"

**Deliverables**:

- `RESEED_PHASE_4_USERS.sql` (80+ records across 5 tables)
- Auth user creation (pre-step in Supabase console)
- Test login credentials documentation

---

## Implementation Timeline

| Phase      | Tables | Records | SQL Script     | Effort      | Timeline       |
| ---------- | ------ | ------- | -------------- | ----------- | -------------- |
| **1**      | 5      | 168     | ✅ DONE        | 🔴 Critical | **Run now**    |
| **2**      | 4      | 180+    | 📝 In Progress | 🟠 High     | **30 min**     |
| **3**      | 4      | 120+    | 📝 To Create   | 🟠 High     | **30 min**     |
| **4**      | 5      | 80+     | 📝 To Create   | 🟡 Medium   | **45 min**     |
| **Verify** | All    | —       | 📝 To Create   | 🟢 Low      | **15 min**     |
| **TOTAL**  | 18     | 550+    | —              | —           | **~2.5 hours** |

---

## Key Metrics After Reseeding

| Metric                | Phase 1 | Phase 2 | Phase 3 | Phase 4      | Final                  |
| --------------------- | ------- | ------- | ------- | ------------ | ---------------------- |
| Doctors               | 4       | 4       | 4       | 4 + 10 users | 4 (doctors) + 10 users |
| Services              | 15      | 15      | 15      | 15           | 15                     |
| Patients              | 15      | 15      | 15      | 15           | 15                     |
| Appointments          | 101     | 101     | 101     | 101          | 101                    |
| Treatment Records     | 0       | 24+     | 24+     | 24+          | 24+                    |
| Materials             | 0       | 0       | 58      | 58           | 58                     |
| Material Orders       | 0       | 0       | 10+     | 10+          | 10+                    |
| Chat Sessions         | 0       | 0       | 0       | 5-10         | 5-10                   |
| Chat Messages         | 0       | 0       | 0       | 20-30        | 20-30                  |
| Reviews               | 5       | 5       | 5       | 20+          | 20+                    |
| Contacts              | 32      | 32      | 32      | 32           | 32                     |
| Admin Users           | 1       | 1       | 1       | 10           | 10                     |
| **Data Completeness** | **20%** | **45%** | **75%** | **95%**      | **99%+**               |

---

## Critical Data Dependencies

```
PHASE 1 (Execute immediately):
1. doctors
2. services
3. patients
4. working_hours
5. appointments
   ↓
   Required before Phase 2

PHASE 2 (Clinical, execute after Phase 1):
1. treatment_records (requires: patients, doctors, appointments)
2. treatment_record_items (requires: services, treatment_records)
3. treatment_materials_used (requires: materials[Phase 3], treatment_records)
   ↓
   Can proceed in parallel to Phase 3

PHASE 3 (Inventory, execute in parallel with Phase 2):
1. materials
2. material_inventory (requires: materials)
3. material_orders (requires: admin_users[Phase 4])
4. material_order_items (requires: materials, material_orders)
5. treatment_materials_used completes (requires: phases 2 & 3)
   ↓
   Can proceed in parallel to Phase 4

PHASE 4 (Users, execute last):
1. chat_sessions
2. chat_messages (requires: chat_sessions)
3. reviews (enhanced)
4. contact_submissions (enhanced)
5. admin_users (requires: auth.users created in Supabase)
```

---

## Testing Strategy Post-Reseeding

### Unit Tests (should all pass)

```
✓ Doctor scope enforcement (doctor sees only 17 appointments, not 101)
✓ Patient data integrity (all 15 patients have complete profiles)
✓ Cost calculations (appointment.price_uah matches service pricing)
✓ Treatment cost calculations (sum of items = total_cost)
✓ Inventory atomic operations (no race conditions)
✓ RLS policies (patient cannot see other patient data)
```

### Browser Tests (Phase B from previous session)

```
Unit 7: Superadmin dashboard
  ✓ See 101 appointments with all status distribution
  ✓ See 4 doctors listed
  ✓ See 15 patients in cabinet
  ✓ See 58 materials in inventory
  ✓ See 10+ orders in workflow

Unit 8: Doctor scope verification
  ✓ Doctor sees only their own appointments (17-25 appointments)
  ✓ Cannot view other doctors' patient records
  ✓ RLS policy enforced at database level

Unit 9: Patient cabinet
  ✓ Authenticated patient sees only own data
  ✓ Can view own treatment history (24+ records)
  ✓ Can see own chat sessions

Unit 10: Anonymous features
  ✓ Booking form loads with real doctors (4 options)
  ✓ Chat form accepts messages
  ✓ Contact form submits without auth
```

### Integration Tests (new)

```
Material workflow: Create order → Approve → Deliver → Inventory deducted
Treatment workflow: Appointment → Treatment record → Link materials → Calculate cost
Chat workflow: Start session → Exchange messages → Close session
Review workflow: Appointment completed → Customer leaves review → Admin approves
```

---

## Safety & Verification

### Before Running Each Phase:

1. [ ] Backup production data (if applicable)
2. [ ] Verify foreign key constraints
3. [ ] Check RLS policies still active
4. [ ] Validate data uniqueness (phone, email, SKU, etc.)

### After Running Each Phase:

1. [ ] Run verification queries (provided in scripts)
2. [ ] Check row counts match expected
3. [ ] Verify no constraint violations
4. [ ] Test sample RLS policies
5. [ ] Confirm timestamp accuracy

### Final Verification Checklist:

- [ ] All 550+ records inserted without errors
- [ ] No orphaned foreign keys
- [ ] All indexed columns have data
- [ ] RLS policies enforce scope correctly
- [ ] Doctor scope test: doctor1 sees 17, doctor2 sees 20, etc.
- [ ] Calculations verified (costs, totals, timestamps)
- [ ] Chat realtime subscriptions working
- [ ] Email validation (all emails valid Ukrainian domains)
- [ ] Phone validation (all numbers valid +380 format)

---

## Files Created

1. ✅ `DATA_SCHEMA_ANALYSIS.md` — Complete field-by-field gap analysis
2. ✅ `RESEED_PHASE_1_CRITICAL.sql` — Core data (168 records, 5 tables)
3. 📝 `RESEED_PHASE_2_CLINICAL.sql` — To create (180+ records, 4 tables)
4. 📝 `RESEED_PHASE_3_INVENTORY.sql` — To create (120+ records, 4 tables)
5. 📝 `RESEED_PHASE_4_USERS.sql` — To create (80+ records, 5 tables)
6. 📝 `VERIFICATION_QUERIES.sql` — To create (full data integrity checks)
7. 📝 `RESEED_COMPLETION_REPORT.md` — To create (metrics & results)

---

## Next Steps

### Immediate (Next 30 minutes):

1. Run `RESEED_PHASE_1_CRITICAL.sql` in Supabase SQL Editor
2. Verify output (4 doctors, 15 services, 15 patients, 28 working_hours, 101 appointments)
3. Confirm all 5 tables populated correctly

### Short-term (Next 1-2 hours):

1. Create and run Phase 2 (clinical data)
2. Create and run Phase 3 (inventory data)
3. Create and run Phase 4 (users & interactions)
4. Run full verification

### After Completion:

1. Re-run comprehensive browser testing (Phase B, Units 7-10)
2. Verify all RBAC roles work with test users
3. Test material workflows end-to-end
4. Document results in `RESEED_COMPLETION_REPORT.md`
5. Mark system as "PRODUCTION DATA READY"

---

This roadmap ensures **ZERO incomplete data** — every required field across all 18 tables will be populated with realistic, production-quality test data.
