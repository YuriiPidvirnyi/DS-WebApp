'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockAuditsPage from '@/views/admin/stock/AdminStockAuditsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:view')
  if (isLoading) return null
  return <AdminStockAuditsPage />
}
