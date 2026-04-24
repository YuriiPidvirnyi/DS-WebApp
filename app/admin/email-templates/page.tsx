'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminEmailTemplatesPage from '@/views/admin/AdminEmailTemplatesPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('settings:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminEmailTemplatesPage />
}
