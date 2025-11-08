import clsx from 'clsx'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: 'teal' | 'blue' | 'white'
}

export const Spinner = ({
  size = 'md',
  className,
  color = 'teal',
}: SpinnerProps) => {
  const sizeStyles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  }

  const colorStyles = {
    teal: 'border-dental-teal border-t-transparent',
    blue: 'border-dental-blue border-t-transparent',
    white: 'border-white border-t-transparent',
  }

  return (
    <div
      className={clsx(
        'animate-spin rounded-full',
        sizeStyles[size],
        colorStyles[color],
        className
      )}
      role="status"
      aria-label="Завантаження"
    >
      <span className="sr-only">Завантаження...</span>
    </div>
  )
}
