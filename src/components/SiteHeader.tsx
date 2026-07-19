'use client'

import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  X,
  Phone,
  Mail,
  Clock,
  User,
  LogIn,
  Calendar,
  Home,
  Stethoscope,
  Users,
  GalleryVertical,
  MapPin,
} from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'
import Logo from '@/components/ui/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const Header = memo(() => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  // Check auth state (only when Supabase is configured)
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
      return

    const supabase = createClient()
    if (!supabase) return

    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: SupabaseUser | null } }) => {
        setUser(data?.user ?? null)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: SupabaseUser } | null) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open')
    } else {
      document.body.classList.remove('menu-open')
    }
    return () => document.body.classList.remove('menu-open')
  }, [isMenuOpen])

  // Close menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  // Close menu on Escape
  useEffect(() => {
    if (!isMenuOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMenuOpen])

  const navigation = useMemo(
    () => [
      { name: t('navigation.home'), href: '/', icon: Home },
      { name: t('navigation.services'), href: '/services', icon: Stethoscope },
      { name: t('navigation.about'), href: '/about', icon: Users },
      {
        name: t('navigation.gallery'),
        href: '/gallery',
        icon: GalleryVertical,
      },
      { name: t('navigation.contact'), href: '/contact', icon: MapPin },
    ],
    [t]
  )

  const isActive = useCallback((path: string) => pathname === path, [pathname])

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  const nunitoFont = {
    fontFamily: 'var(--font-nunito), Nunito, system-ui, sans-serif',
  }

  // Hide header on cabinet and admin routes (they have their own layouts)
  if (pathname?.startsWith('/cabinet') || pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <header
      className="bg-white shadow-xs z-50 min-w-0 overflow-x-clip shrink-0"
      role="banner"
    >
      {/* Top contact bar — visible on sm+ */}
      <div
        className="hidden sm:block bg-dental-primary-900 text-white"
        role="complementary"
        aria-label={t('accessibility.contactInfo')}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-4 xl:px-8 py-2">
          <div className="flex items-center text-sm">
            {/* Left: contacts */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="font-medium tracking-wide">
                  {CONTACT_INFO.phone}
                </span>
              </a>
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="hidden xl:flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="font-medium">{CONTACT_INFO.email}</span>
              </a>
            </div>

            {/* Center: hours + booking CTA */}
            <div className="hidden lg:flex items-center gap-4 justify-center">
              <span className="text-white/85 font-medium text-xs lg:text-sm whitespace-nowrap">
                {CONTACT_INFO.workingHours.weekdays} |{' '}
                {CONTACT_INFO.workingHours.saturday}
              </span>
              <Link
                href="/booking"
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-1 rounded-full font-semibold text-xs transition-all duration-200 whitespace-nowrap border border-white/30 hover:border-white/50"
                style={nunitoFont}
                aria-label={t('buttons.bookAppointment')}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{t('buttons.bookAppointment')}</span>
              </Link>
            </div>

            {/* Right: auth + language */}
            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
              <span className="lg:hidden text-white/85 font-medium text-xs whitespace-nowrap">
                {CONTACT_INFO.workingHours.weekdays} |{' '}
                {CONTACT_INFO.workingHours.saturday}
              </span>
              {user ? (
                <Link
                  href="/cabinet"
                  className="hidden xl:flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
                  title={t('cabinet.myProfile')}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs">
                    {t('cabinet.myProfile')}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden xl:flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
                  title={t('auth.login.submit')}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs">
                    {t('auth.login.submit')}
                  </span>
                </Link>
              )}
              <div className="hidden lg:block [&_button]:min-h-0! [&_button]:py-0.5! [&_button]:text-white/90! hover:[&_button]:text-white! [&_button]:border-white/20!">
                <LanguageSwitcher variant="dropdown" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main bar: Logo + CTA + Burger — mobile only (desktop has logo in sidebar) */}
      <div className="lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 lg:py-3 gap-4">
            {/* Logo */}
            <Link
              href="/"
              aria-label={t('accessibility.homeLink')}
              className="shrink-0"
            >
              <Logo variant="default" size="sm" />
            </Link>

            {/* Mobile: CTA + burger */}
            <div className="flex lg:hidden items-center gap-2">
              <Link
                href="/booking"
                aria-label={t('buttons.bookAppointment')}
                className="flex min-h-11 items-center gap-1.5 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2 rounded-full font-semibold text-sm transition-colors"
                style={nunitoFont}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t('buttons.bookAppointment')}
                </span>
              </Link>
              <button
                onClick={toggleMenu}
                className="flex h-11 w-11 items-center justify-center text-dental-text hover:text-dental-primary-ink focus:outline-hidden focus:ring-2 focus:ring-dental-primary-400 focus:ring-offset-2 rounded-lg transition-colors"
                aria-label={
                  isMenuOpen
                    ? t('accessibility.closeMenu')
                    : t('accessibility.openMenu')
                }
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Телефон і години не зникають на телефоні (знахідка М1) */}
        <a
          href={`tel:${CONTACT_INFO.phoneRaw}`}
          className="sm:hidden flex min-h-11 items-center justify-center gap-4 bg-dental-primary-50 border-y border-dental-primary-100 text-[13px]"
        >
          <span className="flex items-center gap-1.5 font-semibold text-dental-primary-ink">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {CONTACT_INFO.phone}
          </span>
          <span className="text-dental-muted">
            {CONTACT_INFO.workingHours.weekdays}
          </span>
        </a>
      </div>

      {/* Mobile menu — nav + messengers + auth + language */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            aria-hidden="true"
            onClick={closeMenu}
          />

          <div
            ref={menuRef}
            className="lg:hidden absolute left-0 right-0 z-50 bg-white border-t shadow-lg"
            id="mobile-menu"
          >
            <div className="px-4 pt-2 pb-4">
              {/* Page links with icons */}
              <div className="space-y-1">
                {navigation.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-dental-primary-ink bg-dental-primary-50 font-semibold'
                          : 'text-dental-dark hover:text-dental-primary-ink hover:bg-dental-secondary-50'
                      }`}
                      style={nunitoFont}
                      onClick={closeMenu}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              {/* Messengers — mobile only (М5): on tablet the top contact bar
                  is the single contact channel, so these redundant links drop. */}
              <div className="sm:hidden mt-3 pt-3 border-t border-dental-secondary-100 space-y-1">
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-dental-dark hover:text-dental-primary-ink hover:bg-dental-secondary-50 transition-colors"
                  onClick={closeMenu}
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-medium text-sm" style={nunitoFont}>
                    {t('radialMenu.actions.phone')}
                  </span>
                </a>
                {CONTACT_INFO.social?.whatsapp && (
                  <a
                    href={CONTACT_INFO.social.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-dental-dark hover:text-dental-primary-ink hover:bg-dental-secondary-50 transition-colors"
                    onClick={closeMenu}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="font-medium text-sm" style={nunitoFont}>
                      WhatsApp
                    </span>
                  </a>
                )}
                {CONTACT_INFO.social?.telegram && (
                  <a
                    href={CONTACT_INFO.social.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-dental-dark hover:text-dental-primary-ink hover:bg-dental-secondary-50 transition-colors"
                    onClick={closeMenu}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    <span className="font-medium text-sm" style={nunitoFont}>
                      Telegram
                    </span>
                  </a>
                )}
                <div className="mt-2 rounded-xl bg-dental-secondary-50 border border-dental-secondary-200 px-4 py-3 text-sm text-dental-text space-y-1.5">
                  <p className="flex items-center gap-2">
                    <Clock
                      className="h-4 w-4 text-dental-primary-500"
                      aria-hidden="true"
                    />
                    {CONTACT_INFO.workingHours.weekdays} ·{' '}
                    {CONTACT_INFO.workingHours.saturday}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4 text-dental-primary-500"
                      aria-hidden="true"
                    />
                    {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}
                  </p>
                </div>
              </div>

              {/* Auth + Language */}
              <div className="mt-3 pt-3 border-t border-dental-secondary-100 space-y-3">
                {user ? (
                  <Link
                    href="/cabinet"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-dental-dark hover:bg-dental-secondary-50 transition-colors"
                    onClick={closeMenu}
                  >
                    <User className="w-5 h-5 text-dental-primary-ink" />
                    <span className="font-medium" style={nunitoFont}>
                      {t('cabinet.myProfile')}
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-dental-dark hover:bg-dental-secondary-50 transition-colors"
                    onClick={closeMenu}
                  >
                    <LogIn className="w-5 h-5 text-dental-primary-ink" />
                    <span className="font-medium" style={nunitoFont}>
                      {t('auth.login.submit')}
                    </span>
                  </Link>
                )}

                <LanguageSwitcher variant="inline" className="justify-center" />
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
})

Header.displayName = 'Header'

export default Header
