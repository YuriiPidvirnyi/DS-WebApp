'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminStockMaterialDetailPage from '@/views/admin/stock/AdminStockMaterialDetailPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:edit')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminStockMaterialDetailPage materialId={null} />
}
