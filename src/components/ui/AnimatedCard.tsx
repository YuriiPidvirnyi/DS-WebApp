'use client'

import { ReactNode, CSSProperties } from 'react'
import clsx from 'clsx'
import { CARD_VARIANT_CLASSES, type CardVariant } from './card-variants'

const hoverClasses: Record<string, string> = {
  lift: 'hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-[transform,box-shadow] duration-300 ease-out shadow-[0_4px_6px_rgba(0,0,0,0.05)]',
  glow: 'hover:shadow-[0_0_30px_rgba(20,184,166,0.3),0_10px_30px_rgba(0,0,0,0.1)] transition-shadow duration-300 ease-out shadow-[0_4px_6px_rgba(0,0,0,0.05)]',
  scale: 'hover:scale-[1.02] transition-transform duration-300 ease-out',
  tilt: 'transition-[transform,box-shadow] duration-150 ease-out',
  none: '',
}

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: 'tilt' | 'lift' | 'glow' | 'scale' | 'none'
  variant?: CardVariant
  delay?: number
  isVisible?: boolean
}

export default function AnimatedCard({
  children,
  className = '',
  hoverEffect = 'lift',
  variant = 'default',
  delay = 0,
  isVisible = true,
}: AnimatedCardProps) {
  const animationStyles: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transitionDelay: `${delay}ms`,
    transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
  }

  return (
    <div
      className={clsx(
        'rounded-2xl',
        CARD_VARIANT_CLASSES[variant],
        hoverClasses[hoverEffect] || '',
        className
      )}
      style={animationStyles}
    >
      {children}
    </div>
  )
}

// Animated section wrapper for scroll reveal
interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight'
  delay?: number
  isVisible?: boolean
}

export function AnimatedSection({
  children,
  className = '',
  animation = 'fadeUp',
  delay = 0,
  isVisible = true,
}: AnimatedSectionProps) {
  const getAnimationStyles = (): CSSProperties => {
    const baseTransition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`

    switch (animation) {
      case 'fadeUp':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: baseTransition,
        }
      case 'fadeIn':
        return {
          opacity: isVisible ? 1 : 0,
          transition: baseTransition,
        }
      case 'slideLeft':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
          transition: baseTransition,
        }
      case 'slideRight':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
          transition: baseTransition,
        }
      default:
        return {}
    }
  }

  return (
    <div className={className} style={getAnimationStyles()}>
      {children}
    </div>
  )
}

// Animated text reveal
interface AnimatedTextProps {
  children: string
  className?: string
  delay?: number
  isVisible?: boolean
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
}

export function AnimatedText({
  children,
  className = '',
  delay = 0,
  isVisible = true,
  as: Component = 'span',
}: AnimatedTextProps) {
  return (
    <Component
      className={`inline-block ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </Component>
  )
}
