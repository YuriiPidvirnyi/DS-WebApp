'use client'

import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

interface StarRatingProps {
  value: number
  onChange?: (val: number) => void
  readOnly?: boolean
  size?: number
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 20,
}: StarRatingProps) {
  const { t } = useTranslation()
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-1">
      <span className="sr-only">{t('starRating.summary', { value })}</span>
      {stars.map(s => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(s)}
          className={cn(
            'p-0.5 rounded',
            readOnly ? 'cursor-default' : 'hover:scale-110 transition-transform'
          )}
          aria-label={t('starRating.starLabel', { count: s })}
        >
          <Star
            className={cn(
              'transition-colors',
              s <= value ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300'
            )}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  )
}
