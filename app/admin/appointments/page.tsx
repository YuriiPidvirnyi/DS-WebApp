'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminAppointmentsPage from '@/views/admin/AdminAppointmentsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('/admin/appointments')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminAppointmentsPage />
}
