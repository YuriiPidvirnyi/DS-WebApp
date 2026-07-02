'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockCalcCardsPage from '@/views/admin/stock/AdminStockCalcCardsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('inventory:view')
  if (isLoading) return null
  return <AdminStockCalcCardsPage />
}
