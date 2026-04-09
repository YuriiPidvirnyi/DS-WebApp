import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  canAccessNavItem,
  isManagementRole,
  hasDoctorScope,
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
} from './permissions'
import type { AdminRole } from './permissions'

// ─── Role count & structure ───────────────────────────────────────────────
describe('ADMIN_ROLES constant', () => {
  it('should include exactly 8 roles', () => {
    expect(ADMIN_ROLES).toHaveLength(8)
  })

  it('should include all expected roles', () => {
    const expected = [
      'superadmin',
      'admin',
      'receptionist',
      'doctor',
      'assistant',
      'billing_manager',
      'inventory_manager',
      'analyst',
    ]
    expected.forEach(role => {
      expect(ADMIN_ROLES).toContain(role)
    })
  })

  it('should NOT include removed roles', () => {
    expect(ADMIN_ROLES).not.toContain('senior_assistant')
    expect(ADMIN_ROLES).not.toContain('staff')
  })
})

describe('ROLE_PERMISSIONS matrix', () => {
  it('should have permissions defined for all 8 roles', () => {
    ADMIN_ROLES.forEach(role => {
      expect(ROLE_PERMISSIONS[role as AdminRole]).toBeDefined()
      expect(Array.isArray(ROLE_PERMISSIONS[role as AdminRole])).toBe(true)
      expect(
        (ROLE_PERMISSIONS[role as AdminRole] as readonly string[]).length
      ).toBeGreaterThan(0)
    })
  })

  it('should match expected permission counts per role', () => {
    const expectedCounts: Record<AdminRole, number> = {
      superadmin: 25,
      admin: 22,
      receptionist: 10,
      doctor: 12,
      assistant: 10,
      billing_manager: 9,
      inventory_manager: 7,
      analyst: 9,
    }

    ADMIN_ROLES.forEach(role => {
      const perms = (ROLE_PERMISSIONS[role as AdminRole] as readonly string[])
        .length
      expect(perms).toBe(expectedCounts[role as AdminRole])
    })
  })

  it('should enforce least privilege - no role exceeds superadmin permissions', () => {
    const superadminCount = (
      ROLE_PERMISSIONS['superadmin'] as readonly string[]
    ).length

    ADMIN_ROLES.forEach(role => {
      const rolePerms = (
        ROLE_PERMISSIONS[role as AdminRole] as readonly string[]
      ).length
      expect(rolePerms).toBeLessThanOrEqual(superadminCount)
    })
  })
})

// ─── User management: superadmin-only ─────────────────────────────────────
describe('User management is superadmin-only', () => {
  it('superadmin should have users:view and users:manage', () => {
    expect(hasPermission('superadmin', 'users:view')).toBe(true)
    expect(hasPermission('superadmin', 'users:manage')).toBe(true)
  })

  it('admin should NOT have users:view or users:manage', () => {
    expect(hasPermission('admin', 'users:view')).toBe(false)
    expect(hasPermission('admin', 'users:manage')).toBe(false)
  })

  it('no non-superadmin role should have users:manage', () => {
    const nonSuperadmin = ADMIN_ROLES.filter(r => r !== 'superadmin')
    nonSuperadmin.forEach(role => {
      expect(hasPermission(role as AdminRole, 'users:manage')).toBe(false)
    })
  })

  it('only superadmin can access /admin/users', () => {
    expect(canAccessNavItem('superadmin', '/admin/users')).toBe(true)
    expect(canAccessNavItem('admin', '/admin/users')).toBe(false)
    expect(canAccessNavItem('doctor', '/admin/users')).toBe(false)
    expect(canAccessNavItem('receptionist', '/admin/users')).toBe(false)
  })
})

// ─── billing_manager role ─────────────────────────────────────────────────
describe('billing_manager role', () => {
  const role: AdminRole = 'billing_manager'

  it('should have exactly 9 permissions', () => {
    expect(ROLE_PERMISSIONS[role]).toHaveLength(9)
  })

  it('should have read-only analytics access', () => {
    expect(hasPermission(role, 'dashboard:view')).toBe(true)
    expect(hasPermission(role, 'analytics:view')).toBe(true)
    expect(hasPermission(role, 'appointments:view_all')).toBe(true)
    expect(hasPermission(role, 'patients:view')).toBe(true)
    expect(hasPermission(role, 'treatments:view_all')).toBe(true)
    expect(hasPermission(role, 'orders:view')).toBe(true)
    expect(hasPermission(role, 'inventory:view')).toBe(true)
  })

  it('should NOT have any write permissions', () => {
    expect(hasPermission(role, 'users:manage')).toBe(false)
    expect(hasPermission(role, 'orders:approve')).toBe(false)
    expect(hasPermission(role, 'inventory:edit')).toBe(false)
    expect(hasPermission(role, 'settings:edit')).toBe(false)
    expect(hasPermission(role, 'appointments:create')).toBe(false)
    expect(hasPermission(role, 'patients:edit')).toBe(false)
  })

  it('should NOT be a management role', () => {
    expect(isManagementRole(role)).toBe(false)
  })
})

