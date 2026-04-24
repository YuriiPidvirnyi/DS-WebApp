'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminStockPermissionsPage from '@/views/admin/stock/AdminStockPermissionsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:edit')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminStockPermissionsPage />
}
