'use client'

import { type ReactNode } from 'react'
import clsx from 'clsx'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

type AsyncStateVariant = 'loading' | 'error' | 'empty'

interface AsyncStateProps {
  variant: AsyncStateVariant
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  icon?: ReactNode
}

const variantStyles: Record<AsyncStateVariant, string> = {
  loading: 'border-dental-secondary-200 bg-white text-dental-text-light',
  error: 'border-red-200 bg-red-50 text-red-700',
  empty: 'border-dental-secondary-200 bg-white text-dental-text-light',
}

function renderDefaultIcon(variant: AsyncStateVariant): ReactNode {
  if (variant === 'loading') {
    return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
  }

  if (variant === 'error') {
    return <AlertTriangle className="h-5 w-5" aria-hidden="true" />
  }

  return <Inbox className="h-5 w-5" aria-hidden="true" />
}

export function AsyncState({
  variant,
  title,
  message,
  actionLabel,
  onAction,
  className,
  icon,
}: AsyncStateProps) {
  const { t } = useTranslation()
  const heading = title || t(`asyncState.${variant}.title`)
  const showAction = Boolean(actionLabel && onAction && variant !== 'loading')

  return (
    <div
      className={clsx(
        'rounded-xl border px-5 py-6 text-center',
        variantStyles[variant],
        className
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80">
        {icon || renderDefaultIcon(variant)}
      </div>
      <p className="font-semibold">{heading}</p>
      <p className="mt-1 text-sm">{message}</p>
      {showAction && (
        <div className="mt-4">
          <Button type="button" size="sm" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
