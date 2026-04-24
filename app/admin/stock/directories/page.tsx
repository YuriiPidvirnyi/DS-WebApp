'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminStockDirectoriesPage from '@/views/admin/stock/AdminStockDirectoriesPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminStockDirectoriesPage />
}
