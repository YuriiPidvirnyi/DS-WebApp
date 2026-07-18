'use client'

import { useParams } from 'next/navigation'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminTreatmentPrintPage from '@/views/admin/AdminTreatmentPrintPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('/admin/treatments')
  const params = useParams<{ id: string }>()

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminTreatmentPrintPage recordId={params.id} />
}
