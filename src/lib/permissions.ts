/**
 * Role-Based Access Control (RBAC) for DentalStory admin panel.
 *
 * Role hierarchy (highest → lowest):
 *   superadmin > admin > receptionist | doctor > assistant
 *
 * Roles map to real clinic positions:
 *   superadmin        — practice owner / IT administrator (only role that manages users)
 *   admin             — practice manager
 *   receptionist      — front-desk / scheduling
 *   doctor            — dentist (sees own patients only by default)
 *   assistant         — dental assistant
 *   billing_manager   — finance officer (read-only analytics)
 *   inventory_manager — supply chain coordinator
 *   analyst           — business intelligence / reporting (read-only)
 */

export const ADMIN_ROLES = [
  'superadmin',
  'admin',
  'receptionist',
  'doctor',
  'assistant',
  'billing_manager',
  'inventory_manager',
  'analyst',
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
  'orders:approve', // admin+ can approve orders
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

  // Promo campaigns (welcome-pack gift redemption at reception)
  'promo:redeem',
] as const

export type Permission = (typeof PERMISSIONS)[number]

// ─── Permission matrix ───────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
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
    'promo:redeem',
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
    'chat:view',
    'chat:reply',
    'promo:redeem',
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
    'chat:view',
    'chat:reply',
    'promo:redeem',
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

  // Billing / Finance Officer — views analytics and financial data without management access
  billing_manager: [
    'dashboard:view',
    'analytics:view',
    'appointments:view_all', // for billing tracking
    'patients:view', // patient account info
    'treatments:view_all', // treatment costs
    'orders:view', // expense tracking
    'inventory:view', // cost of materials
    'chat:view',
    'chat:reply',
  ],

  // Inventory/Supply Chain Coordinator — manages materials, orders, and stock levels
  inventory_manager: [
    'dashboard:view',
    'inventory:view',
    'inventory:edit',
    'orders:view',
    'orders:create',
    'chat:view',
    'chat:reply',
  ],

  // Business Analyst — read-only access to analytics and reporting data
  analyst: [
    'dashboard:view',
    'analytics:view',
    'appointments:view_all', // for reporting
    'patients:view', // for demographics
    'treatments:view_all', // for outcome analysis
    'orders:view', // for supply analysis
    'inventory:view', // for stock analysis
    'chat:view', // for discussing insights with managers
    'chat:reply', // for collaborative analysis
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
  '/admin/data-quality': 'analytics:view',
  '/admin/chat': 'chat:view',
  '/admin/settings': 'settings:view',
  '/admin/users': 'users:view',
  // Content-management routes — admin+ only
  '/admin/doctors': 'settings:view',
  '/admin/services': 'settings:view',
  '/admin/reviews': 'settings:view',
  // Contact inquiries visible to anyone who handles all appointments (includes receptionist)
  '/admin/contacts': 'appointments:view_all',
  // Intake questionnaires are handled by the same staff that manages patients
  '/admin/intake': 'patients:view',
}

export function canAccessNavItem(role: AdminRole, href: string): boolean {
  const required = ROLE_NAV_PERMISSIONS[href]
  if (!required) return true // unknown routes are not gated
  if (Array.isArray(required)) {
    return required.some(p => hasPermission(role, p))
  }
  return hasPermission(role, required)
}

/**
 * Check if a role can access a specific feature/route.
 * Used for page-level access control redirects.
 */
export function canAccessFeature(
  role: AdminRole | null | undefined,
  featureOrPath: string
): boolean {
  if (!role) return false

  // If it's a path (starts with /), use ROLE_NAV_PERMISSIONS
  if (featureOrPath.startsWith('/')) {
    return canAccessNavItem(role, featureOrPath)
  }

  // Otherwise treat as permission name
  return hasPermission(role, featureOrPath as Permission)
}

// ─── Role display helpers ────────────────────────────────────────────────────

/** Tailwind badge colour for each role (bg + text pairing). */
export const ROLE_BADGE_CLASSES: Record<AdminRole, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-dental-primary text-dental-dark',
  receptionist: 'bg-blue-100 text-blue-800',
  doctor: 'bg-emerald-100 text-emerald-800',
  assistant: 'bg-orange-100 text-orange-800',
  billing_manager: 'bg-green-100 text-green-800',
  inventory_manager: 'bg-cyan-100 text-cyan-800',
  analyst: 'bg-indigo-100 text-indigo-800',
}
