'use client'

import { use } from 'react'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminStockAuditEditorPage from '@/views/admin/stock/AdminStockAuditEditorPage'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isLoading = useAdminPageAccess('inventory:view')
  if (isLoading) return null
  return <AdminStockAuditEditorPage auditId={id} />
}
