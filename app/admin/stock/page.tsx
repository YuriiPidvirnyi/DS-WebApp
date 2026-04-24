'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import { isInventoryV2EnabledClient } from '@/lib/feature-flags'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
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
    return <AdminPageLoading />
  }

  return <AdminStockPage />
}
