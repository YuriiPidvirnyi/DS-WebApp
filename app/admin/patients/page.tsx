'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import PatientManagement from '@/views/admin/PatientManagement'

export default function AdminPatientsPage() {
  const isLoading = useAdminPageAccess('patients:view')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return <PatientManagement />
}
