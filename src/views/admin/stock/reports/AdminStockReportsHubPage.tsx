'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  Package,
  History,
  AlertTriangle,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const REPORTS = [
  {
    href: '/admin/stock/reports/balances',
    icon: Package,
    titleKey: 'admin.stock.reports.hub.balancesTitle',
    descKey: 'admin.stock.reports.hub.balancesDesc',
  },
  {
    href: '/admin/stock/reports/history',
    icon: History,
    titleKey: 'admin.stock.reports.hub.historyTitle',
    descKey: 'admin.stock.reports.hub.historyDesc',
  },
  {
    href: '/admin/stock/reports/reorder',
    icon: AlertTriangle,
    titleKey: 'admin.stock.reports.hub.reorderTitle',
    descKey: 'admin.stock.reports.hub.reorderDesc',
  },
  {
    href: '/admin/stock/reports/writeoff',
    icon: Trash2,
    titleKey: 'admin.stock.reports.hub.writeoffTitle',
    descKey: 'admin.stock.reports.hub.writeoffDesc',
  },
  {
    href: '/admin/stock/reports/service-cost',
    icon: TrendingUp,
    titleKey: 'admin.stock.reports.hub.serviceCostTitle',
    descKey: 'admin.stock.reports.hub.serviceCostDesc',
  },
]

export default function AdminStockReportsHubPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/admin/stock"
          className="text-dental-text hover:text-dental-primary-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
          {t('admin.stock.reports.hub.title')}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map(r => (
          <Link
            key={r.href}
            href={r.href}
            className="group flex gap-4 rounded-xl border bg-white p-5 hover:border-dental-primary-600 hover:shadow-xs transition-all"
          >
            <div className="shrink-0 mt-0.5 text-dental-primary-600 group-hover:text-dental-dark transition-colors">
              <r.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-dental-dark group-hover:text-dental-primary-600 transition-colors">
                {t(r.titleKey)}
              </p>
              <p className="mt-1 text-sm text-dental-text leading-relaxed">
                {t(r.descKey)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
