'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminContactsPage from '@/views/admin/AdminContactsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('appointments:view_all')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminContactsPage />
}
