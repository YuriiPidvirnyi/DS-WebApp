'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminWorkspacePage from '@/views/admin/AdminWorkspacePage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('/admin/workspace')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminWorkspacePage />
}
