import type { Metadata } from 'next'
import CabinetSettingsPage from '@/views/cabinet/CabinetSettingsPage'

export const metadata: Metadata = {
  title: 'Конфіденційність та дані',
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return <CabinetSettingsPage />
}
