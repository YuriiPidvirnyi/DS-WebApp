'use client'

import { Star } from 'lucide-react'
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
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-1">
      <span className="sr-only">Рейтинг: {value} з 5 зірок</span>
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
          aria-label={`${s} зірок`}
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
