import { isInventoryV2Enabled } from '@/lib/feature-flags'
import { redirect } from 'next/navigation'
import ReportWriteoffPage from '@/views/admin/stock/reports/ReportWriteoffPage'

export const metadata = { title: 'Списання — Звіти' }

export default function Page() {
  if (!isInventoryV2Enabled()) redirect('/admin/stock')
  return <ReportWriteoffPage />
}
