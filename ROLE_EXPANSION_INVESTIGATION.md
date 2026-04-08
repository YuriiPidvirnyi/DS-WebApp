# Role Expansion Investigation Report

**Date**: 2026-04-08  
**Analysis Scope**: Current 7-role RBAC system + gaps + recommendations  
**Status**: Investigation Complete - Recommendations Ready

---

## Executive Summary

The current **7-tier RBAC system** is well-designed for most dental practices but has **3 identified gaps** where additional specialized roles would significantly improve:

1. **Financial/Billing Management** - No dedicated role for accountant/billing staff
2. **Inventory-Only Management** - Senior_assistant overloaded with both clinical + inventory duties
3. **Analytics/Reporting** - No read-only analytics role for practice managers

**Recommendation**: Add **2-3 optional specialized roles** to support larger practices while maintaining backwards compatibility.

---

## Current Role Coverage Analysis

### Current 7 Roles

| Role                 | Position              | Primary Function             | Scope                                           | Permissions       |
| -------------------- | --------------------- | ---------------------------- | ----------------------------------------------- | ----------------- |
| **superadmin**       | Owner/IT Admin        | Full system control          | All data                                        | 24/25 permissions |
| **admin**            | Practice Manager      | Practice management          | All data except user deletion                   | 23/25 permissions |
| **receptionist**     | Front Desk            | Scheduling & patient intake  | Appointments, patients, treatments, orders      | 11/25 permissions |
| **doctor**           | Dentist               | Clinical care                | Own patients only (scoped)                      | 11/25 permissions |
| **senior_assistant** | Head Dental Assistant | Clinical support + inventory | All clinical data + full inventory              | 12/25 permissions |
| **assistant**        | Dental Assistant      | Clinical support             | All clinical data + inventory view              | 11/25 permissions |
| **staff**            | General Support       | Read-only support            | Appointments, patients, treatments, orders view | 11/25 permissions |

### Permissions Coverage

**Total Permissions**: 25

```
Permission Category         | Coverage
────────────────────────────────────────
Dashboard                   | 100% (7/7 roles)
Appointments                | 100% (at least view)
Patients                    | 100% (at least view)
Treatment Records           | 100% (at least view)
Inventory/Materials         | 86% (6/7 can view)
Material Orders             | 100% (at least view)
Analytics & Reports         | 14% (2/7 roles: superadmin, admin)
Settings                    | 29% (2/7 roles: superadmin, admin)
User Management             | 29% (2/7 roles: superadmin, admin)
Chat                        | 100% (all roles)
```

---

## Identified Gaps

### Gap 1: Financial/Billing Role is Missing

**Problem**: Practice financial management has no dedicated role.

**Current Situation**:

- Only `superadmin` and `admin` can view analytics
- No billing/financial-specific permissions exist
- Admin role is overloaded: practice management + user management + financial oversight
- Larger practices can't safely delegate accounting tasks

**Business Impact**:

- Practice manager must handle all operations + accounting
- No separation of duties for financial transactions
- Audit compliance harder (no dedicated financial staff)

**Example Scenario**:

```
Practice Accountant needs to:
  ✓ View financial analytics/reports
  ✗ Create/manage treatment pricing
  ✗ View order costs & history
  ✗ Monitor inventory expenses
  ✗ Generate billing reports

Current solution: Give admin access (too many permissions!)
Better solution: Dedicated billing role
```

### Gap 2: Inventory Management is Mixed with Clinical Duties

**Problem**: `senior_assistant` role combines clinical + operational duties.

**Current Situation**:

- Senior_assistant has: inventory:edit, orders:approve
- Senior_assistant also has: treatments:edit, appointments:view_all
- Cannot delegate pure inventory management without clinical access
- Larger practices need dedicated inventory coordinator

**Permission Spread**:

