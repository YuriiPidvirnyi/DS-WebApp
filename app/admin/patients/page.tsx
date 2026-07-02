'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import PatientManagement from '@/views/admin/PatientManagement'

export default function AdminPatientsPage() {
  const isLoading = useAdminPageAccess('patients:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <PatientManagement />
}
