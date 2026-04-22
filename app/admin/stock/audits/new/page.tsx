'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockAuditNewPage from '@/views/admin/stock/AdminStockAuditNewPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:edit')
  if (isLoading) return null
  return <AdminStockAuditNewPage />
}
