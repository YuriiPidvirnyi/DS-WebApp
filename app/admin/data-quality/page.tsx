'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminDataQualityPage from '@/views/admin/AdminDataQualityPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('analytics:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminDataQualityPage />
}
