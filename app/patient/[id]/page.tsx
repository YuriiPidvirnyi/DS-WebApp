'use client'

import PatientDashboard from '@/views/patient/PatientDashboard'

interface Props {
  params: { id: string }
}

export default function PatientDashboardPage({ params }: Props) {
  return <PatientDashboard patientId={params.id} />
}
