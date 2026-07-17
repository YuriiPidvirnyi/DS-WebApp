'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminIntakePage from '@/views/admin/AdminIntakePage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('patients:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminIntakePage />
}