```
Senior_Assistant handles:
  - Clinical: treatments, appointments, patients (view/edit)
  - Operational: inventory management, order approval

Realistic clinic scenario:
  - Head dental assistant (clinical focus)
  - Separate inventory coordinator (ordering/stock)
  - Separate supply manager (low-stock alerts, costs)
```

**Business Impact**:

- Can't have pure inventory manager
- Inventory decisions require clinical staff involvement
- Supply chain tasks compete with patient care

### Gap 3: Analytics/Reporting Role Doesn't Exist

**Problem**: Practice managers need reporting without full admin access.

**Current Situation**:

- Only admin/superadmin can view analytics
- Cannot delegate reporting to clinic manager without giving access to users:manage
- No read-only analytics role

**Business Impact**:

- Practice manager can't independently review reports
- Cannot delegate analysis to business analyst
- All reports must go through superadmin/admin

---

## Proposed New Roles

### Option 1: Add Billing/Finance Role (Recommended for Most Clinics)

**Role Name**: `billing_manager`

**Position**: Practice Billing/Finance Officer

**Permissions** (New):

```
Permission                 | Grant? | Reason
───────────────────────────────────────────
dashboard:view             | ✓     | Business overview
analytics:view             | ✓     | Financial reports
treatments:view_all        | ✓     | Cost history
orders:view                | ✓     | Supply expenses
patients:view              | ✓     | Patient financial records
appointments:view_all      | ✓     | Appointment → billing
inventory:view             | ✓     | Cost tracking
settings:view              | ✗     | Not needed
users:view                 | ✗     | Not their responsibility
chat:view                  | ✓     | Client communication (invoicing)
chat:reply                 | ✓     | Answer billing questions
```

**Permissions Count**: 10/25 (40% of admin)

**Use Case**:

```typescript
const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  // ... existing roles ...

  billing_manager: [
    'dashboard:view',
    'analytics:view', // Financial dashboards
    'appointments:view_all', // For billing tracking
    'patients:view', // Patient account info
    'treatments:view_all', // Treatment costs
    'orders:view', // Expense tracking
    'inventory:view', // Cost of materials
    'chat:view',
    'chat:reply',
  ],
}
```

**Database Change**:

```sql
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN (..., 'billing_manager'));
```

**Implementation Effort**: 1-2 hours

- Add role to ROLE_PERMISSIONS
- Add role to ADMIN_ROLES type
- Add to database constraint
- Update nav permissions
- Add role badge styling

---

### Option 2: Add Inventory Coordinator Role (For Larger Clinics)

**Role Name**: `inventory_manager`

**Position**: Inventory/Supply Chain Coordinator

**Permissions** (Specialized):

```
Permission                 | Grant? | Reason
───────────────────────────────────────────
dashboard:view             | ✓     | Stock overview
inventory:view             | ✓     | Full material list
inventory:edit             | ✓     | Stock level management
materials:manage           | ✓     | (future) Add/remove materials
orders:view                | ✓     | Order history
orders:create              | ✓     | Create purchase orders
orders:approve             | ✗     | Need manager approval
orders:delete              | ✗     | Only admin can delete
chat:view                  | ✓     | Supplier communication
chat:reply                 | ✓     | Supplier coordination
(all clinical)             | ✗     | No clinical access
```

**Permissions Count**: 8/25 (32% of admin)

**Use Case**:

```typescript
const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  inventory_manager: [
    'dashboard:view',
    'inventory:view',
    'inventory:edit',
    'orders:view',
    'orders:create',
    'chat:view',
    'chat:reply',
  ],
}
```

**Business Impact**:

- Frees senior_assistant from inventory duties
- Pure operational role without clinical access
- Better separation of concerns

**Implementation Effort**: 1-2 hours

**Caveat**: Requires refactoring senior_assistant permissions

```typescript
// Before:
senior_assistant: [
  'inventory:view',
  'inventory:edit',
  'orders:view',
  'orders:create',
  'orders:approve',
  // + clinical permissions
]

// After (if inventory_manager added):
senior_assistant: [
  // keeps clinical permissions
  // keeps orders:approve
  // loses inventory:edit (delegation)
]
```

