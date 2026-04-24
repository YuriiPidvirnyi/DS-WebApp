'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminUsersPage from '@/views/admin/AdminUsersPage'

export default function AdminUsersRoute() {
  const isLoading = useAdminPageAccess('users:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminUsersPage />
}
