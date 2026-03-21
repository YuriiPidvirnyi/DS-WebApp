import Image from 'next/image'
import uk from '@/locales/uk'

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap: Record<
  NonNullable<LogoProps['size']>,
  { w: number; h: number; cls: string }
> = {
  sm: { w: 128, h: 40, cls: 'w-32 h-10' },
  md: { w: 192, h: 48, cls: 'w-48 h-12' },
  lg: { w: 224, h: 56, cls: 'w-56 h-14' },
}

const Logo = ({
  variant = 'default',
  size = 'md',
  className = '',
}: LogoProps) => {
  const src =
    variant === 'default'
      ? '/assets/images/logo/logo-mark-teal.svg'
      : '/assets/images/logo/logo-mark-tight.svg'

  const { w, h, cls } = sizeMap[size]

  return (
    <Image
      src={src}
      alt={uk.common.brandName}
      width={w}
      height={h}
      priority
      className={`${cls} object-contain ${className}`}
    />
  )
}

export default Logo
