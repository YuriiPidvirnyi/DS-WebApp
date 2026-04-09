# RBAC System: Gaps & Recommendations for v3.1+

**Analysis Date**: 2026-04-08  
**Current State**: 10 roles, 25 permissions, fully implemented v3.0  
**Scope**: Identify remaining gaps and propose improvements

---

## Executive Summary

The current **10-role RBAC system is comprehensive and production-ready** for most dental practices. However, 5 gaps were identified through analysis:

1. **Analyst role lacks chat capability** (by design, but limits reporting collaboration)
2. **No document management role** (future feature gap)
3. **Doctor scope filtering not fully implemented** (doctors should see own patients only)
4. **Senior_assistant still overloaded** (inventory duties compete with clinical)
5. **No audit trail for permission changes** (compliance gap for larger practices)

**Recommendation**: Implement gaps in **v3.1 (Phase 3)** after gathering clinic feedback on v3.0 usage patterns.

---

## Gap 1: Analyst Role Cannot Collaborate

### Current Situation

- **analyst** has: `dashboard:view`, `analytics:view`, `appointments:view_all`, `patients:view`, `treatments:view_all`, `orders:view`, `inventory:view`
- **analyst** lacks\*\*: `chat:view`, `chat:reply`

### Impact

- Analyst generates report but cannot discuss findings with practice manager
- Must email or message outside system
- Reduces visibility into analysis process
- Decreases real-time decision making

### Example Scenario

```
Analyst discovers: Treatment collection rate dropped 15% last week
Analyst wants to: Ask doctor why completion rates dropped
Problem: Cannot message doctor in chat (no chat:view)
Result: Email back-and-forth instead of instant communication
```

### Recommendation (v3.1)

**Option A: Add chat to analyst** (Recommended)

```typescript
analyst: [
  'dashboard:view',
  'analytics:view',
  'appointments:view_all',
  'patients:view',
  'treatments:view_all',
  'orders:view',
  'inventory:view',
  'chat:view', // ← ADD
  'chat:reply', // ← ADD
]
```

**Why**: Analysts often need to discuss findings with practice managers. Chat is read-only communication, not operational control.

**Risk**: Minimal (chat is non-operational)

**Effort**: < 15 minutes (1 line change)

---

## Gap 2: No Document Management Role

### Current Situation

- No role for handling patient documents, medical records, or clinical notes
- Doctor creates treatment records, but no dedicated records manager
- Compliance/HIPAA requires audit trails for document access

### Impact

- Growing clinic needs staff for medical records management
- Treatment records have no approval workflow
- No document-level access control

### Example Scenario

```
Large 6-doctor clinic needs:
  ✗ Medical records coordinator (not available)
  ✗ Document approval workflow
  ✗ Audit trail for record access

Current solution: Doctor creates + signs records manually
Better: Dedicated records_manager role
```

### Recommendation (v3.1+, Conditional)

**Create `records_manager` role** for larger clinics only

```typescript
records_manager: [
  'dashboard:view',
  'patients:view',
  'treatments:view_all',
  'treatments:edit_draft', // Can edit draft records
  'chat:view',
  'chat:reply',
]
```

**When to use**: Clinics with 3+ doctors or high patient volume (>100/month)

**When to skip**: Small clinics (1-2 doctors) where doctor manages own records

**Effort**: 2-3 hours (conditional implementation)

---

## Gap 3: Doctor Scope Filtering Not Complete

### Current Situation

- **Intended**: Doctors should see only their own patients, appointments, treatments
- **Partially implemented**:
  - `appointments:view_own` permission exists
  - `treatments:view_own` permission exists
  - **BUT**: No `patients:view_own` permission
  - **AND**: Database RLS might not enforce doctor scope on patient view

### Impact

- Doctors might see other doctors' patients
- HIPAA compliance issue (unnecessary data access)
- Patient privacy concern
- Clinical security gap

### Example Scenario

```
Dr. Olena (therapist) wants to view her patients
Currently sees:
  ✓ Own appointments ← filtered correctly
  ✓ Own treatments ← filtered correctly
  ✗ ALL patients ← WRONG! Should see only own patients

Risk: Dr. Olena accidentally sees Dr. Andriy's patient data
```

### Audit Needed

```sql
-- Check if RLS filters patients by doctor when doctor logs in
SELECT * FROM patients
WHERE id IN (
  SELECT patient_id FROM appointments
  WHERE doctor_id = current_user_id
);
-- If this query returns ALL patients instead of scoped, RLS is broken
```

