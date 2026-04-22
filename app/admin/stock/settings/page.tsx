'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockSettingsPage from '@/views/admin/stock/AdminStockSettingsPage'

export default function Page() {
  const isLoading = useAdminPageAccess('settings:view')
  if (isLoading) return null
  return <AdminStockSettingsPage />
}
