'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminInventoryAnalyticsPage from '@/views/admin/AdminInventoryAnalyticsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('analytics:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminInventoryAnalyticsPage />
}