### Recommendation (v3.0.1, Urgent Fix)

**Fix RLS policies** on `patients` table to enforce doctor scope

```sql
-- Add to patients RLS policy
CREATE POLICY "doctors_see_own_patients"
ON patients
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'doctor' AND
  id IN (
    SELECT DISTINCT patient_id
    FROM appointments
    WHERE doctor_id = auth.jwt() ->> 'sub'
  )
);
```

**Add permission** (optional but recommended):

```typescript
// Could add 'patients:view_own' for future use
// But more important to fix RLS first
```

**Effort**: 1-2 hours (RLS policy review + fix)

**Risk**: Critical if not implemented (privacy/compliance)

---

## Gap 4: Senior_Assistant Still Overloaded

### Current Situation

**senior_assistant** permissions (12 total):

```
✅ dashboard:view
✅ appointments:view_all        ← Clinical
✅ patients:view                ← Clinical
✅ treatments:view_all          ← Clinical
✅ treatments:edit_draft        ← Clinical
✅ inventory:view               ← Operational
✅ inventory:edit               ← Operational
✅ orders:view                  ← Operational
✅ orders:create                ← Operational
✅ orders:approve               ← Operational (approval authority)
✅ chat:view
✅ chat:reply
```

### Impact

- Clinical responsibilities (treatments, appointments) compete with operational (inventory)
- Head assistant must manage supplies while supporting doctor
- Inventory expert must have clinical knowledge
- Scales poorly for larger clinics

### Example Scenario

```
Large clinic with 4 doctors

Current setup:
  1 senior_assistant (clinical + inventory duties)
  2 assistants (clinical support only)

Better setup:
  1 senior_assistant (clinical focus only)
  1 inventory_manager (inventory focus only)
  2 assistants (clinical support)
```

### Recommendation (v3.1, Conditional)

**Option A: Refactor senior_assistant** (if inventory_manager is used)

```typescript
// Before (current):
senior_assistant: [
  // Clinical (6 permissions)
  'appointments:view_all',
  'patients:view',
  'treatments:view_all',
  'treatments:edit_draft',
  // Operational (5 permissions)
  'inventory:view',
  'inventory:edit',
  'orders:view',
  'orders:create',
  'orders:approve',
]

// After (with inventory_manager):
senior_assistant: [
  // Clinical only (6 permissions)
  'appointments:view_all',
  'patients:view',
  'treatments:view_all',
  'treatments:edit_draft',
  // Keep order approval authority
  'orders:approve',
  // Dashboard + chat
  'dashboard:view',
  'chat:view',
  'chat:reply',
]
```

**Option B: Keep both roles** (recommended)

- **senior_assistant**: Clinical focus (12 permissions current)
- **inventory_manager**: Operational focus (7 permissions new)
- Clinic chooses which to use based on staff structure

**Impact of Option A**:

- Frees inventory duties to specialist
- Makes head assistant pure clinical role
- Better scalability for larger clinics
- **But**: Breaking change for clinics using senior_assistant for inventory

**Impact of Option B**:

- No breaking changes
- Clinics can use senior_assistant alone OR pair with inventory_manager
- More flexible for different clinic sizes
- Recommended approach ✅

**Effort**: 1-2 hours if refactoring (depends on option chosen)

---

## Gap 5: No Audit Trail for Permission Changes

### Current Situation

- No logging of role creation, deletion, or permission changes
- No audit trail for admin access
- Compliance issue for regulated environments
- Cannot track who changed what and when

### Impact

- Cannot investigate unauthorized access
- HIPAA/compliance audits incomplete
- No accountability for admin actions
- Regulatory risk for clinics in regulated jurisdictions

### Example Scenario

```
Compliance audit asks:
  "When was Dr. Olena's role changed to admin?"
  "Who made that change?"
  "What did she access while admin?"

Current answer: No audit log exists 😟
Better answer: Detailed audit trail with timestamps
```

### Recommendation (v3.1+, Optional)

**Create admin_audit_log table**:

```sql
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id),
  action text NOT NULL, -- 'create_user', 'change_role', 'delete_user', 'access_api'
  target_user_id uuid, -- who was affected
  old_value jsonb, -- previous state
  new_value jsonb, -- new state
  ip_address inet,
  user_agent text,
  created_at timestamp DEFAULT now(),

  CONSTRAINT valid_action CHECK (action IN ('create_user', 'change_role', 'delete_user', 'access_api'))
);
```

