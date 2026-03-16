'use client'

import { ReactNode, CSSProperties } from 'react'
import { useMouseFollow } from '@/hooks/useScrollAnimation'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: 'tilt' | 'lift' | 'glow' | 'scale' | 'none'
  delay?: number
  isVisible?: boolean
}

export default function AnimatedCard({
  children,
  className = '',
  hoverEffect = 'lift',
  delay = 0,
  isVisible = true,
}: AnimatedCardProps) {
  const { ref, getTransform, isHovering } = useMouseFollow<HTMLDivElement>()

  const getHoverStyles = (): CSSProperties => {
    switch (hoverEffect) {
      case 'tilt':
        return {
          transform: isHovering ? getTransform(8) : 'none',
          transition: 'transform 0.15s ease-out, box-shadow 0.3s ease-out',
        }
      case 'lift':
        return {
          transform: isHovering ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: isHovering 
            ? '0 20px 40px rgba(0, 0, 0, 0.1)' 
            : '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        }
      case 'glow':
        return {
          boxShadow: isHovering 
            ? '0 0 30px rgba(20, 184, 166, 0.3), 0 10px 30px rgba(0, 0, 0, 0.1)' 
            : '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.3s ease-out',
        }
      case 'scale':
        return {
          transform: isHovering ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.3s ease-out',
        }
      default:
        return {}
    }
  }

  const animationStyles: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible 
      ? (getHoverStyles().transform as string || 'translateY(0)') 
      : 'translateY(20px)',
    transitionDelay: `${delay}ms`,
  }

  return (
    <div
      ref={ref}
      className={`bg-white rounded-2xl ${className}`}
      style={{
        ...animationStyles,
        ...getHoverStyles(),
        willChange: 'transform, opacity, box-shadow',
      }}
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
