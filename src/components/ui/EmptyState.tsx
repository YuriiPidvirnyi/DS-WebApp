import type { ReactNode } from 'react'
import Link from 'next/link'

interface EmptyStateAction {
  href: string
  label: string
  startIcon?: ReactNode
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  padding?: 'md' | 'lg'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  padding = 'md',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white rounded-2xl ${padding === 'lg' ? 'p-12' : 'p-10'} text-center shadow-sm border border-dental-secondary-100 ${className ?? ''}`}
    >
      <div className="flex justify-center mb-4">{icon}</div>
      <p className="text-lg font-medium text-dental-dark mb-1">{title}</p>
      {description && (
        <p className="text-dental-muted text-sm mb-6">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-medium rounded-xl px-6 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
        >
          {action.startIcon}
          {action.label}
        </Link>
      )}
    </div>
  )
}
