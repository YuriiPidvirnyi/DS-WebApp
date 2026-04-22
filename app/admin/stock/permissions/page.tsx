'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockPermissionsPage from '@/views/admin/stock/AdminStockPermissionsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:edit')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    )
  }

  return <AdminStockPermissionsPage />
}
