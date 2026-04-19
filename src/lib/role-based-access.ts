/**
 * Role-based access control matrix and helper functions
 * Defines what each admin role can access in the system
 *
 * NOTE: This file is a legacy compatibility layer. The canonical role list,
 * permission matrix, and type definitions live in `src/lib/permissions.ts`.
 * Prefer importing from there for new code.
 */

export type AdminRole =
  | 'superadmin'
  | 'admin'
  | 'receptionist'
  | 'doctor'
  | 'assistant'
  | 'billing_manager'
  | 'inventory_manager'
  | 'analyst'

export interface RolePermissions {
  canAccessChat: boolean
  canAccessAllChats: boolean // Can see chats not their own
  canAccessDoctors: boolean
  canAccessServices: boolean
  canAccessReviews: boolean
  canAccessPatients: boolean
  canAccessAppointments: boolean
  canAccessTreatments: boolean
  canAccessMaterials: boolean
  canAccessOrders: boolean
  canAccessAnalytics: boolean
  canAccessSettings: boolean
}

/**
 * Permission matrix for each role
 * Defines what each role can access
 */
export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  superadmin: {
    canAccessChat: true,
    canAccessAllChats: true,
    canAccessDoctors: true,
    canAccessServices: true,
    canAccessReviews: true,
    canAccessPatients: true,
    canAccessAppointments: true,
    canAccessTreatments: true,
    canAccessMaterials: true,
    canAccessOrders: true,
    canAccessAnalytics: true,
    canAccessSettings: true,
  },
  admin: {
    canAccessChat: true,
    canAccessAllChats: true,
    canAccessDoctors: true,
    canAccessServices: true,
    canAccessReviews: true,
    canAccessPatients: true,
    canAccessAppointments: true,
    canAccessTreatments: true,
    canAccessMaterials: true,
    canAccessOrders: true,
    canAccessAnalytics: true,
    canAccessSettings: true,
  },
  doctor: {
    canAccessChat: true,
    canAccessAllChats: false, // Only own patient chats
    canAccessDoctors: false,
    canAccessServices: false,
    canAccessReviews: false,
    canAccessPatients: false,
    canAccessAppointments: true, // Own appointments
    canAccessTreatments: true, // Own treatments
    canAccessMaterials: false,
    canAccessOrders: false,
    canAccessAnalytics: false,
    canAccessSettings: false,
  },
  assistant: {
    canAccessChat: true,
    canAccessAllChats: false,
    canAccessDoctors: false,
    canAccessServices: false,
    canAccessReviews: false,
    canAccessPatients: true,
    canAccessAppointments: true,
    canAccessTreatments: true,
    canAccessMaterials: true,
    canAccessOrders: true,
    canAccessAnalytics: false,
    canAccessSettings: false,
  },
  receptionist: {
    canAccessChat: true,
    canAccessAllChats: false,
    canAccessDoctors: false,
    canAccessServices: false,
    canAccessReviews: false,
    canAccessPatients: true,
    canAccessAppointments: true,
    canAccessTreatments: false,
    canAccessMaterials: false,
    canAccessOrders: false,
    canAccessAnalytics: false,
    canAccessSettings: false,
  },
  billing_manager: {
    canAccessChat: true,
    canAccessAllChats: false,
    canAccessDoctors: false,
    canAccessServices: false,
    canAccessReviews: false,
    canAccessPatients: true,
    canAccessAppointments: true,
    canAccessTreatments: true,
    canAccessMaterials: true,
    canAccessOrders: true,
    canAccessAnalytics: true,
    canAccessSettings: false,
  },
  inventory_manager: {
    canAccessChat: true,
    canAccessAllChats: false,
    canAccessDoctors: false,
    canAccessServices: false,
    canAccessReviews: false,
    canAccessPatients: false,
    canAccessAppointments: false,
    canAccessTreatments: false,
    canAccessMaterials: true,
    canAccessOrders: true,
    canAccessAnalytics: false,
    canAccessSettings: false,
  },
  analyst: {
    canAccessChat: true,
    canAccessAllChats: false,
    canAccessDoctors: false,
    canAccessServices: false,
    canAccessReviews: false,
    canAccessPatients: true,
    canAccessAppointments: true,
    canAccessTreatments: true,
    canAccessMaterials: true,
    canAccessOrders: true,
    canAccessAnalytics: true,
    canAccessSettings: false,
  },
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: AdminRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.assistant
}

/**
 * Check if a role has access to a specific feature
 */
export function canAccessFeature(
  role: AdminRole,
  feature: keyof RolePermissions
): boolean {
  const perms = getRolePermissions(role)
  return perms[feature] === true
}

/**
 * Get navigation items visible to a specific role
 */
export interface NavItem {
  nameKey: string
  href: string
  feature: keyof RolePermissions // Which permission to check
}

export const ROLE_BASED_NAV_ITEMS: NavItem[] = [
  {
    nameKey: 'admin.sidebar.dashboard',
    href: '/admin',
    feature: 'canAccessAppointments', // Everyone gets dashboard
  },
  {
    nameKey: 'admin.sidebar.appointments',
    href: '/admin/appointments',
    feature: 'canAccessAppointments',
  },
  {
    nameKey: 'admin.sidebar.patients',
    href: '/admin/patients',
    feature: 'canAccessPatients',
  },
  {
    nameKey: 'admin.sidebar.doctors',
    href: '/admin/doctors',
    feature: 'canAccessDoctors',
  },
  {
    nameKey: 'admin.sidebar.services',
    href: '/admin/services',
    feature: 'canAccessServices',
  },
  {
    nameKey: 'admin.sidebar.reviews',
    href: '/admin/reviews',
    feature: 'canAccessReviews',
  },
  {
    nameKey: 'admin.sidebar.contacts',
    href: '/admin/contacts',
    feature: 'canAccessPatients',
  },
  {
    nameKey: 'admin.sidebar.chat',
    href: '/admin/chat',
    feature: 'canAccessChat',
  },
  {
    nameKey: 'admin.sidebar.treatments',
    href: '/admin/treatments',
    feature: 'canAccessTreatments',
  },
  {
    nameKey: 'admin.sidebar.materials',
    href: '/admin/materials',
    feature: 'canAccessMaterials',
  },
  {
    nameKey: 'admin.sidebar.orders',
    href: '/admin/orders',
    feature: 'canAccessOrders',
  },
  {
    nameKey: 'admin.sidebar.analytics',
    href: '/admin/analytics',
    feature: 'canAccessAnalytics',
  },
  {
    nameKey: 'admin.sidebar.settings',
    href: '/admin/settings',
    feature: 'canAccessSettings',
  },
]

/**
 * Filter navigation items based on role
 */
export function getVisibleNavItems(role: AdminRole): NavItem[] {
  return ROLE_BASED_NAV_ITEMS.filter(item =>
    canAccessFeature(role, item.feature)
  )
}