---

### Option 3: Add Analytics/Report Role (For Data-Driven Clinics)

**Role Name**: `analyst`

**Position**: Practice Analyst/Business Intelligence

**Permissions** (Read-Only):

```
Permission                 | Grant? | Reason
───────────────────────────────────────────
dashboard:view             | ✓     | KPI dashboard
analytics:view             | ✓     | Full analytics
appointments:view_all      | ✓     | For reporting
patients:view              | ✓     | Demographics
treatments:view_all        | ✓     | Clinical outcomes
orders:view                | ✓     | Supply analysis
inventory:view             | ✓     | Stock analysis
(all write permissions)    | ✗     | Read-only
(chat, users, settings)    | ✗     | Not relevant
```

**Permissions Count**: 7/25 (28% of admin)

**Use Case**:

```typescript
const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  analyst: [
    'dashboard:view',
    'analytics:view',
    'appointments:view_all',
    'patients:view',
    'treatments:view_all',
    'orders:view',
    'inventory:view',
  ],
}
```

**Business Impact**:

- Practice manager can delegate reporting
- Data-driven decision making
- Compliance audits easier (dedicated analyst)

**Implementation Effort**: 1 hour

---

## Role Addition Strategy

### Recommended Path: Phased Implementation

**Phase 1 (Immediate)**: Add `billing_manager` role

- ✅ Highest demand (most clinics need billing separation)
- ✅ Minimal database changes
- ✅ Low implementation risk
- ✅ Improves security (separation of duties)

**Phase 2 (Optional)**: Add `inventory_manager` role

- Conditional on whether clinic does own inventory
- Requires refactoring senior_assistant
- Useful for clinics with >2 inventory staff
- Skip if using hybrid approach (senior_assistant + assistant)

**Phase 3 (Optional)**: Add `analyst` role

- For practices using analytics for decisions
- Lower priority (secondary feature)
- Can be added independently

### Backwards Compatibility

All new roles are **fully backwards compatible**:

- Existing 7 roles remain unchanged
- New roles are optional (clinics can ignore)
- Can be added to database without migrations to existing data
- No breaking changes to API

---

## Implementation Checklist for billing_manager

### Code Changes Required

1. **src/lib/permissions.ts**
   - Add `'billing_manager'` to `ADMIN_ROLES` type
   - Add permissions array to `ROLE_PERMISSIONS`
   - Add styling to `ROLE_BADGE_CLASSES`
   - No changes to helpers

2. **Database Migration**

   ```sql
   ALTER TABLE admin_users
     DROP CONSTRAINT admin_users_role_check;

   ALTER TABLE admin_users
     ADD CONSTRAINT admin_users_role_check
     CHECK (role IN (
       'superadmin', 'admin', 'receptionist', 'doctor',
       'senior_assistant', 'assistant', 'staff',
       'billing_manager'  -- NEW
     ));
   ```

3. **App Routes** (if billing-specific pages added):
   - `/admin/billing` (optional future feature)
   - Add navigation item in AdminLayoutClient

4. **Tests**
   - Add billing_manager test case to RBAC test suite
   - Verify cannot access restricted pages

### Database Constraints

**No RLS changes needed**:

- RLS policies check `current_user_role() IN ('admin', 'superadmin', ...)`
- Can include billing_manager in condition if needed
- Or keep admin-only if financial data is sensitive

### Testing

```typescript
// Test 1: billing_manager has analytics access
expect(hasPermission('billing_manager', 'analytics:view')).toBe(true)

// Test 2: billing_manager cannot create users
expect(hasPermission('billing_manager', 'users:manage')).toBe(false)

// Test 3: billing_manager cannot approve orders
expect(hasPermission('billing_manager', 'orders:approve')).toBe(false)

// Test 4: billing_manager can view treatments (for costing)
expect(hasPermission('billing_manager', 'treatments:view_all')).toBe(true)
```

