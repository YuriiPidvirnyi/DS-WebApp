import { isInventoryV2Enabled } from '@/lib/feature-flags'
import { redirect } from 'next/navigation'
import AdminStockReportsHubPage from '@/views/admin/stock/reports/AdminStockReportsHubPage'

export const metadata = { title: 'Звіти — Склад' }

export default function Page() {
  if (!isInventoryV2Enabled()) redirect('/admin/stock')
  return <AdminStockReportsHubPage />
}
