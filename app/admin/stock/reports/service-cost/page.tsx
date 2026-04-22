import { isInventoryV2Enabled } from '@/lib/feature-flags'
import { redirect } from 'next/navigation'
import ReportServiceCostPage from '@/views/admin/stock/reports/ReportServiceCostPage'

export const metadata = { title: 'Собівартість послуг — Звіти' }

export default function Page() {
  if (!isInventoryV2Enabled()) redirect('/admin/stock')
  return <ReportServiceCostPage />
}
