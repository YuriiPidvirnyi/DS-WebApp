'use client'

import { AnimatedCard } from '@/components/ui'
import { Skeleton } from '@/components/ui'
import { Star } from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

interface TeamMemberCardProps {
  name: string
  specialization: string
  experience?: string
  photoSrc?: string
  photoAlt?: string
  education?: string
  rating?: number
  reviewsCount?: number
  loading?: boolean
  delay?: number
  className?: string
}

export default function TeamMemberCard({
  name,
  specialization,
  experience,
  photoSrc,
  photoAlt,
  education,
  rating,
  reviewsCount,
  loading = false,
  delay,
  className,
}: TeamMemberCardProps) {
  if (loading) {
    return (
      <div
        className={clsx(
          'rounded-2xl bg-white shadow-lg overflow-hidden',
          className
        )}
      >
        <div className="p-8 flex flex-col items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2 w-full text-center">
            <Skeleton className="h-5 w-40 mx-auto rounded" />
            <Skeleton className="h-4 w-28 mx-auto rounded" />
          </div>
        </div>
      </div>
    )
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <AnimatedCard
      variant="elevated"
      hoverEffect="lift"
      delay={delay}
      className={clsx('overflow-hidden', className)}
    >
      <div className="p-8 flex flex-col items-center text-center gap-4">
        {/* Photo / initials fallback */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 bg-dental-primary-100 flex items-center justify-center">
          {photoSrc ? (
            <Image
              src={photoSrc}
              alt={photoAlt ?? name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <span className="text-2xl font-bold text-dental-primary-600">
              {initials}
            </span>
          )}
        </div>

        <div className="min-w-0 w-full">
          <h3 className="text-lg font-bold text-dental-dark">{name}</h3>
          <p className="text-dental-teal font-medium text-sm mt-0.5">
            {specialization}
          </p>

          {experience && (
            <p className="text-dental-muted text-sm mt-1">{experience}</p>
          )}

          {education && (
            <p className="text-dental-text text-sm mt-2 leading-relaxed">
              {education}
            </p>
          )}

          {rating !== undefined && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <div
                className="flex gap-0.5"
                aria-label={`Rating: ${rating} out of 5`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={clsx(
                      'h-4 w-4',
                      i < Math.round(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-dental-secondary-200 text-dental-secondary-200'
                    )}
                  />
                ))}
              </div>
              {reviewsCount !== undefined && (
                <span className="text-dental-muted text-xs">
                  ({reviewsCount})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedCard>
  )
}
