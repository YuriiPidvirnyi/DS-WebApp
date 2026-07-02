import { isInventoryV2Enabled } from '@/lib/feature-flags'
import { redirect } from 'next/navigation'
import ReportHistoryPage from '@/views/admin/stock/reports/ReportHistoryPage'

export const metadata = { title: 'Історія товару — Звіти' }

export default function Page() {
  if (!isInventoryV2Enabled()) redirect('/admin/stock')
  return <ReportHistoryPage />
}
