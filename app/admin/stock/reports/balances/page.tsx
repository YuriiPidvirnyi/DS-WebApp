import { isInventoryV2Enabled } from '@/lib/feature-flags'
import { redirect } from 'next/navigation'
import ReportBalancesPage from '@/views/admin/stock/reports/ReportBalancesPage'

export const metadata = { title: 'Залишки — Звіти' }

export default function Page() {
  if (!isInventoryV2Enabled()) redirect('/admin/stock')
  return <ReportBalancesPage />
}
