'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminStockMaterialsPage from '@/views/admin/stock/AdminStockMaterialsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminStockMaterialsPage />
}
