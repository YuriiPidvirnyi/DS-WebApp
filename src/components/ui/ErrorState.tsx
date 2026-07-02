import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = 'Спробувати знову',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-10 text-center shadow-xs border border-dental-secondary-100 ${className ?? ''}`}
    >
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-dental-dark mb-2">{title}</h2>
      {description && (
        <p className="text-dental-muted text-sm mb-6">{description}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-dental-primary-600 text-white rounded-xl text-sm font-medium hover:bg-dental-primary-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
