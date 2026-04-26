'use client'

import { ReactNode } from 'react'
import { Star } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '@/components/ui'

interface ReviewCardProps {
  name: string
  rating: number
  comment: string
  createdAt: string
  service?: string
  doctor?: string
  // Admin-only props
  status?: string
  isFeatured?: boolean
  isSelected?: boolean
  onSelect?: () => void
  actions?: ReactNode
  className?: string
}

export default function ReviewCard({
  name,
  rating,
  comment,
  createdAt,
  service,
  doctor,
  status,
  isFeatured,
  isSelected,
  onSelect,
  actions,
  className,
}: ReviewCardProps) {
  return (
    <Card
      variant="outlined"
      padding="sm"
      className={clsx(
        'transition-shadow duration-200',
        isSelected && 'ring-2 ring-dental-primary-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {onSelect !== undefined && (
          <input
            type="checkbox"
            checked={isSelected ?? false}
            onChange={onSelect}
            className="mt-1 h-4 w-4 shrink-0 rounded border-dental-secondary-300 text-dental-primary-600 focus:ring-dental-primary-500"
            aria-label={`Select review by ${name}`}
          />
        )}

        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="font-semibold text-dental-dark text-sm">
                {name}
              </span>
              {isFeatured && (
                <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  ★
                </span>
              )}
            </div>
            {status && (
              <span className="shrink-0 text-xs text-dental-muted">
                {status}
              </span>
            )}
          </div>

          {/* Stars */}
          <div
            className="flex gap-0.5 mb-2"
            aria-label={`Rating: ${rating} out of 5`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={clsx(
                  'h-4 w-4',
                  i < rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-dental-secondary-200 text-dental-secondary-200'
                )}
              />
            ))}
          </div>

          {/* Comment */}
          <p className="text-dental-text text-sm leading-relaxed line-clamp-3 mb-2">
            {comment}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-dental-muted">
            {service && <span>{service}</span>}
            {doctor && <span>{doctor}</span>}
            <span>{createdAt}</span>
          </div>
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
