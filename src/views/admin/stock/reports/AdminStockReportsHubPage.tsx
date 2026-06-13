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

const REPORTS = [
  {
    href: '/admin/stock/reports/balances',
    icon: Package,
    title: 'Залишки',
    desc: 'Поточні залишки по матеріалах та складах зі статусом і середньою вартістю.',
  },
  {
    href: '/admin/stock/reports/history',
    icon: History,
    title: 'Історія товару',
    desc: 'Рух конкретного матеріалу на складі: надходження, списання, коригування.',
  },
  {
    href: '/admin/stock/reports/reorder',
    icon: AlertTriangle,
    title: 'Замовлення з критичним залишком',
    desc: 'Матеріали нижче критичного ліміту з пропонованою кількістю для замовлення.',
  },
  {
    href: '/admin/stock/reports/writeoff',
    icon: Trash2,
    title: 'Списання',
    desc: 'Деталізований журнал списань за обраний період.',
  },
  {
    href: '/admin/stock/reports/service-cost',
    icon: TrendingUp,
    title: 'Собівартість послуг',
    desc: 'Середня ціна, собівартість матеріалів та маржа по послугах з розбивкою по місяцях.',
  },
]

export default function AdminStockReportsHubPage() {
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
          Звіти по складу
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
                {r.title}
              </p>
              <p className="mt-1 text-sm text-dental-text leading-relaxed">
                {r.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
