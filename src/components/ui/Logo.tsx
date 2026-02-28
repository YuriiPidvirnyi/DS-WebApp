'use client'

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { icon: 'w-8 h-8', text: 'text-lg', gap: 'gap-2' },
  md: { icon: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-xl sm:text-2xl', gap: 'gap-2.5' },
  lg: { icon: 'w-11 h-11 sm:w-12 sm:h-12', text: 'text-2xl sm:text-3xl', gap: 'gap-3' },
}

export default function Logo({
  variant = 'default',
  size = 'md',
  className = '',
}: LogoProps) {
  const config = sizeConfig[size]
  const textColor = variant === 'white' ? 'text-white' : 'text-foreground'

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {/* Tooth icon */}
      <div className={`${config.icon} relative flex-shrink-0`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Tooth shape */}
          <path 
            d="M20 4C14 4 10 8 10 14C10 18 8 24 8 28C8 32 10 36 14 36C16 36 17 34 18 32C19 30 20 30 20 30C20 30 21 30 22 32C23 34 24 36 26 36C30 36 32 32 32 28C32 24 30 18 30 14C30 8 26 4 20 4Z" 
            className={variant === 'white' ? 'fill-white' : 'fill-primary'}
          />
          {/* Shine effect */}
          <path 
            d="M16 12C16 12 17 10 20 10C23 10 24 12 24 12" 
            stroke={variant === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)'}
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
      </div>
      {/* Text */}
      <div className={`font-bold tracking-tight ${config.text} ${textColor}`}>
        <span>Dental</span>
        <span className={variant === 'white' ? 'text-white/80' : 'text-primary'}>Story</span>
      </div>
    </div>
  )
}
