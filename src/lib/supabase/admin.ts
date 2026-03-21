import type { SupabaseClient, User } from '@supabase/supabase-js'

export type AdminRole = 'admin' | 'superadmin'

export interface AdminAccess {
  role: AdminRole
  displayName: string | null
}

export interface AdminIdentity {
  id: string
  email: string
  name: string
  role: AdminRole
}

/**
 * Returns admin access metadata for a user or null when they are not an admin.
 * Uses `admin_users` as the role source of truth.
 */
export async function getAdminAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<AdminAccess | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role, display_name')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null

  return {
    role: data.role === 'superadmin' ? 'superadmin' : 'admin',
    displayName: data.display_name ?? null,
  }
}

export function buildAdminIdentity(
  user: User,
  access: AdminAccess
): AdminIdentity {
  return {
    id: user.id,
    email: user.email || '',
    name: access.displayName || user.user_metadata?.name || 'Admin',
    role: access.role,
  }
}
