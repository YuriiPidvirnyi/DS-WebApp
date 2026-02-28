'use client'

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { icon: 'w-7 h-7', iconText: 'text-xs', text: 'text-base' },
  md: { icon: 'w-8 h-8 sm:w-9 sm:h-9', iconText: 'text-sm', text: 'text-lg sm:text-xl' },
  lg: { icon: 'w-10 h-10 sm:w-11 sm:h-11', iconText: 'text-base', text: 'text-xl sm:text-2xl' },
}

export default function Logo({
  variant = 'default',
  size = 'md',
  className = '',
}: LogoProps) {
  const config = sizeConfig[size]
  const textColor = variant === 'white' ? 'text-white' : 'text-foreground'
  const iconBg = variant === 'white' ? 'bg-white/20' : 'bg-primary'
  const iconText = variant === 'white' ? 'text-white' : 'text-primary-foreground'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${config.icon} ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <span className={`${iconText} font-bold ${config.iconText}`}>DS</span>
      </div>
      <span className={`font-bold tracking-tight ${config.text} ${textColor}`}>
        Dental<span className="text-primary">Story</span>
      </span>
    </div>
  )
}
