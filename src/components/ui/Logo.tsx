interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Logo = ({
  variant = 'default',
  size = 'md',
  className = '',
}: LogoProps) => {
  const sizeClasses: Record<NonNullable<LogoProps['size']>, string> = {
    sm: 'w-32 h-10',
    md: 'w-48 h-12',
    lg: 'w-56 h-14',
  }

  const src =
    variant === 'default'
      ? '/assets/images/logo/logo-mark-teal.svg'
      : '/assets/images/logo/logo-mark-tight.svg'

  const filterClass = ''

  return (
    <img
      src={src}
      alt="Dental Story"
      className={`${sizeClasses[size]} ${filterClass} object-contain ${className}`}
      loading="eager"
      width={224}
      height={48}
    />
  )
}

export default Logo
