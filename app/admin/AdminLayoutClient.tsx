'use client'

import { useEffect, useState } from 'react'
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
  ChevronRight,
  ClipboardList,
  Package,
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  DatabaseZap,
  Activity,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import {
  canAccessNavItem,
  ROLE_BADGE_CLASSES,
  type AdminRole,
} from '@/lib/permissions'

interface NavItem {
  nameKey: string
  href: string
  icon: React.ReactNode
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    nameKey: 'admin.sidebar.dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.appointments',
    href: '/admin/appointments',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.patients',
    href: '/admin/patients',
    icon: <Users className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.doctors',
    href: '/admin/doctors',
    icon: <User className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.services',
    href: '/admin/services',
    icon: <Stethoscope className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.reviews',
    href: '/admin/reviews',
    icon: <Star className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.contacts',
    href: '/admin/contacts',
    icon: <Phone className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.chat',
    href: '/admin/chat',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.treatments',
    href: '/admin/treatments',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.materials',
    href: '/admin/materials',
    icon: <Package className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.orders',
    href: '/admin/orders',
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.analytics',
    href: '/admin/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.dataQuality',
    href: '/admin/data-quality',
    icon: <DatabaseZap className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.health',
    href: '/admin/health',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.settings',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
  },
  {
    nameKey: 'admin.sidebar.users',
    href: '/admin/users',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
]

function RoleBadge({ role }: { role: AdminRole }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE_CLASSES[role]}`}
    >
      {t(`admin.roles.${role}`)}
    </span>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAdminAuth()

  const navigation = user
    ? ALL_NAV_ITEMS.filter(item => canAccessNavItem(user.role, item.href))
    : []

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage || isLoading) return

    if (!isAuthenticated) {
      router.replace('/admin/login')
      return
    }

    // Route-level permission guard: redirect to dashboard if user lacks access
    if (user && pathname !== '/admin') {
      if (!canAccessNavItem(user.role, pathname)) {
        router.replace('/admin')
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, pathname, router, user])

  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dental-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('common.loading')}...</p>
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link href="/admin">
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav
          aria-label={t('admin.layout.sidebarNav')}
          className="px-4 py-6 space-y-1"
        >
          {navigation.map(item => (
            <Link
              key={item.nameKey}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-dental-teal text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.icon}
              {t(item.nameKey)}
              {isActive(item.href) && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-6 border-b">
            <Link href="/admin">
              <Logo size="sm" />
            </Link>
          </div>
          <nav
            aria-label={t('admin.layout.sidebarNav')}
            className="flex-1 px-4 py-6 space-y-1 overflow-y-auto"
          >
            {navigation.map(item => (
              <Link
                key={item.nameKey}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-dental-teal text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.icon}
                {t(item.nameKey)}
                {isActive(item.href) && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t space-y-2">
            {user && (
              <div className="px-4 py-2 space-y-1">
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
                <RoleBadge role={user.role} />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('admin.layout.logout')}
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('admin.layout.backToSite')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
            aria-label={t('admin.layout.openSidebar')}
            aria-controls="mobile-sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 lg:hidden">
              {t('admin.layout.panel')}
            </h1>

            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  aria-hidden="true"
                />
                {t('admin.layout.systemOnline')}
              </div>
              <div className="flex items-center gap-3">
                {user && (
                  <div className="hidden sm:block">
                    <RoleBadge role={user.role} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full bg-dental-teal flex items-center justify-center text-white font-semibold text-sm"
                    aria-hidden="true"
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.name || t('admin.layout.defaultUser')}
                  </span>
                </div>
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