---

## Comparison: Current 7 Roles vs. Proposed 10 Roles

### Current System (7 Roles)

```
superadmin      (24 perms)
├── admin        (23 perms)
│   ├── receptionist  (11 perms)
│   ├── doctor        (11 perms, scoped)
│   ├── senior_assistant (12 perms, mixed)
│   ├── assistant     (11 perms)
│   └── staff         (11 perms)
```

**Pros**:

- ✅ Simple, covers most clinics
- ✅ Clear hierarchy
- ✅ All permissions accounted for
- ✅ 7 roles = manageable

**Cons**:

- ❌ No dedicated billing role (admin overloaded)
- ❌ No pure inventory manager
- ❌ No analyst role
- ❌ senior_assistant mixed clinical + operational

### Proposed System (10 Roles)

```
superadmin      (24 perms)
├── admin        (23 perms)
│   ├── receptionist     (11 perms)
│   ├── doctor           (11 perms, scoped)
│   ├── senior_assistant (refactored)
│   ├── assistant        (11 perms)
│   ├── staff            (11 perms)
│   ├── billing_manager  (10 perms) [NEW]
│   ├── inventory_manager (8 perms) [NEW, optional]
│   └── analyst          (7 perms) [NEW, optional]
```

**Pros**:

- ✅ Specialized roles for different functions
- ✅ Better separation of concerns
- ✅ Improved security (least privilege)
- ✅ Supports clinic growth
- ✅ Backwards compatible

**Cons**:

- ❌ More roles = more complex
- ❌ Need docs/training
- ❌ Requires careful permission design

---

## Size-Based Recommendations

### Small Clinic (1-2 doctors)

**Use**: Current 7-role system

- superadmin (owner)
- admin (manager)
- doctor (1-2)
- assistant + senior_assistant
- receptionist
- Result: Lean, all-in-one roles

### Medium Clinic (3-5 doctors)

**Add**: `billing_manager` role

- Separate financial from operations
- Receptionist focused on scheduling
- Senior_assistant focused on clinical
- Result: 8 roles, clear separation

### Large Clinic (6+ doctors, multiple locations)

**Add**: `billing_manager` + `inventory_manager` + `analyst`

- Full specialization by function
- Scalable across locations
- Clear reporting structure
- Result: 10 specialized roles

---

## Recommendation

**For DentalStory v3.0**:

### Immediately Add (Phase 1)

✅ **billing_manager** role

- 1-2 hours implementation
- Benefits all clinics
- Improves security
- No breaking changes
- Highly requested in similar systems

### Defer to v3.1 (Phase 2)

⏱️ **inventory_manager** + **analyst** roles

- Lower priority (nice-to-have)
- Can be added later
- Requires more consideration
- Optional for specialized clinics

---

## Risk Assessment

### Adding New Roles: LOW RISK

✅ **No breaking changes**

- Existing roles unchanged
- Optional to use
- Can disable in settings

✅ **Minimal code impact**

- Only changes to permissions.ts
- Single database migration
- No API changes

✅ **Easy to test**

- Permission checks are testable
- Can add unit tests
- No complex logic

⚠️ **Moderate effort**

- ~2-3 hours per role
- Requires careful permission design
- Need documentation

---

## Conclusion

**Current 7-role system is good but can be improved.**

**Recommendation**:

1. ✅ **Add `billing_manager`** (recommended, low risk, high value)
2. ⏱️ **Defer `inventory_manager` + `analyst`** (good to have, lower priority)

This provides flexibility for growing practices while maintaining simplicity for small clinics.

---

**Report Date**: 2026-04-08  
**Status**: Ready for Implementation  
**Priority**: Medium (Phase 1)  
**Estimated Effort**: 2 hours for billing_manager role
