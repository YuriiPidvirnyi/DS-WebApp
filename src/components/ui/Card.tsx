import { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className,
  ...props
}: CardProps) => {
  const baseStyles = 'rounded-xl'

  const variantStyles = {
    default: 'bg-white shadow-sm',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-gray-50',
  }

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const hoverStyles = hoverable
    ? 'transition-shadow duration-200 hover:shadow-xl'
    : ''

  return (
    <div
      className={clsx(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        hoverStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
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
      className={clsx('text-xl font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

// Card Description component
export interface CardDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export const CardDescription = ({
  children,
  className,
  ...props
}: CardDescriptionProps) => {
  return (
    <p className={clsx('text-gray-600', className)} {...props}>
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
      className={clsx('mt-6 pt-6 border-t border-gray-100', className)}
      {...props}
    >
      {children}
    </div>
  )
}
