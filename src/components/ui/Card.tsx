import { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { CARD_VARIANT_CLASSES, type CardVariant } from './card-variants'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hoverable?: boolean
  as?: 'div' | 'article' | 'section'
}

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  as: Component = 'div',
  className,
  ...props
}: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10 sm:p-12',
  }

  const hoverStyles = hoverable
    ? 'transition-shadow duration-200 hover:shadow-xl'
    : ''

  return (
    <Component
      className={clsx(
        'rounded-lg',
        CARD_VARIANT_CLASSES[variant],
        paddingStyles[padding],
        hoverStyles,
        className
      )}
      {...(props as HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </Component>
  )
}

// Card Header component
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardHeader = ({
  children,
  className,
  ...props
}: CardHeaderProps) => {
  return (
    <div className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

// Card Title component
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const CardTitle = ({
  children,
  as: Component = 'h3',
  className,
  ...props
}: CardTitleProps) => {
  return (
    <Component
      className={clsx('text-xl font-semibold text-dental-dark', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

// Card Description component
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const CardDescription = ({
  children,
  size = 'md',
  className,
  ...props
}: CardDescriptionProps) => {
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <p
      className={clsx('text-dental-text', sizeStyles[size], className)}
      {...props}
    >
      {children}
    </p>
  )
}

// Card Footer component
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardFooter = ({
  children,
  className,
  ...props
}: CardFooterProps) => {
  return (
    <div
      className={clsx(
        'mt-6 pt-6 border-t border-dental-secondary-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Media component — enforces consistent aspect ratio for image areas
type AspectRatio = 'video' | 'square' | 'wide' | 'portrait'

export interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  aspectRatio?: AspectRatio
}

export const CardMedia = ({
  children,
  aspectRatio = 'video',
  className,
  ...props
}: CardMediaProps) => {
  const aspectStyles: Record<AspectRatio, string> = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-3/2',
    portrait: 'aspect-3/4',
  }

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-t-lg',
        aspectStyles[aspectRatio],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
