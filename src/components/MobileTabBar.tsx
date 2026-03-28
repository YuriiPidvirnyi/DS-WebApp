'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Home, Stethoscope, Users, GalleryVertical, MapPin } from 'lucide-react'

const TABS = [
  { href: '/', icon: Home, labelKey: 'navigation.home' },
  { href: '/services', icon: Stethoscope, labelKey: 'navigation.services' },
  { href: '/about', icon: Users, labelKey: 'navigation.about' },
  { href: '/gallery', icon: GalleryVertical, labelKey: 'navigation.gallery' },
  { href: '/contact', icon: MapPin, labelKey: 'navigation.contact' },
] as const

export default function MobileTabBar() {
  const { t } = useTranslation()
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label={t('accessibility.mainNavigation')}
    >
      <div className="flex items-center justify-around h-14">
        {TABS.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
                active
                  ? 'text-dental-primary-600'
                  : 'text-gray-400 active:text-dental-primary-600',
              ].join(' ')}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-tight">
                {t(labelKey)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
