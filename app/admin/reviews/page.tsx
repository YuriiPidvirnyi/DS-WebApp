'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminReviewsPage from '@/views/admin/AdminReviewsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('settings:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminReviewsPage />
}
