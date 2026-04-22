'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockMaterialsPage from '@/views/admin/stock/AdminStockMaterialsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:view')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    )
  }

  return <AdminStockMaterialsPage />
}
