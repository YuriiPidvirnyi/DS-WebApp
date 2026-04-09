'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { canAccessFeature } from '@/lib/permissions'

/**
 * Hook for page-level access control on admin pages.
 * Redirects to /admin if user doesn't have required permission.
 *
 * @param featureOrPath - Permission name (e.g., 'users:view') or route path (e.g., '/admin/users')
 * @returns Loading state - true while checking permissions
 *
 * @example
 * export default function UsersPage() {
 *   const isLoading = useAdminPageAccess('users:view')
 *   if (isLoading) return <div>Loading...</div>
 *   return <div>Users list...</div>
 * }
 */
export function useAdminPageAccess(featureOrPath: string): boolean {
  const router = useRouter()
  const { user, isLoading } = useAdminAuth()

  useEffect(() => {
    if (isLoading) return

    // Not authenticated
    if (!user) {
      router.push('/admin/login')
      return
    }

    // Check access
    if (!canAccessFeature(user.role, featureOrPath)) {
      router.push('/admin')
      return
    }
  }, [user, isLoading, featureOrPath, router])

  return isLoading
}
