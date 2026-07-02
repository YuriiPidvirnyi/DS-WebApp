import { isInventoryV2Enabled } from '@/lib/feature-flags'
import { redirect } from 'next/navigation'
import ReportReorderPage from '@/views/admin/stock/reports/ReportReorderPage'

export const metadata = { title: 'Критичні залишки — Звіти' }

export default function Page() {
  if (!isInventoryV2Enabled()) redirect('/admin/stock')
  return <ReportReorderPage />
}
