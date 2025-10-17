import { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { Spinner } from './Spinner'

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  show: boolean
  message?: string
}

export default function LoadingOverlay({ show, message = 'Завантаження...', className, ...props }: LoadingOverlayProps) {
  if (!show) return null
  return (
    <div
      className={twMerge(
        'absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center',
        className,
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </div>
  )
}
