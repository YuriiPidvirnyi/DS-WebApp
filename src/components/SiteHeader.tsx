'use client'

import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Menu, X, Phone, Mail, User, LogIn, Calendar } from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'
import Logo from '@/components/ui/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const Header = memo(() => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [mainBarVisible, setMainBarVisible] = useState(true)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0)
  const ticking = useRef(false)
  const scrollReady = useRef(false)

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

  // Hide/show main bar on scroll direction with debounce
  useEffect(() => {
    let scrollAccumulator = 0
    const THRESHOLD = 60 // px of consistent scroll before toggling

    // Initialize scroll position to prevent jitter on reload
    lastScrollY.current = window.scrollY
    // Skip the first few scroll events after mount to avoid jitter
    const initTimer = setTimeout(() => {
      scrollReady.current = true
    }, 300)

    const onScroll = () => {
      if (!scrollReady.current) {
        lastScrollY.current = window.scrollY
        return
      }
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollY.current

        // Always show when near top or menu is open
        if (currentY < 150 || isMenuOpen) {
          setMainBarVisible(true)
          scrollAccumulator = 0
        } else {
          // Accumulate scroll in one direction; reset on direction change
          if (delta > 0) {
            scrollAccumulator =
              scrollAccumulator > 0 ? scrollAccumulator + delta : delta
          } else if (delta < 0) {
            scrollAccumulator =
              scrollAccumulator < 0 ? scrollAccumulator + delta : delta
          }

          if (scrollAccumulator > THRESHOLD) {
            setMainBarVisible(false)
            scrollAccumulator = 0
          } else if (scrollAccumulator < -THRESHOLD) {
            setMainBarVisible(true)
            scrollAccumulator = 0
          }
        }

        lastScrollY.current = currentY
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(initTimer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isMenuOpen])

  const navigation = useMemo(
    () => [
      { name: t('navigation.home'), href: '/' },
      { name: t('navigation.services'), href: '/services' },
      { name: t('navigation.about'), href: '/about' },
      { name: t('navigation.gallery'), href: '/gallery' },
      { name: t('navigation.contact'), href: '/contact' },
    ],
    [t]
  )

  const isActive = useCallback((path: string) => pathname === path, [pathname])

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  // Nunito font for nav links — inline style needed because
  // body CSS sets font-family: var(--font-rubik) which overrides Tailwind classes
  const nunitoFont = {
    fontFamily: 'var(--font-nunito), Nunito, system-ui, sans-serif',
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" role="banner">
      {/* Top bar — hidden on mobile */}
      <div
        className="hidden sm:block bg-dental-primary-900 text-white py-2"
        role="complementary"
        aria-label={t('accessibility.contactInfo')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-5">
              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-medium tracking-wide">
                  {CONTACT_INFO.phone}
                </span>
              </a>
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="hidden md:flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-medium">{CONTACT_INFO.email}</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/70 font-medium text-xs lg:text-sm">
                {CONTACT_INFO.workingHours.weekdays} |{' '}
                {CONTACT_INFO.workingHours.saturday}
              </span>
              <Link
                href="/booking"
                className="hidden lg:flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-1 rounded-full font-semibold text-xs transition-all duration-200 whitespace-nowrap border border-white/30 hover:border-white/50"
                style={nunitoFont}
                data-track-id="cta_book_now"
                data-track-category="navigation"
                data-track-label="header_cta"
                aria-label={t('buttons.bookAppointment')}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{t('buttons.bookAppointment')}</span>
              </Link>
              {user ? (
                <Link
                  href="/cabinet"
                  className="hidden lg:flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
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
                  className="hidden lg:flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
                  title={t('auth.login.submit')}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs">
                    {t('auth.login.submit')}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header — collapses/expands on scroll via grid trick */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: mainBarVisible ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3 lg:py-4 gap-4">
              {/* Logo */}
              <Link
                href="/"
                aria-label={t('accessibility.homeLink')}
                className="shrink-0"
              >
                <Logo variant="default" size="sm" />
              </Link>

              {/* Desktop navigation — centered */}
              <nav
                className="hidden lg:flex items-center gap-1"
                role="navigation"
                aria-label={t('accessibility.mainNavigation')}
              >
                {navigation.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors duration-200 font-medium whitespace-nowrap ${
                      isActive(item.href)
                        ? 'text-dental-primary-600 bg-dental-primary-50'
                        : 'text-dental-dark hover:text-dental-primary-600 hover:bg-gray-50'
                    }`}
                    style={nunitoFont}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Right side: Language */}
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <LanguageSwitcher variant="dropdown" />
              </div>

              {/* Mobile: CTA + burger */}
              <div className="flex lg:hidden items-center gap-2">
                <Link
                  href="/booking"
                  className="flex items-center gap-1.5 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2 rounded-full font-semibold text-sm transition-colors"
                  style={nunitoFont}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t('buttons.bookAppointment')}
                  </span>
                </Link>
                <button
                  onClick={toggleMenu}
                  className="p-2 text-dental-text hover:text-dental-primary-600 focus:outline-none focus:ring-2 focus:ring-dental-primary-400 focus:ring-offset-2 rounded-lg transition-colors"
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
        </div>
      </div>

      {/* Mobile menu with backdrop */}
      {isMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            aria-hidden="true"
            onClick={closeMenu}
          />

          <div
            ref={menuRef}
            className="lg:hidden absolute left-0 right-0 z-50 bg-white border-t shadow-lg"
            id="mobile-menu"
            role="navigation"
            aria-label={t('accessibility.mobileMenu')}
          >
            <div className="px-4 pt-2 pb-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="space-y-1">
                {navigation.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-xl transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-dental-primary-600 bg-dental-primary-50 font-semibold'
                        : 'text-dental-dark hover:text-dental-primary-600 hover:bg-gray-50'
                    }`}
                    style={nunitoFont}
                    onClick={closeMenu}
                    tabIndex={0}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Auth + Language in mobile */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {user ? (
                  <Link
                    href="/cabinet"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-dental-dark hover:bg-gray-50 transition-colors"
                    onClick={closeMenu}
                  >
                    <User className="w-5 h-5 text-dental-primary-600" />
                    <span className="font-medium" style={nunitoFont}>
                      {t('cabinet.myProfile')}
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-dental-dark hover:bg-gray-50 transition-colors"
                    onClick={closeMenu}
                  >
                    <LogIn className="w-5 h-5 text-dental-primary-600" />
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
