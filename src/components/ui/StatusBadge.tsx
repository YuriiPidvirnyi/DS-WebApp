import { ReactNode } from 'react'
import clsx from 'clsx'

export type StatusTone = 'accent' | 'success' | 'warning' | 'neutral' | 'error'

export interface StatusBadgeProps {
  tone: StatusTone
  children: ReactNode
  /** Renders a small pulsing dot before the label (e.g. «Йде прийом», «Система онлайн») */
  live?: boolean
  className?: string
}

/*
 * Єдина шкала статусів (Ф-3, макет 1f): той самий статус виглядає однаково
 * в кабінеті пацієнта й адмінці. Формула чипа: тінт-фон *-100 + інк-текст *-700,
 * 12px/600, pill. Семантика лишається тільки статусам — не навігації.
 */
const toneStyles: Record<StatusTone, string> = {
  accent: 'bg-status-accent-100 text-status-accent-700',
  success: 'bg-status-success-100 text-status-success-700',
  warning: 'bg-status-warning-100 text-status-warning-700',
  neutral: 'bg-status-neutral-200 text-status-neutral-700',
  error: 'bg-status-error-100 text-status-error-700',
}

const dotStyles: Record<StatusTone, string> = {
  accent: 'bg-dental-primary-600',
  success: 'bg-dental-success',
  warning: 'bg-status-warning-700',
  neutral: 'bg-status-neutral-700',
  error: 'bg-status-error-700',
}

export function StatusBadge({
  tone,
  children,
  live = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        toneStyles[tone],
        className
      )}
    >
      {live && (
        <span
          aria-hidden="true"
          className={clsx(
            'h-1.5 w-1.5 rounded-full motion-safe:animate-pulse',
            dotStyles[tone]
          )}
        />
      )}
      {children}
    </span>
  )
}
