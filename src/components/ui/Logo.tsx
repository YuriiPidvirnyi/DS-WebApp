'use client'

import { useState } from 'react'
import Image from 'next/image'

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

const Logo = ({
  variant = 'default',
  size = 'md',
  className = '',
}: LogoProps) => {
  const [imgError, setImgError] = useState(false)
  const textColor = variant === 'white' ? 'text-white' : 'text-foreground'

  const src =
    variant === 'default'
      ? '/assets/images/logo/logo-mark-teal.svg'
      : '/assets/images/logo/logo-mark-tight.svg'

  // Use text-based logo as fallback or primary
  if (imgError) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center`}>
          <span className="text-primary-foreground font-bold text-sm sm:text-base">DS</span>
        </div>
        <span className={`font-bold ${sizeClasses[size]} ${textColor}`}>
          Dental Story
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={src}
        alt="Dental Story"
        width={size === 'lg' ? 180 : size === 'md' ? 150 : 120}
        height={size === 'lg' ? 48 : size === 'md' ? 40 : 32}
        className="object-contain"
        style={{ width: 'auto', height: 'auto' }}
        onError={() => setImgError(true)}
        priority
      />
    </div>
  )
}

export default Logo
