'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Calendar,
  User,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Plus,
  CreditCard,
  ArrowLeft,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface NavItem {
  nameKey: string
  href: string
  icon: React.ReactNode
  badge?: string
}

const navigation: NavItem[] = [
  {
    nameKey: 'cabinet.sidebar.dashboard',
    href: '/cabinet',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    nameKey: 'cabinet.sidebar.appointments',
    href: '/cabinet/appointments',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    nameKey: 'cabinet.sidebar.treatments',
    href: '/cabinet/treatments',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    nameKey: 'cabinet.sidebar.payments',
    href: '/cabinet/payments',
    icon: <CreditCard className="w-5 h-5" />,
    badge: 'cabinet.sidebar.soon',
  },
  {
    nameKey: 'cabinet.sidebar.profile',
    href: '/cabinet/profile',
    icon: <User className="w-5 h-5" />,
  },
  {
    nameKey: 'cabinet.settings.navLink',
    href: '/cabinet/settings',
    icon: <Settings className="w-5 h-5" />,
  },
]

export default function CabinetLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const isActive = (href: string) => {
    if (href === '/cabinet') return pathname === '/cabinet'
    return pathname.startsWith(href)
  }

  const pageTitle = (() => {
    const active = navigation.find(item => isActive(item.href))
    return active ? t(active.nameKey) : t('cabinet.sidebar.title')
  })()

  // Close sidebar on Escape
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
    // Return focus to menu button
    menuButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSidebar()
      }

      // Focus trap within sidebar
      if (e.key === 'Tab' && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, closeSidebar])

  // Move focus into sidebar when opened
  useEffect(() => {
    if (sidebarOpen && sidebarRef.current) {
      const closeBtn = sidebarRef.current.querySelector<HTMLElement>(
        '[data-sidebar-close]'
      )
      closeBtn?.focus()
    }
  }, [sidebarOpen])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  // Auth check on mount + session listener
  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      if (!supabase) {
        router.replace('/auth/login')
        return
      }

      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser()
      if (!supabaseUser) {
        router.replace('/auth/login')
        return
      }
      setUser(supabaseUser)

      // Get profile name
      const { data: profile } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', supabaseUser.id)
        .single()

      if (profile?.first_name) {
        setProfileName(
          `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
        )
      } else if (supabaseUser.user_metadata?.first_name) {
        setProfileName(supabaseUser.user_metadata.first_name)
      }

      setIsLoading(false)
    }

    checkAuth()

    // Listen for auth state changes (token expiry, sign out from another tab)
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event: string) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'SIGNED_OUT') {
            router.replace('/auth/login')
          }
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/')
    router.refresh()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dental-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-dental-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            role="status"
            aria-label={t('common.loading')}
          />
          <p className="text-dental-muted">{t('common.loading')}...</p>
        </div>
      </div>
    )
  }

  // Wait for redirect
  if (!user) return null

  const displayName =
    profileName || user.user_metadata?.first_name || t('cabinet.defaultPatient')
  const initials =
    displayName
      .split(' ')
      .map((n: string) => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'P'

  return (
    <div className="min-h-screen bg-dental-secondary-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-dental-dark/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        id="mobile-sidebar"
        ref={sidebarRef}
        role="dialog"
        aria-modal={sidebarOpen}
        aria-label={t('cabinet.sidebar.title')}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-3rem)] bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-dental-secondary-100">
          <Link
            href="/cabinet"
            onClick={closeSidebar}
            tabIndex={sidebarOpen ? 0 : -1}
          >
            <Logo size="sm" />
          </Link>
          <button
            data-sidebar-close
            onClick={closeSidebar}
            tabIndex={sidebarOpen ? 0 : -1}
            aria-label={t('common.close')}
            className="p-2 rounded-lg text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile user card */}
        <div className="px-4 py-4 border-b border-dental-secondary-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-dental-primary-600 flex items-center justify-center text-white font-semibold text-sm shrink-0"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-dental-dark truncate">
                {displayName}
              </p>
              <p className="text-xs text-dental-muted truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <nav
          aria-label={t('cabinet.sidebar.navigation')}
          className="px-3 py-4 space-y-1"
        >
          {navigation.map(item => (
            <Link
              key={item.nameKey}
              href={item.href}
              onClick={closeSidebar}
              tabIndex={sidebarOpen ? 0 : -1}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500 ${
                isActive(item.href)
                  ? 'bg-dental-primary-600 text-white shadow-md shadow-dental-primary-600/25'
                  : 'text-dental-text hover:bg-dental-secondary-50'
              }`}
            >
              {item.icon}
              <span className="flex-1">{t(item.nameKey)}</span>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dental-secondary-200 text-dental-muted font-medium">
                  {t(item.badge)}
                </span>
              )}
              {isActive(item.href) && !item.badge && (
                <ChevronRight className="w-4 h-4" />
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile book + logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-dental-secondary-100 space-y-1.5 bg-white">
          <Link
            href="/booking"
            onClick={closeSidebar}
            tabIndex={sidebarOpen ? 0 : -1}
            className="flex items-center justify-center gap-2 w-full bg-dental-primary-600 hover:bg-dental-primary-700 text-white py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <Plus className="w-4 h-4" />
            {t('cabinet.bookAppointment')}
          </Link>
          <Link
            href="/"
            onClick={closeSidebar}
            tabIndex={sidebarOpen ? 0 : -1}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('cabinet.sidebar.backToSite')}
          </Link>
          <button
            onClick={handleLogout}
            tabIndex={sidebarOpen ? 0 : -1}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-dental-muted hover:text-red-600 hover:bg-red-50 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <LogOut className="w-4 h-4" />
            {t('cabinet.logout')}
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col"
        aria-label={t('cabinet.sidebar.title')}
      >
        <div className="flex flex-col flex-1 bg-white border-r border-dental-secondary-100">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-dental-secondary-100">
            <Link
              href="/"
              className="focus:outline-none focus:ring-2 focus:ring-dental-primary-500 rounded-lg"
            >
              <Logo size="sm" />
            </Link>
          </div>

          {/* User card */}
          <div className="px-4 py-4 border-b border-dental-secondary-100">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-dental-primary-600 flex items-center justify-center text-white font-semibold text-sm shrink-0"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-dental-dark truncate">
                  {displayName}
                </p>
                <p className="text-xs text-dental-muted truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav
            aria-label={t('cabinet.sidebar.navigation')}
            className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
          >
            {navigation.map(item => (
              <Link
                key={item.nameKey}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500 ${
                  isActive(item.href)
                    ? 'bg-dental-primary-600 text-white shadow-md shadow-dental-primary-600/25'
                    : 'text-dental-text hover:bg-dental-secondary-50'
                }`}
              >
                {item.icon}
                <span className="flex-1">{t(item.nameKey)}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dental-secondary-200 text-dental-muted font-medium">
                    {t(item.badge)}
                  </span>
                )}
                {isActive(item.href) && !item.badge && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t border-dental-secondary-100 space-y-1.5">
            <Link
              href="/booking"
              className="flex items-center justify-center gap-2 w-full bg-dental-primary-600 hover:bg-dental-primary-700 text-white py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-700"
            >
              <Plus className="w-4 h-4" />
              {t('cabinet.bookAppointment')}
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('cabinet.sidebar.backToSite')}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-dental-muted hover:text-red-600 hover:bg-red-50 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <LogOut className="w-4 h-4" />
              {t('cabinet.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white/95 backdrop-blur-sm border-b border-dental-secondary-100 lg:px-8">
          <button
            ref={menuButtonRef}
            onClick={() => setSidebarOpen(true)}
            aria-label={t('cabinet.sidebar.openMenu')}
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
            className="p-2 -ml-2 rounded-lg text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 lg:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex items-center justify-between ml-1 lg:ml-0">
            <h1 className="text-lg font-semibold text-dental-dark">
              <span className="lg:hidden">{t('cabinet.sidebar.title')}</span>
              <span className="hidden lg:inline">{pageTitle}</span>
            </h1>

            <div className="flex items-center gap-3">
              <Link
                href="/booking"
                className="hidden sm:flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-700"
              >
                <Plus className="w-4 h-4" />
                {t('cabinet.bookAppointment')}
              </Link>
              <Link
                href="/cabinet/profile"
                className="lg:hidden rounded-full focus:outline-none focus:ring-2 focus:ring-dental-primary-500 focus:ring-offset-2"
                aria-label={t('cabinet.sidebar.profile')}
              >
                <div className="w-8 h-8 rounded-full bg-dental-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                  {initials}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
