'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import {
  AnimatedCard,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui'
import { CheckCircle, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

interface ServiceDetailCardProps {
  category: string
  description: string
  services: string[]
  icon: ReactNode
  colorClassName?: string
  delay?: number
  bookingHref?: string
  bookingLabel?: string
}

export default function ServiceDetailCard({
  category,
  description,
  services,
  icon,
  colorClassName,
  delay,
  bookingHref,
  bookingLabel = 'Записатися',
}: ServiceDetailCardProps) {
  return (
    <AnimatedCard
      hoverEffect="lift"
      delay={delay}
      className={clsx('border-2 flex flex-col', colorClassName)}
    >
      <CardHeader className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white/60">
            {icon}
          </div>
          <CardTitle className="text-dental-dark">{category}</CardTitle>
        </div>

        <p className="text-dental-text text-sm leading-relaxed mb-4">
          {description}
        </p>

        <ul className="space-y-1.5">
          {services.map((service, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-dental-text"
            >
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-dental-teal" />
              <span>{service}</span>
            </li>
          ))}
        </ul>
      </CardHeader>

      {bookingHref && (
        <CardFooter className="pt-4 mt-auto">
          <Link
            href={bookingHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-dental-teal hover:text-dental-primary-700 transition-colors min-h-[44px] py-2"
          >
            {bookingLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      )}
    </AnimatedCard>
  )
}
