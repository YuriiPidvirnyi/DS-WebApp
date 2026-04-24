'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminStockDocumentDetailPage from '@/views/admin/stock/AdminStockDocumentDetailPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminStockDocumentDetailPage />
}
