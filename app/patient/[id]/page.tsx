'use client'

import { useParams } from 'next/navigation'
import PatientDashboard from '@/views/patient/PatientDashboard'

export default function PatientDashboardPage() {
  const params = useParams<{ id: string }>()
  return <PatientDashboard patientId={params.id} />
}
