'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import { isInventoryV2EnabledClient } from '@/lib/feature-flags'
import AdminStockPage from '@/views/admin/AdminStockPage'

export default function StockRoute() {
  const router = useRouter()

  useEffect(() => {
    if (!isInventoryV2EnabledClient()) {
      router.replace('/admin')
    }
  }, [router])

  const isLoading = useAdminPageAccess('inventory:view')

  if (!isInventoryV2EnabledClient() || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    )
  }

  return <AdminStockPage />
}
