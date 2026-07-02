'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminTreatmentsPage from '@/views/admin/AdminTreatmentsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('/admin/treatments')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminTreatmentsPage />
}
