'use client'

import { use } from 'react'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminStockMaterialDetailPage from '@/views/admin/stock/AdminStockMaterialDetailPage'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isLoading = useAdminPageAccess('inventory:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminStockMaterialDetailPage materialId={id} />
}
