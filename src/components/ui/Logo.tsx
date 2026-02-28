import Image from 'next/image'

// Logo component - DO NOT MODIFY without user permission
// Uses SVG files from /public/assets/images/logo/

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LOGO_SIZES = {
  sm: { width: 100, height: 40 },
  md: { width: 140, height: 56 },
  lg: { width: 180, height: 72 },
} as const

export default function Logo({
  variant = 'default',
  size = 'md',
  className = '',
}: LogoProps) {
  const { width, height } = LOGO_SIZES[size]
  const src = variant === 'white' 
    ? '/assets/images/logo/logo.svg'
    : '/assets/images/logo/logo-mark-teal.svg'

  return (
    <div 
      className={`relative flex-shrink-0 ${className}`}
      style={{ width, height }}
    >
      <Image
        src={src}
        alt="Dental Story"
        fill
        className={`object-contain ${variant === 'white' ? 'brightness-0 invert' : ''}`}
        priority
      />
    </div>
  )
}
