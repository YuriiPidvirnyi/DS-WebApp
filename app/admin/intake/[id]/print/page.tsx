'use client'

import { useParams } from 'next/navigation'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminIntakePrintPage from '@/views/admin/AdminIntakePrintPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('patients:view')
  const params = useParams<{ id: string }>()

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminIntakePrintPage intakeId={params.id} />
}
