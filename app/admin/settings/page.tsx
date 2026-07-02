'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminSettingsPage from '@/views/admin/AdminSettingsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('settings:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminSettingsPage />
}
