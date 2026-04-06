/**
 * Role-Based Access Control (RBAC) for DentalStory admin panel.
 *
 * Role hierarchy (highest → lowest):
 *   superadmin > admin > receptionist | doctor | senior_assistant > assistant | staff
 *
 * Roles map to real clinic positions:
 *   superadmin       — practice owner / IT administrator
 *   admin            — practice manager
 *   receptionist     — front-desk / scheduling
 *   doctor           — dentist (sees own patients only by default)
 *   senior_assistant — head dental assistant (can approve orders)
 *   assistant        — dental assistant
 *   staff            — legacy alias for assistant (backwards compat)
 */

export const ADMIN_ROLES = [
  'superadmin',
  'admin',
  'receptionist',
  'doctor',
  'senior_assistant',
  'assistant',
  'staff',
] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

// ─── Permissions ────────────────────────────────────────────────────────────

export const PERMISSIONS = [
  // Dashboard
  'dashboard:view',

  // Appointments
  'appointments:view_all', // see all patients' appointments
  'appointments:view_own', // doctor sees only their own appointments
  'appointments:create',
  'appointments:edit',
  'appointments:cancel',

  // Patients
  'patients:view',
  'patients:edit',
  'patients:delete',

  // Treatment records
  'treatments:view_all',
  'treatments:view_own', // doctor sees own patients only
  'treatments:create',
  'treatments:sign', // mark as signed/completed
  'treatments:edit_draft',

  // Materials & inventory
  'inventory:view',
  'inventory:edit',

  // Material orders
  'orders:view',
  'orders:create',
  'orders:approve', // senior_assistant+ can approve orders
  'orders:delete',

  // Analytics & reports
  'analytics:view',

  // Settings
  'settings:view',
  'settings:edit',

  // User management
  'users:view',
  'users:manage', // create / edit / deactivate staff accounts

  // Chat
  'chat:view',
  'chat:reply',
] as const

export type Permission = (typeof PERMISSIONS)[number]

// ─── Permission matrix ───────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  superadmin: [
    'dashboard:view',
    'appointments:view_all',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'patients:view',
    'patients:edit',
    'patients:delete',
    'treatments:view_all',
    'treatments:create',
    'treatments:sign',
    'treatments:edit_draft',
    'inventory:view',
    'inventory:edit',
    'orders:view',
    'orders:create',
    'orders:approve',
    'orders:delete',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'users:view',
    'users:manage',
    'chat:view',
    'chat:reply',
  ],

  admin: [
    'dashboard:view',
    'appointments:view_all',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'patients:view',
    'patients:edit',
    'treatments:view_all',
    'treatments:create',
    'treatments:sign',
    'treatments:edit_draft',
    'inventory:view',
    'inventory:edit',
    'orders:view',
    'orders:create',
    'orders:approve',
    'orders:delete',
    'analytics:view',
    'settings:view',
    'settings:edit',
    'users:view',
    'chat:view',
    'chat:reply',
  ],

  receptionist: [
    'dashboard:view',
    'appointments:view_all',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'patients:view',
    'patients:edit',
    'treatments:view_all',
    'orders:view',
    'chat:view',
    'chat:reply',
  ],

  doctor: [
    'dashboard:view',
    'appointments:view_own',
    'patients:view',
    'treatments:view_own',
    'treatments:create',
    'treatments:sign',
    'treatments:edit_draft',
    'inventory:view',
    'orders:view',
    'orders:create',
    'chat:view',
    'chat:reply',
  ],

  senior_assistant: [
    'dashboard:view',
    'appointments:view_all',
    'patients:view',
    'treatments:view_all',
    'treatments:edit_draft',
    'inventory:view',
    'inventory:edit',
    'orders:view',
    'orders:create',
    'orders:approve',
    'chat:view',
    'chat:reply',
  ],

  assistant: [
    'dashboard:view',
    'appointments:view_all',
    'patients:view',
    'treatments:view_all',
    'treatments:edit_draft',
    'inventory:view',
    'orders:view',
    'orders:create',
    'chat:view',
    'chat:reply',
  ],

  // Legacy alias — same as assistant
  staff: [
    'dashboard:view',
    'appointments:view_all',
    'patients:view',
    'treatments:view_all',
    'treatments:edit_draft',
    'inventory:view',
    'orders:view',
    'orders:create',
    'chat:view',
    'chat:reply',
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function hasPermission(
  role: AdminRole,
  permission: Permission
): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission)
}

export function hasAnyPermission(
  role: AdminRole,
  permissions: Permission[]
): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/** Returns true for roles with full management privileges (owner / practice manager). */
export function isManagementRole(role: AdminRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

/** Returns true for roles that have a clinical scope (doctor-specific data filters). */
export function hasDoctorScope(role: AdminRole): boolean {
  return role === 'doctor'
}

/**
 * Navigation items that each role can see in the sidebar.
 * Keep in sync with AdminLayoutClient navigation array.
 */
// A nav item may require ANY ONE of the listed permissions (OR logic).
export const ROLE_NAV_PERMISSIONS: Record<string, Permission | Permission[]> = {
  '/admin': 'dashboard:view',
  // Doctors have view_own; all others have view_all — either grants access
  '/admin/appointments': ['appointments:view_all', 'appointments:view_own'],
  '/admin/patients': 'patients:view',
  '/admin/treatments': ['treatments:view_all', 'treatments:view_own'],
  '/admin/materials': 'inventory:view',
  '/admin/orders': 'orders:view',
  '/admin/analytics': 'analytics:view',
  '/admin/chat': 'chat:view',
  '/admin/settings': 'settings:view',
  '/admin/users': 'users:view',
  // Content-management routes — admin+ only
  '/admin/doctors': 'settings:view',
  '/admin/services': 'settings:view',
  '/admin/reviews': 'settings:view',
  // Contact inquiries visible to anyone who handles all appointments (includes receptionist)
  '/admin/contacts': 'appointments:view_all',
}

export function canAccessNavItem(role: AdminRole, href: string): boolean {
  const required = ROLE_NAV_PERMISSIONS[href]
  if (!required) return true // unknown routes are not gated
  if (Array.isArray(required)) {
    return required.some(p => hasPermission(role, p))
  }
  return hasPermission(role, required)
}

// ─── Role display helpers ────────────────────────────────────────────────────

/** Tailwind badge colour for each role (bg + text pairing). */
export const ROLE_BADGE_CLASSES: Record<AdminRole, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-dental-primary text-dental-dark',
  receptionist: 'bg-blue-100 text-blue-800',
  doctor: 'bg-emerald-100 text-emerald-800',
  senior_assistant: 'bg-amber-100 text-amber-800',
  assistant: 'bg-orange-100 text-orange-800',
  staff: 'bg-gray-100 text-gray-700',
}
