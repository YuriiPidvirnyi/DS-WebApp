'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminOrdersPage from '@/views/admin/AdminOrdersPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('orders:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminOrdersPage />
}