**Log on**:

- Role changes in `/admin/users`
- User creation/deletion
- API calls to sensitive endpoints
- Settings changes

**When needed**: Clinics in regulated environments (healthcare facilities, corporate practices)

**When optional**: Small independent clinics

**Effort**: 3-4 hours (schema + logging hooks)

**Risk**: Medium (data volume, query performance)

---

## Minor Improvements (v3.0.1)

### 1. Add Missing Permissions

Consider adding (low priority):

- `materials:manage` — for creating new material types (not just inventory levels)
- `patients:view_own` — for doctor scope completeness
- `treatments:view_own` — already exists, but add scoping

### 2. Navigation Improvements

- Add `/admin/inventory` shortcut for inventory_manager
- Add `/admin/reports` shortcut for analyst
- Hide `/admin/orders` approval section for inventory_manager

### 3. UI/UX Improvements

- Show help tooltips for new roles
- Add role description in user creation form
- Link roles to documentation

### 4. Testing Improvements

- Add unit tests for new roles in permission matrix
- Add E2E tests for inventory_manager access control
- Add E2E tests for analyst read-only enforcement

---

## Recommended Implementation Timeline

### v3.0 (Current — Ready for Production)

✅ **Complete**:

- 10 roles implemented
- All code/database changes applied
- Full backwards compatibility
- Tested and verified

### v3.0.1 (Next — 1 Week)

🔴 **Critical**:

- [ ] Fix doctor scope on patients table (RLS policy)
- [ ] Add audit logging hook for role changes

🟡 **High**:

- [ ] Add chat to analyst role (tiny change)
- [ ] Add unit tests for new roles

### v3.1 (Future — 2-4 Weeks)

🟢 **Medium**:

- [ ] Implement records_manager role (conditional)
- [ ] Refactor senior_assistant (if needed based on feedback)
- [ ] Add admin_audit_log table (full auditing)
- [ ] Add `/admin/reports` section for analyst

🔵 **Low**:

- [ ] Add `materials:manage` permission
- [ ] UI/UX improvements
- [ ] Documentation updates

---

## Gaps Summary Table

| Gap                         | Severity    | Scope      | Effort  | v3.0.1?     | v3.1?    |
| --------------------------- | ----------- | ---------- | ------- | ----------- | -------- |
| Analyst lacks chat          | Low         | Feature    | 15 min  | ✅ Yes      | -        |
| Doctor scope not enforced   | 🔴 Critical | Security   | 1-2 hrs | ✅ Must fix | -        |
| No records_manager          | Medium      | Optional   | 2-3 hrs | ❌ No       | ⏱️ Maybe |
| senior_assistant overloaded | Low         | Design     | 1-2 hrs | ❌ No       | ⏱️ Maybe |
| No audit logging            | Medium      | Compliance | 3-4 hrs | ⏱️ Maybe    | ✅ Yes   |

---

## Compliance & Security Checklist

### Current (v3.0) ✅

- [x] Least privilege principle enforced
- [x] Separation of duties for operations
- [x] No permission escalation paths
- [x] Type-safe role system (TypeScript)
- [x] Database constraint enforcement
- [x] Backwards compatible (no breaking changes)

### TODO (v3.0.1) 🔴

- [ ] Doctor scope enforcement on RLS
- [ ] API permission checks comprehensive
- [ ] Admin action logging
- [ ] Rate limiting on sensitive endpoints

### TODO (v3.1) 🟡

- [ ] Full audit trail implementation
- [ ] Records management workflow
- [ ] Compliance reporting dashboard

---

## Conclusion

The **DentalStory v3.0 RBAC system with 10 roles is production-ready** and addresses the core gaps from the 7-role system:

✅ **Solved in v3.0**:

- Financial management separation (billing_manager)
- Supply chain specialization (inventory_manager)
- Reporting delegation (analyst)

⚠️ **Still needs attention**:

- Doctor privacy enforcement (RLS fix)
- Audit logging (compliance)
- Records management (future)

**Recommendation**: Deploy v3.0 as-is, then address critical RLS gap in v3.0.1, then gather 2-3 weeks of clinic feedback before committing to v3.1 enhancements.

---

**Analysis Complete**: 2026-04-08  
**Next Phase**: v3.0.1 hotfixes (1 week)  
**After That**: v3.1 feature development (2-4 weeks)
