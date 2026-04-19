import type { Metadata } from 'next'
import uk from '@/locales/uk'
import CabinetSettingsPage from '@/views/cabinet/CabinetSettingsPage'

export const metadata: Metadata = {
  title: uk.cabinet.settings.title,
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return <CabinetSettingsPage />
}
