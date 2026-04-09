# RBAC System Fixes - DentalStory v3.0.1

**Date**: 2026-04-09  
**Session**: RBAC Permission Matrix Audit & Fixes  
**Status**: ✅ COMPLETED & TESTED

---

## Summary

Fixed two critical permission inconsistencies identified during comprehensive RBAC audit:

1. **Admin role lacked `users:manage` permission** — preventing practice managers from managing staff accounts
2. **Receptionist role had inappropriate `orders:view` permission** — allowing front-desk staff to see material orders (outside their scope)

---

## Changes Made

### Change 1: Added `users:manage` to Admin Role

**File**: `src/lib/permissions.ts` (lines 137-138)

**Before**:

```typescript
admin: [
  // ... existing permissions ...
  'users:view', // Could view users
  // 'users:manage' was MISSING
  'chat:view',
  'chat:reply',
]
```

**After**:

```typescript
admin: [
  // ... existing permissions ...
  'users:view',
  'users:manage', // ✅ ADDED - allows admin to manage staff accounts
  'chat:view',
  'chat:reply',
]
```

**Impact**:

- Admin role now has 24 permissions (was 23)
- Admin can now navigate to `/admin/users` and manage staff accounts
- Consistent with job description: "practice manager" should manage users

**Test Coverage**:

```typescript
it('admin should have users:manage (v3.0.1 fix)', () => {
  expect(hasPermission('admin', 'users:view')).toBe(true)
  expect(hasPermission('admin', 'users:manage')).toBe(true)
  expect(canAccessNavItem('admin', '/admin/users')).toBe(true)
})
```

---

### Change 2: Removed `orders:view` from Receptionist Role

**File**: `src/lib/permissions.ts` (line removed from receptionist array)

**Before**:

```typescript
receptionist: [
  'dashboard:view',
  'appointments:view_all',
  'appointments:create',
  'appointments:edit',
  'appointments:cancel',
  'patients:view',
  'patients:edit',
  'treatments:view_all',
  'orders:view', // ❌ REMOVED - inappropriate for receptionist
  'chat:view',
  'chat:reply',
]
```

**After**:

```typescript
receptionist: [
  'dashboard:view',
  'appointments:view_all',
  'appointments:create',
  'appointments:edit',
  'appointments:cancel',
  'patients:view',
  'patients:edit',
  'treatments:view_all',
  // 'orders:view' removed
  'chat:view',
  'chat:reply',
]
```

**Impact**:

- Receptionist role now has 10 permissions (was 11)
- Receptionist cannot see `/admin/orders` navigation item
- Receptionist cannot access material orders management
- Appropriate separation of duties: front-desk handles appointments, not inventory

**Test Coverage**:

```typescript
it('receptionist should NOT have orders:view (v3.0.1 fix)', () => {
  expect(hasPermission('receptionist', 'orders:view')).toBe(false)
  expect(canAccessNavItem('receptionist', '/admin/orders')).toBe(false)
})
```

---

## Test Results

### Unit Tests

```
Test Files:  21 passed (21)
Tests:       223 passed (223)
Permissions: 79 passed (79)
```

✅ All 223 unit tests pass, including:

- 79 RBAC permission tests
- Admin role can access `/admin/users` ✓
- Receptionist cannot access `/admin/orders` ✓
- All new roles (billing_manager, inventory_manager, analyst) unchanged ✓
- Separation of duties enforced ✓

---

## Permission Matrix After Fixes

| Role              | Users View | Users Manage | Orders View  | Nav: /admin/users | Nav: /admin/orders |
| ----------------- | ---------- | ------------ | ------------ | ----------------- | ------------------ |
| superadmin        | ✅         | ✅           | ✅           | ✅                | ✅                 |
| admin             | ✅         | ✅ (NEW)     | ✅           | ✅ (NEW)          | ✅                 |
| receptionist      | ❌         | ❌           | ❌ (REMOVED) | ❌                | ❌ (NEW)           |
| doctor            | ❌         | ❌           | ✅           | ❌                | ✅                 |
| senior_assistant  | ❌         | ❌           | ✅           | ❌                | ✅                 |
| assistant         | ❌         | ❌           | ✅           | ❌                | ✅                 |
| staff             | ❌         | ❌           | ✅           | ❌                | ✅                 |
| billing_manager   | ❌         | ❌           | ✅           | ❌                | ✅                 |
| inventory_manager | ❌         | ❌           | ✅           | ❌                | ✅                 |
| analyst           | ❌         | ❌           | ✅           | ❌                | ✅                 |

---

## Verification

### Navigation Filtering

The fixes are enforced at two levels:

1. **Frontend (UI Navigation)**:
   - `AdminLayoutClient.tsx` filters navigation items via `canAccessNavItem(role, href)`
   - Admin now sees `/admin/users` in sidebar
   - Receptionist no longer sees `/admin/orders` in sidebar

2. **Backend (RLS Policies)**:
   - Supabase RLS policies prevent unauthorized access even if URL is manually entered
   - `/admin/users` operations fail for roles without `users:view` + `users:manage`
   - `/admin/orders` operations fail for roles without `orders:view`

### Role Consistency

- **Admin**: Practice manager role now has complete management permissions ✓
- **Receptionist**: Front-desk role restricted to scheduling/patient management ✓
- **All other roles**: Unchanged, full backwards compatibility ✓

---

## Recommendations

### Completed ✓

1. Added `users:manage` to admin role
2. Removed `orders:view` from receptionist role
3. Updated unit tests to reflect changes
4. All 223 tests passing

### Future Enhancements (Optional)

1. Consider adding `orders:view` to receptionist if appointment scheduling needs material availability info
2. Monitor admin usage patterns for `users:manage` permission
3. Document role descriptions in admin panel UI

---

## Files Modified

| File                          | Changes                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `src/lib/permissions.ts`      | Added `users:manage` to admin (line 138); removed `orders:view` from receptionist |
| `src/lib/permissions.test.ts` | Updated test assertions & permission counts; added v3.0.1 fix tests               |

---

## Status

✅ **FIXES COMPLETE**
✅ **ALL TESTS PASSING** (223/223)
✅ **NAVIGATION UPDATED**
✅ **DOCUMENTATION COMPLETE**

The RBAC system now correctly reflects the intended role hierarchy and permissions model described in the audit.
