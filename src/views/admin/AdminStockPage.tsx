'use client'

import {
  Package,
  Warehouse,
  Settings,
  BarChart3,
  BookOpen,
  FlaskConical,
  LayoutGrid,
  ClipboardList,
  ClipboardCheck,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/ui'

const SECTIONS = [
  {
    href: '/admin/stock/documents',
    icon: Package,
    titleKey: 'admin.stock.page.documentsTitle',
    descKey: 'admin.stock.page.documentsDesc',
    available: true,
  },
  {
    href: '/admin/stock/warehouses',
    icon: Warehouse,
    titleKey: 'admin.stock.page.warehousesTitle',
    descKey: 'admin.stock.page.warehousesDesc',
    available: true,
  },
  {
    href: '/admin/stock/directories',
    icon: BookOpen,
    titleKey: 'admin.stock.page.directoriesTitle',
    descKey: 'admin.stock.page.directoriesDesc',
    available: true,
  },
  {
    href: '/admin/stock/materials',
    icon: FlaskConical,
    titleKey: 'admin.stock.page.materialsTitle',
    descKey: 'admin.stock.page.materialsDesc',
    available: true,
  },
  {
    href: '/admin/stock/my-warehouses',
    icon: LayoutGrid,
    titleKey: 'admin.stock.page.myWarehousesTitle',
    descKey: 'admin.stock.page.myWarehousesDesc',
    available: true,
  },
  {
    href: '/admin/stock/calc-cards',
    icon: ClipboardList,
    titleKey: 'admin.stock.page.calcCardsTitle',
    descKey: 'admin.stock.page.calcCardsDesc',
    available: true,
  },
  {
    href: '/admin/stock/audits',
    icon: ClipboardCheck,
    titleKey: 'admin.stock.page.auditsTitle',
    descKey: 'admin.stock.page.auditsDesc',
    available: true,
  },
  {
    href: '/admin/stock/settings',
    icon: Settings,
    titleKey: 'admin.stock.page.settingsTitle',
    descKey: 'admin.stock.page.settingsDesc',
    available: true,
  },
  {
    href: '/admin/stock/reports',
    icon: BarChart3,
    titleKey: 'admin.stock.page.reportsTitle',
    descKey: 'admin.stock.page.reportsDesc',
    available: true,
  },
]

export default function AdminStockPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
          {t('admin.stock.page.heading')}
        </h1>
        <p className="mt-1 text-sm text-dental-text">
          {t('admin.stock.page.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, titleKey, descKey, available }) =>
          available ? (
            <Link
              key={href}
              href={href}
              className="relative flex items-start gap-4 rounded-xl border border-dental-primary/40 bg-white p-5 hover:bg-dental-primary/5 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dental-primary/20">
                <Icon className="h-5 w-5 text-dental-primary-ink" />
              </div>
              <div>
                <p className="font-medium text-dental-dark">{t(titleKey)}</p>
                <p className="mt-0.5 text-sm text-dental-text">{t(descKey)}</p>
              </div>
            </Link>
          ) : (
            <div
              key={href}
              className="relative flex items-start gap-4 rounded-xl border border-dental-secondary-200 bg-white p-5 opacity-50 cursor-not-allowed"
              aria-disabled="true"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dental-primary/20">
                <Icon className="h-5 w-5 text-dental-primary-ink" />
              </div>
              <div>
                <p className="font-medium text-dental-dark">{t(titleKey)}</p>
                <p className="mt-0.5 text-sm text-dental-text">{t(descKey)}</p>
              </div>
              <StatusBadge tone="warning" className="absolute right-3 top-3">
                {t('admin.stock.page.comingSoonBadge')}
              </StatusBadge>
            </div>
          )
        )}
      </div>

      <div className="mt-8 rounded-xl border border-dental-primary/30 bg-dental-primary/10 p-4 text-sm text-dental-dark">
        <strong>{t('admin.stock.page.footerHeading')}</strong>{' '}
        {t('admin.stock.page.footerPhases')}{' '}
        <Link
          href="/admin/materials"
          className="underline hover:text-dental-primary-ink"
        >
          {t('admin.stock.page.stockV1Link')}
        </Link>{' '}
        {t('admin.stock.page.footerNote')}
      </div>
    </div>
  )
}
