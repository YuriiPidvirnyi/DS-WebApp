'use client'

import { use } from 'react'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockMaterialDetailPage from '@/views/admin/stock/AdminStockMaterialDetailPage'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isLoading = useAdminPageAccess('inventory:view')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    )
  }

  return <AdminStockMaterialDetailPage materialId={id} />
}
