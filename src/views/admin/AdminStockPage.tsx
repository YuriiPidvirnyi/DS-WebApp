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

const SECTIONS = [
  {
    href: '/admin/stock/documents',
    icon: Package,
    titleUk: 'Накладні',
    descUk: 'Прихідні, списання, переміщення, повернення, коректування',
    available: true,
  },
  {
    href: '/admin/stock/warehouses',
    icon: Warehouse,
    titleUk: 'Склади',
    descUk: 'Головний склад, кабінети, склади лікарів',
    available: true,
  },
  {
    href: '/admin/stock/directories',
    icon: BookOpen,
    titleUk: 'Довідники',
    descUk: 'Постачальники, бренди, категорії матеріалів',
    available: true,
  },
  {
    href: '/admin/stock/materials',
    icon: FlaskConical,
    titleUk: 'Матеріали',
    descUk: 'Картка товару, штрихкоди, упаковки, матриця складів',
    available: true,
  },
  {
    href: '/admin/stock/my-warehouses',
    icon: LayoutGrid,
    titleUk: 'Мої склади',
    descUk: 'Щоденна робота: залишки, списання, переміщення, заявки',
    available: true,
  },
  {
    href: '/admin/stock/calc-cards',
    icon: ClipboardList,
    titleUk: 'Картки розрахунку',
    descUk: 'Норми витрат матеріалів на послугу, заміна товару',
    available: true,
  },
  {
    href: '/admin/stock/audits',
    icon: ClipboardCheck,
    titleUk: 'Інвентаризація',
    descUk: 'Акти перерахунку залишків, коригуючі документи',
    available: true,
  },
  {
    href: '/admin/stock/settings',
    icon: Settings,
    titleUk: 'Налаштування',
    descUk: 'Режим списання, дозволи, додаткові параметри',
    available: true,
  },
  {
    href: '/admin/stock/reports',
    icon: BarChart3,
    titleUk: 'Звіти',
    descUk: 'Залишки, собівартість, оборот, критичний залишок',
    available: true,
  },
]

export default function AdminStockPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            Склад v2
          </h1>
          <p className="mt-1 text-sm text-dental-text">
            Модуль у розробці. Нижче — розділи, що з'являться після фази 1.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SECTIONS.map(({ href, icon: Icon, titleUk, descUk, available }) =>
            available ? (
              <Link
                key={href}
                href={href}
                className="relative flex items-start gap-4 rounded-xl border border-dental-primary/40 bg-white p-5 hover:bg-dental-primary/5 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dental-primary/20">
                  <Icon className="h-5 w-5 text-dental-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-dental-dark">{titleUk}</p>
                  <p className="mt-0.5 text-sm text-dental-text">{descUk}</p>
                </div>
              </Link>
            ) : (
              <div
                key={href}
                className="relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 opacity-50 cursor-not-allowed"
                aria-disabled="true"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dental-primary/20">
                  <Icon className="h-5 w-5 text-dental-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-dental-dark">{titleUk}</p>
                  <p className="mt-0.5 text-sm text-dental-text">{descUk}</p>
                </div>
                <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  скоро
                </span>
              </div>
            )
          )}
        </div>

        <div className="mt-8 rounded-xl border border-dental-primary/30 bg-dental-primary/10 p-4 text-sm text-dental-dark">
          <strong>Phase 7</strong> — Звіти: залишки, історія, критичний залишок,
          списання, собівартість послуг.{' '}
          <Link
            href="/admin/materials"
            className="underline hover:text-dental-primary-600"
          >
            Поточний склад (v1)
          </Link>{' '}
          продовжує працювати.
        </div>
      </div>
    </div>
  )
}