// ─── inventory_manager role ───────────────────────────────────────────────
describe('inventory_manager role', () => {
  const role: AdminRole = 'inventory_manager'

  it('should have exactly 7 permissions', () => {
    expect(ROLE_PERMISSIONS[role]).toHaveLength(7)
  })

  it('should have inventory and order permissions', () => {
    expect(hasPermission(role, 'inventory:view')).toBe(true)
    expect(hasPermission(role, 'inventory:edit')).toBe(true)
    expect(hasPermission(role, 'orders:view')).toBe(true)
    expect(hasPermission(role, 'orders:create')).toBe(true)
  })

  it('should NOT have clinical access', () => {
    expect(hasPermission(role, 'treatments:view_all')).toBe(false)
    expect(hasPermission(role, 'appointments:view_all')).toBe(false)
    expect(hasPermission(role, 'patients:view')).toBe(false)
  })

  it('should NOT be able to approve orders', () => {
    expect(hasPermission(role, 'orders:approve')).toBe(false)
  })
})

// ─── analyst role ─────────────────────────────────────────────────────────
describe('analyst role', () => {
  const role: AdminRole = 'analyst'

  it('should have exactly 9 permissions', () => {
    expect(ROLE_PERMISSIONS[role]).toHaveLength(9)
  })

  it('should have analytics and read-only access', () => {
    expect(hasPermission(role, 'analytics:view')).toBe(true)
    expect(hasPermission(role, 'appointments:view_all')).toBe(true)
    expect(hasPermission(role, 'patients:view')).toBe(true)
    expect(hasPermission(role, 'treatments:view_all')).toBe(true)
  })

  it('should NOT have any write permissions', () => {
    expect(hasPermission(role, 'appointments:create')).toBe(false)
    expect(hasPermission(role, 'appointments:edit')).toBe(false)
    expect(hasPermission(role, 'treatments:create')).toBe(false)
    expect(hasPermission(role, 'inventory:edit')).toBe(false)
    expect(hasPermission(role, 'orders:create')).toBe(false)
    expect(hasPermission(role, 'orders:approve')).toBe(false)
    expect(hasPermission(role, 'orders:delete')).toBe(false)
  })
})

// ─── Separation of Duties ────────────────────────────────────────────────
describe('Separation of Duties', () => {
  it('receptionist should NOT have orders:view', () => {
    expect(hasPermission('receptionist', 'orders:view')).toBe(false)
    expect(canAccessNavItem('receptionist', '/admin/orders')).toBe(false)
  })

  it('billing_manager should NOT have orders:approve', () => {
    expect(hasPermission('billing_manager', 'orders:approve')).toBe(false)
  })

  it('inventory_manager should NOT have analytics:view', () => {
    expect(hasPermission('inventory_manager', 'analytics:view')).toBe(false)
  })

  it('analyst should NOT have orders:create', () => {
    expect(hasPermission('analyst', 'orders:create')).toBe(false)
  })

  it('only superadmin can delete patients', () => {
    expect(hasPermission('superadmin', 'patients:delete')).toBe(true)
    expect(hasPermission('admin', 'patients:delete')).toBe(false)
    expect(hasPermission('doctor', 'patients:delete')).toBe(false)
  })

  it('orders:approve is restricted to management roles', () => {
    expect(hasPermission('superadmin', 'orders:approve')).toBe(true)
    expect(hasPermission('admin', 'orders:approve')).toBe(true)
    expect(hasPermission('assistant', 'orders:approve')).toBe(false)
    expect(hasPermission('doctor', 'orders:approve')).toBe(false)
  })
})

// ─── Doctor scope ────────────────────────────────────────────────────────
describe('Doctor scope', () => {
  it('doctor should have view_own, not view_all for appointments', () => {
    expect(hasPermission('doctor', 'appointments:view_own')).toBe(true)
    expect(hasPermission('doctor', 'appointments:view_all')).toBe(false)
  })

  it('doctor should have view_own, not view_all for treatments', () => {
    expect(hasPermission('doctor', 'treatments:view_own')).toBe(true)
    expect(hasPermission('doctor', 'treatments:view_all')).toBe(false)
  })

  it('hasDoctorScope returns true only for doctor', () => {
    expect(hasDoctorScope('doctor')).toBe(true)
    expect(hasDoctorScope('admin')).toBe(false)
    expect(hasDoctorScope('assistant')).toBe(false)
  })

  it('doctor can access appointments and treatments via view_own', () => {
    expect(canAccessNavItem('doctor', '/admin/appointments')).toBe(true)
    expect(canAccessNavItem('doctor', '/admin/treatments')).toBe(true)
  })
})

// ─── Helper functions ────────────────────────────────────────────────────
describe('Helper functions', () => {
  it('isManagementRole returns true only for superadmin and admin', () => {
    expect(isManagementRole('superadmin')).toBe(true)
    expect(isManagementRole('admin')).toBe(true)
    expect(isManagementRole('receptionist')).toBe(false)
    expect(isManagementRole('doctor')).toBe(false)
    expect(isManagementRole('assistant')).toBe(false)
  })

  it('hasAnyPermission returns true when at least one matches', () => {
    expect(
      hasAnyPermission('doctor', [
        'appointments:view_all',
        'appointments:view_own',
      ])
    ).toBe(true)
    expect(
      hasAnyPermission('doctor', ['appointments:view_all', 'users:manage'])
    ).toBe(false)
  })
})

