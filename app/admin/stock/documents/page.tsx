'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminStockDocumentsPage from '@/views/admin/stock/AdminStockDocumentsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminStockDocumentsPage />
}
