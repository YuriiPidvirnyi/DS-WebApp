import Image from 'next/image'

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { width: 100, height: 40 },
  md: { width: 140, height: 56 },
  lg: { width: 180, height: 72 },
}

export default function Logo({
  variant = 'default',
  size = 'md',
  className = '',
}: LogoProps) {
  const config = sizeConfig[size]
  const logoSrc = variant === 'white' 
    ? '/assets/images/logo/logo.svg'
    : '/assets/images/logo/logo-mark-teal.svg'

  return (
    <Image
      src={logoSrc}
      alt="Dental Story"
      width={config.width}
      height={config.height}
      className={`h-auto ${variant === 'white' ? 'brightness-0 invert' : ''} ${className}`}
      priority
    />
  )
}
