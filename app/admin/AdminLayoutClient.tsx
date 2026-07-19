'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Calendar,
  Users,
  User,
  Stethoscope,
  Star,
  MessageSquare,
  Phone,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ClipboardCheck,
  ClipboardList,
  Package,
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  DatabaseZap,
  Activity,
  Boxes,
  UserCircle,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'
import SidebarNavItem from '@/components/ui/SidebarNavItem'
import UserSidebarCard from '@/components/ui/UserSidebarCard'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useDrawerA11y } from '@/hooks/useDrawerA11y'
import { canAccessNavItem } from '@/lib/permissions'
import { RoleBadge } from '@/components/ui'
import { isInventoryV2EnabledClient } from '@/lib/feature-flags'

type NavGroup = 'operations' | 'communications' | 'inventory' | 'system'

interface NavItem {
  nameKey: string
  href: string
  icon: React.ReactNode
  group: NavGroup
}

/* Порядок груп меню (макет 1c, знахідка 12) */
const NAV_GROUPS: NavGroup[] = [
  'operations',
  'communications',
  'inventory',
  'system',
]

const ALL_NAV_ITEMS: NavItem[] = [
  {
    nameKey: 'admin.sidebar.dashboard',
    group: 'operations',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.appointments',
    group: 'operations',
    href: '/admin/appointments',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.patients',
    group: 'operations',
    href: '/admin/patients',
    icon: <Users className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.doctors',
    group: 'operations',
    href: '/admin/doctors',
    icon: <User className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.services',
    group: 'operations',
    href: '/admin/services',
    icon: <Stethoscope className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.reviews',
    group: 'communications',
    href: '/admin/reviews',
    icon: <Star className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.contacts',
    group: 'communications',
    href: '/admin/contacts',
    icon: <Phone className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.intake',
    group: 'operations',
    href: '/admin/intake',
    icon: <ClipboardCheck className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.chat',
    group: 'communications',
    href: '/admin/chat',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.treatments',
    group: 'operations',
    href: '/admin/treatments',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.materials',
    group: 'inventory',
    href: '/admin/materials',
    icon: <Package className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.orders',
    group: 'inventory',
    href: '/admin/orders',
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  ...(isInventoryV2EnabledClient()
    ? [
        {
          nameKey: 'admin.sidebar.stock',
          group: 'inventory',
          href: '/admin/stock',
          icon: <Boxes className="w-5 h-5" />,
        } satisfies NavItem,
      ]
    : []),
  {
    nameKey: 'admin.sidebar.analytics',
    group: 'system',
    href: '/admin/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.dataQuality',
    group: 'system',
    href: '/admin/data-quality',
    icon: <DatabaseZap className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.health',
    group: 'system',
    href: '/admin/health',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.settings',
    group: 'system',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.users',
    group: 'system',
    href: '/admin/users',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
]

const footerLinkBase =
  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-hidden focus:ring-2'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAdminAuth()
  const {
    triggerRef,
    drawerRef,
    close: closeSidebar,
  } = useDrawerA11y({
    open: sidebarOpen,
    onClose: () => setSidebarOpen(false),
    autoFocusSelector: '[data-drawer-autofocus]',
  })

  const navigation = user
    ? ALL_NAV_ITEMS.filter(item => canAccessNavItem(user.role, item.href))
    : []

  const isActive = useCallback(
    (href: string) => {
      if (href === '/admin') return pathname === '/admin'
      return pathname.startsWith(href)
    },
    [pathname]
  )

  const isLoginPage = pathname === '/admin/login'

  const pageTitle = (() => {
    const active = navigation.find(item => isActive(item.href))
    return active ? t(active.nameKey) : t('admin.layout.panel')
  })()

  // Auth guard + permission redirect
  useEffect(() => {
    if (isLoginPage || isLoading) return

    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }

    if (user && pathname !== '/admin') {
      if (!canAccessNavItem(user.role, pathname)) {
        router.replace('/admin')
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, pathname, router, user])

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (isLoading && !isLoginPage) {
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

  if (!isAuthenticated && !isLoginPage) {
    return null
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const displayName = user?.name || t('admin.layout.defaultUser')
  const initials =
    displayName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A'

  const userCard = user ? (
    <UserSidebarCard
      name={displayName}
      email={user.email}
      extra={<RoleBadge role={user.role} />}
    />
  ) : null

  const renderNav = (onItemClick?: () => void, mobile = false) => (
    <nav
      aria-label={t('admin.layout.sidebarNav')}
      className={
        mobile
          ? 'px-3 py-4 space-y-1'
          : 'flex-1 px-3 py-4 space-y-1 overflow-y-auto'
      }
    >
      {NAV_GROUPS.map(group => {
        const items = navigation.filter(item => item.group === group)
        if (items.length === 0) return null
        return (
          <div key={group} className="not-first:mt-4">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-dental-secondary-500">
              {t(`admin.sidebar.groups.${group}`)}
            </p>
            <div className="space-y-1">
              {items.map(item => (
                <SidebarNavItem
                  key={item.nameKey}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.nameKey)}
                  active={isActive(item.href)}
                  onClick={onItemClick}
                  tabIndex={mobile ? (sidebarOpen ? 0 : -1) : undefined}
                />
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )

  const renderFooter = (onItemClick?: () => void, mobile = false) => (
    <div
      className={`p-4 border-t border-dental-secondary-100 space-y-1.5 ${
        mobile ? 'pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-white' : ''
      }`}
    >
      <Link
        href="/cabinet"
        onClick={onItemClick}
        tabIndex={mobile ? (sidebarOpen ? 0 : -1) : undefined}
        className={`${footerLinkBase} text-dental-primary-700 hover:bg-dental-primary-50 focus:ring-dental-primary-500`}
      >
        <UserCircle className="w-4 h-4" />
        {t('admin.layout.patientCabinet')}
      </Link>
      <Link
        href="/"
        onClick={onItemClick}
        tabIndex={mobile ? (sidebarOpen ? 0 : -1) : undefined}
        className={`${footerLinkBase} text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 focus:ring-dental-primary-500`}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('admin.layout.backToSite')}
      </Link>
      <button
        onClick={handleLogout}
        tabIndex={mobile ? (sidebarOpen ? 0 : -1) : undefined}
        className={`w-full ${footerLinkBase} text-dental-muted hover:text-status-error-700 hover:bg-status-error-100 focus:ring-dental-error`}
      >
        <LogOut className="w-4 h-4" />
        {t('admin.layout.logout')}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-dental-secondary-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-dental-dark/50 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        id="mobile-sidebar"
        ref={drawerRef}
        role="dialog"
        aria-modal={sidebarOpen}
        aria-label={t('admin.layout.sidebarNav')}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-3rem)] bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-dental-secondary-100">
          <Link
            href="/admin"
            onClick={closeSidebar}
            tabIndex={sidebarOpen ? 0 : -1}
            className="focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 rounded-lg"
          >
            <Logo size="sm" />
          </Link>
          <button
            data-drawer-autofocus
            onClick={closeSidebar}
            tabIndex={sidebarOpen ? 0 : -1}
            aria-label={t('common.close')}
            className="p-2 rounded-lg text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {userCard}
        <div className="flex-1 overflow-y-auto">
          {renderNav(closeSidebar, true)}
        </div>
        {renderFooter(closeSidebar, true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col"
        aria-label={t('admin.layout.sidebarNav')}
      >
        <div className="flex flex-col flex-1 bg-white border-r border-dental-secondary-100">
          <div className="flex items-center h-16 px-6 border-b border-dental-secondary-100">
            <Link
              href="/admin"
              className="focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 rounded-lg"
            >
              <Logo size="sm" />
            </Link>
          </div>
          {userCard}
          {renderNav()}
          {renderFooter()}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white/95 backdrop-blur-xs border-b border-dental-secondary-100 lg:px-8">
          <button
            ref={triggerRef}
            onClick={() => setSidebarOpen(true)}
            aria-label={t('admin.layout.openSidebar')}
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
            className="p-2 -ml-2 rounded-lg text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 lg:hidden transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex items-center justify-between ml-1 lg:ml-0">
            <h1 className="text-lg font-semibold text-dental-dark">
              <span className="lg:hidden">{t('admin.layout.panel')}</span>
              <span className="hidden lg:inline">{pageTitle}</span>
            </h1>

            <div className="flex items-center gap-4 ml-auto">
              <div
                className="hidden sm:flex items-center gap-2 text-sm text-dental-muted"
                aria-live="polite"
              >
                <div
                  className="w-2 h-2 bg-dental-success rounded-full"
                  aria-hidden="true"
                />
                {t('admin.layout.systemOnline')}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full bg-dental-primary-600 flex items-center justify-center text-white font-semibold text-xs"
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-dental-dark">
                  {displayName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
