import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  canAccessNavItem,
  isManagementRole,
  hasDoctorScope,
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
} from './permissions'
import type { AdminRole } from './permissions'

describe('RBAC System - New Roles (v3.0)', () => {
  // ─── Phase 1: billing_manager Role ───────────────────────────────────
  describe('billing_manager role', () => {
    const role: AdminRole = 'billing_manager'

    it('should have exactly 9 permissions', () => {
      expect(ROLE_PERMISSIONS[role]).toHaveLength(9)
    })

    it('should have dashboard:view permission', () => {
      expect(hasPermission(role, 'dashboard:view')).toBe(true)
    })

    it('should have analytics:view permission', () => {
      expect(hasPermission(role, 'analytics:view')).toBe(true)
    })

    it('should have appointments:view_all permission', () => {
      expect(hasPermission(role, 'appointments:view_all')).toBe(true)
    })

    it('should have patients:view permission', () => {
      expect(hasPermission(role, 'patients:view')).toBe(true)
    })

    it('should have treatments:view_all permission', () => {
      expect(hasPermission(role, 'treatments:view_all')).toBe(true)
    })

    it('should have orders:view permission', () => {
      expect(hasPermission(role, 'orders:view')).toBe(true)
    })

    it('should have inventory:view permission', () => {
      expect(hasPermission(role, 'inventory:view')).toBe(true)
    })

    it('should have chat:view and chat:reply permissions', () => {
      expect(hasPermission(role, 'chat:view')).toBe(true)
      expect(hasPermission(role, 'chat:reply')).toBe(true)
    })

    // Denied permissions
    it('should NOT have users:manage permission', () => {
      expect(hasPermission(role, 'users:manage')).toBe(false)
    })

    it('should NOT have orders:approve permission', () => {
      expect(hasPermission(role, 'orders:approve')).toBe(false)
    })

    it('should NOT have inventory:edit permission', () => {
      expect(hasPermission(role, 'inventory:edit')).toBe(false)
    })

    it('should NOT have settings:edit permission', () => {
      expect(hasPermission(role, 'settings:edit')).toBe(false)
    })

    it('should NOT have appointments:create permission', () => {
      expect(hasPermission(role, 'appointments:create')).toBe(false)
    })

    it('should NOT have patients:edit permission', () => {
      expect(hasPermission(role, 'patients:edit')).toBe(false)
    })

    it('should NOT be a management role', () => {
      expect(isManagementRole(role)).toBe(false)
    })

    it('should NOT have doctor scope', () => {
      expect(hasDoctorScope(role)).toBe(false)
    })

    it('should access /admin dashboard', () => {
      expect(canAccessNavItem(role, '/admin')).toBe(true)
    })

    it('should access /admin/analytics', () => {
      expect(canAccessNavItem(role, '/admin/analytics')).toBe(true)
    })

    it('should access /admin/appointments', () => {
      expect(canAccessNavItem(role, '/admin/appointments')).toBe(true)
    })

    it('should access /admin/treatments', () => {
      expect(canAccessNavItem(role, '/admin/treatments')).toBe(true)
    })

    it('should access /admin/patients', () => {
      expect(canAccessNavItem(role, '/admin/patients')).toBe(true)
    })

    it('should access /admin/orders', () => {
      expect(canAccessNavItem(role, '/admin/orders')).toBe(true)
    })

    it('should access /admin/materials', () => {
      expect(canAccessNavItem(role, '/admin/materials')).toBe(true)
    })

    it('should access /admin/chat', () => {
      expect(canAccessNavItem(role, '/admin/chat')).toBe(true)
    })

    it('should NOT access /admin/users', () => {
      expect(canAccessNavItem(role, '/admin/users')).toBe(false)
    })

    it('should NOT access /admin/settings', () => {
      expect(canAccessNavItem(role, '/admin/settings')).toBe(false)
    })
  })

  // ─── Phase 2: inventory_manager Role ──────────────────────────────────
  describe('inventory_manager role', () => {
    const role: AdminRole = 'inventory_manager'

    it('should have exactly 7 permissions', () => {
      expect(ROLE_PERMISSIONS[role]).toHaveLength(7)
    })

    it('should have inventory:view and inventory:edit permissions', () => {
      expect(hasPermission(role, 'inventory:view')).toBe(true)
      expect(hasPermission(role, 'inventory:edit')).toBe(true)
    })

    it('should have orders:view and orders:create permissions', () => {
      expect(hasPermission(role, 'orders:view')).toBe(true)
      expect(hasPermission(role, 'orders:create')).toBe(true)
    })

    it('should have chat:view and chat:reply permissions', () => {
      expect(hasPermission(role, 'chat:view')).toBe(true)
      expect(hasPermission(role, 'chat:reply')).toBe(true)
    })

    it('should have dashboard:view permission', () => {
      expect(hasPermission(role, 'dashboard:view')).toBe(true)
    })

    // Denied permissions
    it('should NOT have orders:approve permission', () => {
      expect(hasPermission(role, 'orders:approve')).toBe(false)
    })

    it('should NOT have analytics:view permission', () => {
      expect(hasPermission(role, 'analytics:view')).toBe(false)
    })

    it('should NOT have treatments:view_all permission', () => {
      expect(hasPermission(role, 'treatments:view_all')).toBe(false)
    })

    it('should NOT have appointments:view_all permission', () => {
      expect(hasPermission(role, 'appointments:view_all')).toBe(false)
    })

    it('should NOT have patients:view permission', () => {
      expect(hasPermission(role, 'patients:view')).toBe(false)
    })

    it('should NOT have users:manage permission', () => {
      expect(hasPermission(role, 'users:manage')).toBe(false)
    })

    it('should NOT be a management role', () => {
      expect(isManagementRole(role)).toBe(false)
    })

    it('should access /admin/materials', () => {
      expect(canAccessNavItem(role, '/admin/materials')).toBe(true)
    })

    it('should access /admin/orders', () => {
      expect(canAccessNavItem(role, '/admin/orders')).toBe(true)
    })

    it('should NOT access /admin/analytics', () => {
      expect(canAccessNavItem(role, '/admin/analytics')).toBe(false)
    })

    it('should NOT access /admin/treatments', () => {
      expect(canAccessNavItem(role, '/admin/treatments')).toBe(false)
    })

    it('should NOT access /admin/patients', () => {
      expect(canAccessNavItem(role, '/admin/patients')).toBe(false)
    })
  })

  // ─── Phase 2: analyst Role ───────────────────────────────────────────
  describe('analyst role', () => {
    const role: AdminRole = 'analyst'

    it('should have exactly 9 permissions', () => {
      expect(ROLE_PERMISSIONS[role]).toHaveLength(9)
    })

    it('should have analytics:view permission', () => {
      expect(hasPermission(role, 'analytics:view')).toBe(true)
    })

    it('should have appointments:view_all permission', () => {
      expect(hasPermission(role, 'appointments:view_all')).toBe(true)
    })

    it('should have patients:view permission', () => {
      expect(hasPermission(role, 'patients:view')).toBe(true)
    })

    it('should have treatments:view_all permission', () => {
      expect(hasPermission(role, 'treatments:view_all')).toBe(true)
    })

    it('should have orders:view permission', () => {
      expect(hasPermission(role, 'orders:view')).toBe(true)
    })

    it('should have inventory:view permission', () => {
      expect(hasPermission(role, 'inventory:view')).toBe(true)
    })

    it('should have chat:view and chat:reply permissions (v3.0.1 fix)', () => {
      expect(hasPermission(role, 'chat:view')).toBe(true)
      expect(hasPermission(role, 'chat:reply')).toBe(true)
    })

    it('should have dashboard:view permission', () => {
      expect(hasPermission(role, 'dashboard:view')).toBe(true)
    })

    // Denied permissions - read-only enforcement
    it('should NOT have any write permissions', () => {
      expect(hasPermission(role, 'appointments:create')).toBe(false)
      expect(hasPermission(role, 'appointments:edit')).toBe(false)
      expect(hasPermission(role, 'appointments:cancel')).toBe(false)
      expect(hasPermission(role, 'patients:edit')).toBe(false)
      expect(hasPermission(role, 'patients:delete')).toBe(false)
      expect(hasPermission(role, 'treatments:create')).toBe(false)
      expect(hasPermission(role, 'treatments:sign')).toBe(false)
      expect(hasPermission(role, 'treatments:edit_draft')).toBe(false)
      expect(hasPermission(role, 'inventory:edit')).toBe(false)
      expect(hasPermission(role, 'orders:create')).toBe(false)
      expect(hasPermission(role, 'orders:approve')).toBe(false)
      expect(hasPermission(role, 'orders:delete')).toBe(false)
    })

    it('should NOT have users:manage permission', () => {
      expect(hasPermission(role, 'users:manage')).toBe(false)
    })

    it('should NOT have settings:edit permission', () => {
      expect(hasPermission(role, 'settings:edit')).toBe(false)
    })

    it('should NOT be a management role', () => {
      expect(isManagementRole(role)).toBe(false)
    })

    it('should access /admin/analytics', () => {
      expect(canAccessNavItem(role, '/admin/analytics')).toBe(true)
    })

    it('should access /admin/appointments', () => {
      expect(canAccessNavItem(role, '/admin/appointments')).toBe(true)
    })

    it('should access /admin/treatments', () => {
      expect(canAccessNavItem(role, '/admin/treatments')).toBe(true)
    })

    it('should access /admin/patients', () => {
      expect(canAccessNavItem(role, '/admin/patients')).toBe(true)
    })

    it('should access /admin/orders', () => {
      expect(canAccessNavItem(role, '/admin/orders')).toBe(true)
    })

    it('should access /admin/materials', () => {
      expect(canAccessNavItem(role, '/admin/materials')).toBe(true)
    })

    it('should access /admin/chat', () => {
      expect(canAccessNavItem(role, '/admin/chat')).toBe(true)
    })

    it('should NOT access /admin/users', () => {
      expect(canAccessNavItem(role, '/admin/users')).toBe(false)
    })

    it('should NOT access /admin/settings', () => {
      expect(canAccessNavItem(role, '/admin/settings')).toBe(false)
    })
  })

  // ─── System-wide Tests ──────────────────────────────────────────────
  describe('ADMIN_ROLES constant', () => {
    it('should include all 10 roles', () => {
      expect(ADMIN_ROLES).toHaveLength(10)
    })

    it('should include original 7 roles', () => {
      expect(ADMIN_ROLES).toContain('superadmin')
      expect(ADMIN_ROLES).toContain('admin')
      expect(ADMIN_ROLES).toContain('receptionist')
      expect(ADMIN_ROLES).toContain('doctor')
      expect(ADMIN_ROLES).toContain('senior_assistant')
      expect(ADMIN_ROLES).toContain('assistant')
      expect(ADMIN_ROLES).toContain('staff')
    })

    it('should include all new roles', () => {
      expect(ADMIN_ROLES).toContain('billing_manager')
      expect(ADMIN_ROLES).toContain('inventory_manager')
      expect(ADMIN_ROLES).toContain('analyst')
    })
  })

  describe('ROLE_PERMISSIONS matrix', () => {
    it('should have permissions defined for all 10 roles', () => {
      ADMIN_ROLES.forEach(role => {
        expect(ROLE_PERMISSIONS[role as AdminRole]).toBeDefined()
        expect(Array.isArray(ROLE_PERMISSIONS[role as AdminRole])).toBe(true)
        expect(
          (ROLE_PERMISSIONS[role as AdminRole] as readonly string[]).length
        ).toBeGreaterThan(0)
      })
    })

    it('should enforce least privilege - no new roles exceed original permissions', () => {
      const newRoles: AdminRole[] = [
        'billing_manager',
        'inventory_manager',
        'analyst',
      ]
      const adminPerms = (ROLE_PERMISSIONS['admin'] as readonly string[]).length

      newRoles.forEach(role => {
        const rolePerms = (ROLE_PERMISSIONS[role] as readonly string[]).length
        expect(rolePerms).toBeLessThanOrEqual(adminPerms)
      })
    })
  })

  describe('Separation of Duties', () => {
    it('receptionist should NOT have orders:view (v3.0.1 fix)', () => {
      expect(hasPermission('receptionist', 'orders:view')).toBe(false)
      expect(canAccessNavItem('receptionist', '/admin/orders')).toBe(false)
    })

    it('billing_manager should NOT have orders:approve (stays with senior_assistant)', () => {
      expect(hasPermission('billing_manager', 'orders:approve')).toBe(false)
      expect(hasPermission('senior_assistant', 'orders:approve')).toBe(true)
    })

    it('inventory_manager should NOT have analytics:view (stays with billing_manager)', () => {
      expect(hasPermission('inventory_manager', 'analytics:view')).toBe(false)
      expect(hasPermission('billing_manager', 'analytics:view')).toBe(true)
    })

    it('analyst should NOT have orders:create (stays with inventory_manager)', () => {
      expect(hasPermission('analyst', 'orders:create')).toBe(false)
      expect(hasPermission('inventory_manager', 'orders:create')).toBe(true)
    })

    it('inventory_manager should NOT have treatments:view_all (no clinical access)', () => {
      expect(hasPermission('inventory_manager', 'treatments:view_all')).toBe(
        false
      )
    })

    it('admin should have users:manage (v3.0.1 fix)', () => {
      expect(hasPermission('admin', 'users:view')).toBe(true)
      expect(hasPermission('admin', 'users:manage')).toBe(true)
      expect(canAccessNavItem('admin', '/admin/users')).toBe(true)
    })

    it('billing_manager should NOT have users:manage (stays with admin/superadmin)', () => {
      expect(hasPermission('billing_manager', 'users:manage')).toBe(false)
      expect(hasPermission('admin', 'users:manage')).toBe(true)
      expect(hasPermission('superadmin', 'users:manage')).toBe(true)
    })
  })

  describe('Backwards Compatibility', () => {
    it('original 7 roles should have unchanged permissions', () => {
      // This test documents that original roles haven't changed
      // Permission counts from actual implementation:
      const expectedCounts: Record<AdminRole, number> = {
        superadmin: 25,
        admin: 24, // v3.0.1: added users:manage (was 23)
        receptionist: 10, // v3.0.1: removed orders:view (was 11)
        doctor: 12,
        senior_assistant: 12,
        assistant: 10,
        staff: 10,
        billing_manager: 9,
        inventory_manager: 7,
        analyst: 9, // v3.0.1: added chat:view and chat:reply (was 7)
      }

      ADMIN_ROLES.forEach(role => {
        const perms = (ROLE_PERMISSIONS[role as AdminRole] as readonly string[])
          .length
        expect(perms).toBe(expectedCounts[role as AdminRole])
      })
    })
  })
})
