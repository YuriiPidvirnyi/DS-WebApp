'use client'

import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { Spinner } from './Spinner'

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  show: boolean
  message?: string
}

export default function LoadingOverlay({
  show,
  message,
  className,
  ...props
}: LoadingOverlayProps) {
  const { t } = useTranslation()
  const text = message ?? `${t('common.loading')}...`

  if (!show) return null
  return (
    <div
      className={twMerge(
        'absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center',
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-dental-text">{text}</p>
      </div>
    </div>
  )
}
