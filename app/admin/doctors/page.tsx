'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminDoctorsPage from '@/views/admin/AdminDoctorsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('settings:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminDoctorsPage />
}
