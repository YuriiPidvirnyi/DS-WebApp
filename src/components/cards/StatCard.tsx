'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { Card } from '@/components/ui'
import { Skeleton } from '@/components/ui'

interface StatCardProps {
  label: string
  value: ReactNode
  valueClassName?: string
  icon?: ReactNode
  iconBg?: string
  href?: string
  badge?: string
  loading?: boolean
  className?: string
}

export default function StatCard({
  label,
  value,
  valueClassName,
  icon,
  iconBg = 'bg-dental-primary-50',
  href,
  badge,
  loading = false,
  className,
}: StatCardProps) {
  const content = loading ? (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="h-7 w-16 rounded" />
    </div>
  ) : (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-dental-muted truncate">{label}</p>
        <p
          className={clsx(
            'text-2xl font-bold text-dental-dark mt-1',
            valueClassName
          )}
        >
          {value}
        </p>
        {badge && (
          <span className="mt-1 inline-block rounded-full bg-dental-primary-100 px-2 py-0.5 text-xs font-medium text-dental-primary-700">
            {badge}
          </span>
        )}
      </div>
      {icon && (
        <div
          className={clsx(
            'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            iconBg
          )}
        >
          {icon}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 rounded-xl"
      >
        <Card
          variant="outlined"
          padding="sm"
          hoverable
          className={clsx('transition-all', className)}
        >
          {content}
        </Card>
      </Link>
    )
  }

  return (
    <Card variant="outlined" padding="sm" className={className}>
      {content}
    </Card>
  )
}