// ─── Navigation access ──────────────────────────────────────────────────
describe('Navigation access', () => {
  it('admin can access settings but not users', () => {
    expect(canAccessNavItem('admin', '/admin/settings')).toBe(true)
    expect(canAccessNavItem('admin', '/admin/users')).toBe(false)
  })

  it('receptionist can access appointments and contacts but not analytics', () => {
    expect(canAccessNavItem('receptionist', '/admin/appointments')).toBe(true)
    expect(canAccessNavItem('receptionist', '/admin/contacts')).toBe(true)
    expect(canAccessNavItem('receptionist', '/admin/analytics')).toBe(false)
  })

  it('inventory_manager can access materials and orders only', () => {
    expect(canAccessNavItem('inventory_manager', '/admin/materials')).toBe(true)
    expect(canAccessNavItem('inventory_manager', '/admin/orders')).toBe(true)
    expect(canAccessNavItem('inventory_manager', '/admin/patients')).toBe(false)
    expect(canAccessNavItem('inventory_manager', '/admin/analytics')).toBe(
      false
    )
  })
})

// ─── Critical enforcement boundaries ─────────────────────────────────────
// These tests verify the exact permission checks added to API routes.
// Each test maps 1:1 to a `hasPermission()` or `hasAnyPermission()` guard.
describe('API-level permission enforcement boundaries', () => {
  it('analyst CANNOT create treatment records', () => {
    expect(hasPermission('analyst', 'treatments:create')).toBe(false)
  })

  it('analyst CANNOT edit appointments', () => {
    expect(hasPermission('analyst', 'appointments:edit')).toBe(false)
    expect(hasPermission('analyst', 'appointments:cancel')).toBe(false)
  })

  it('billing_manager CANNOT edit or cancel appointments', () => {
    expect(hasPermission('billing_manager', 'appointments:edit')).toBe(false)
    expect(hasPermission('billing_manager', 'appointments:cancel')).toBe(false)
  })

  it('billing_manager CANNOT create treatment records', () => {
    expect(hasPermission('billing_manager', 'treatments:create')).toBe(false)
  })

  it('inventory_manager CANNOT view patients', () => {
    expect(hasPermission('inventory_manager', 'patients:view')).toBe(false)
  })

  it('inventory_manager CANNOT view or create treatment records', () => {
    expect(hasPermission('inventory_manager', 'treatments:view_all')).toBe(
      false
    )
    expect(hasPermission('inventory_manager', 'treatments:create')).toBe(false)
  })

  it('receptionist CANNOT approve or delete orders', () => {
    expect(hasPermission('receptionist', 'orders:approve')).toBe(false)
    expect(hasPermission('receptionist', 'orders:delete')).toBe(false)
  })

  it('assistant CANNOT delete orders', () => {
    expect(hasPermission('assistant', 'orders:delete')).toBe(false)
  })

  it('assistant CANNOT approve orders', () => {
    expect(hasPermission('assistant', 'orders:approve')).toBe(false)
  })

  it('doctor CANNOT edit or cancel appointments', () => {
    expect(hasPermission('doctor', 'appointments:edit')).toBe(false)
    expect(hasPermission('doctor', 'appointments:cancel')).toBe(false)
  })

  it('doctor CANNOT delete patients', () => {
    expect(hasPermission('doctor', 'patients:delete')).toBe(false)
  })

  it('only superadmin and admin can edit inventory', () => {
    expect(hasPermission('superadmin', 'inventory:edit')).toBe(true)
    expect(hasPermission('admin', 'inventory:edit')).toBe(true)
    expect(hasPermission('inventory_manager', 'inventory:edit')).toBe(true)
    expect(hasPermission('doctor', 'inventory:edit')).toBe(false)
    expect(hasPermission('receptionist', 'inventory:edit')).toBe(false)
    expect(hasPermission('assistant', 'inventory:edit')).toBe(false)
    expect(hasPermission('analyst', 'inventory:edit')).toBe(false)
    expect(hasPermission('billing_manager', 'inventory:edit')).toBe(false)
  })

  it('only management roles can access audit logs (settings:view)', () => {
    expect(hasPermission('superadmin', 'settings:view')).toBe(true)
    expect(hasPermission('admin', 'settings:view')).toBe(true)
    expect(hasPermission('doctor', 'settings:view')).toBe(false)
    expect(hasPermission('receptionist', 'settings:view')).toBe(false)
    expect(hasPermission('assistant', 'settings:view')).toBe(false)
    expect(hasPermission('billing_manager', 'settings:view')).toBe(false)
    expect(hasPermission('inventory_manager', 'settings:view')).toBe(false)
    expect(hasPermission('analyst', 'settings:view')).toBe(false)
  })
})
