'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'
import { Card } from '@/components/ui'

interface AdminDataCardProps {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  selected?: boolean
  onSelect?: () => void
  className?: string
}

export default function AdminDataCard({
  title,
  subtitle,
  meta,
  badge,
  actions,
  selected = false,
  onSelect,
  className,
}: AdminDataCardProps) {
  return (
    <Card
      variant="outlined"
      padding="sm"
      className={clsx(
        'transition-shadow duration-200',
        selected && 'ring-2 ring-dental-primary-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="mt-1 h-4 w-4 rounded border-dental-secondary-300 text-dental-primary-600 focus:ring-dental-primary-500 shrink-0"
            aria-label="Select row"
          />
        )}

        <div className="min-w-0 flex-1">
          {/* Title + badge row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="font-semibold text-dental-dark text-sm leading-snug truncate">
              {title}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-dental-text text-xs leading-snug mb-1 line-clamp-2">
              {subtitle}
            </div>
          )}

          {/* Meta */}
          {meta && <div className="text-dental-muted text-xs mt-1">{meta}</div>}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-dental-secondary-100">
          {actions}
        </div>
      )}
    </Card>
  )
}
