'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminAppointmentsPage from '@/views/admin/AdminAppointmentsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('appointments:view_all')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return <AdminAppointmentsPage />
}
