'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminHealthPage from '@/views/admin/AdminHealthPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('analytics:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminHealthPage />
}
