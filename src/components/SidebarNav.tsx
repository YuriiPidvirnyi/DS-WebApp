'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import dynamic from 'next/dynamic'
import {
  Home,
  Stethoscope,
  Users,
  GalleryVertical,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Phone,
  MessageCircle,
  Accessibility,
} from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'
import Logo from '@/components/ui/Logo'

/* ── Dynamic panel imports ── */

const LiveChat = dynamic(() => import('./LiveChat'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })
const AccessibilityPanelDynamic = dynamic(
  () =>
    import('./AccessibilityPanel').then(m => ({
      default: m.AccessibilityPanel,
    })),
  { ssr: false }
)

/* ── Brand SVG icons (optimised for 20×20 rendering) ── */

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

/* Viber — chat bubble with handset + signal waves (same as RadialMenu) */
const ViberIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M12.006 0C5.391 0 .006 4.256.006 9.6c0 2.968 1.56 5.63 4.003 7.41v4.39a.6.6 0 00.957.483l3.247-2.442A14.3 14.3 0 0012.006 19.8c6.615 0 11.994-4.256 11.994-9.6V9.6C24 4.256 18.62 0 12.006 0zm.58 13.724c-.563.606-1.31.912-2.244.912h-.03a3.31 3.31 0 01-1.603-.414l-.12-.066a12.7 12.7 0 01-3.17-2.676 9.8 9.8 0 01-1.78-2.91c-.38-.93-.44-1.68-.174-2.228.174-.36.492-.624.87-.786a1.2 1.2 0 01.468-.102c.198 0 .372.054.522.156.264.18.516.546.756.888l.486.696c.228.33.168.726-.126 1.002l-.27.252c-.126.114-.126.312-.018.444.474.594 1.008 1.098 1.584 1.5.144.102.33.102.474.006l.294-.204c.306-.204.696-.174.966.078l.654.546c.372.312.588.648.648.996.06.36-.066.72-.336 1.014zm1.35-3.744a.48.48 0 01-.48-.408 2.27 2.27 0 00-.648-1.332 2.27 2.27 0 00-1.182-.618.48.48 0 01.174-.942 3.23 3.23 0 011.686.882 3.23 3.23 0 01.924 1.902.48.48 0 01-.402.546l-.072-.03zm1.494.048a.48.48 0 01-.474-.408 4.22 4.22 0 00-1.122-2.37 4.22 4.22 0 00-2.238-1.2.48.48 0 01.192-.942 5.18 5.18 0 012.748 1.476 5.18 5.18 0 011.374 2.91.48.48 0 01-.408.546l-.072-.012zm1.47.012a.48.48 0 01-.474-.414 6.17 6.17 0 00-1.626-3.408 6.17 6.17 0 00-3.282-1.74.48.48 0 01.174-.942 7.13 7.13 0 013.798 2.016 7.13 7.13 0 011.884 3.948.48.48 0 01-.402.552l-.072-.012z" />
  </svg>
)

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.2 8.2 0 004.79 1.52V6.9a4.85 4.85 0 01-1.02-.21z" />
  </svg>
)

/* ── Nav items ── */

const NAV_ITEMS = [
  { href: '/', icon: Home, labelKey: 'navigation.home' },
  { href: '/services', icon: Stethoscope, labelKey: 'navigation.services' },
  { href: '/about', icon: Users, labelKey: 'navigation.about' },
  { href: '/gallery', icon: GalleryVertical, labelKey: 'navigation.gallery' },
  { href: '/contact', icon: MapPin, labelKey: 'navigation.contact' },
] as const

/* ── Types ── */

type ChatMode = null | 'choose' | 'human' | 'ai'

/* ── Font style ── */
const rubikFont = {
  fontFamily: 'var(--font-rubik), Rubik, system-ui, sans-serif',
}

/* ── Component ── */

export default function SidebarNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>(null)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const expand = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    collapseTimer.current = setTimeout(() => setExpanded(false), 300)
  }, [])

  const phone = CONTACT_INFO.phoneRaw
  const whatsapp = CONTACT_INFO.social?.whatsapp
  const viber = `viber://chat?number=${encodeURIComponent(phone)}`
  const telegram = CONTACT_INFO.social?.telegram

  /* ── Label class — smooth max-width transition ── */
  const labelCls = expanded
    ? 'max-w-[180px] opacity-100 ml-3'
    : 'max-w-0 opacity-0 ml-0'

  /* ── Shared item styles ── */
  const itemCls = (active = false) =>
    [
      'flex items-center rounded-xl relative',
      'h-10 min-w-0 px-3',
      'transition-colors duration-150',
      active
        ? 'bg-dental-primary-50 text-dental-primary-600 shadow-sm'
        : 'text-dental-text hover:bg-gray-50 hover:text-dental-primary-600',
    ].join(' ')

  /* ── Messenger items ── */

  const messengerItems = [
    {
      id: 'phone',
      icon: <Phone className="w-5 h-5 shrink-0" />,
      label: t('radialMenu.actions.phone'),
      href: `tel:${phone}`,
    },
    {
      id: 'whatsapp',
      icon: <WhatsAppIcon />,
      label: 'WhatsApp',
      href: whatsapp,
      external: true,
    },
    {
      id: 'viber',
      icon: <ViberIcon />,
      label: 'Viber',
      href: viber,
      external: true,
    },
    {
      id: 'telegram',
      icon: <TelegramIcon />,
      label: 'Telegram',
      href: telegram,
      external: true,
    },
  ]

  /* ── Social items ── */

  const socialItems = [
    {
      href: CONTACT_INFO.social.facebook,
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5 shrink-0" />,
    },
    {
      href: CONTACT_INFO.social.instagram,
      label: 'Instagram',
      icon: <Instagram className="w-5 h-5 shrink-0" />,
    },
    {
      href: CONTACT_INFO.social.twitter,
      label: 'Twitter / X',
      icon: <Twitter className="w-5 h-5 shrink-0" />,
    },
    {
      href: CONTACT_INFO.social.tiktok,
      label: 'TikTok',
      icon: <TikTokIcon />,
    },
  ]

  return (
    <>
      {/* Spacer keeps 64px reserved in the flex flow */}
      <div className="hidden lg:block w-16 shrink-0" aria-hidden="true" />

      <aside
        className={[
          'hidden lg:flex flex-col absolute top-0 left-0 bottom-0 bg-white border-r border-gray-100 z-40',
          expanded ? 'shadow-xl' : '',
        ].join(' ')}
        style={{
          width: expanded ? 240 : 64,
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={expand}
        onMouseLeave={collapse}
        role="navigation"
        aria-label={t('accessibility.mainNavigation')}
      >
        {/* ─── Logo ─── */}
        <div className="flex items-center justify-center h-12 border-b border-gray-100 overflow-hidden">
          <Link
            href="/"
            aria-label={t('accessibility.homeLink')}
            className="flex items-center justify-center overflow-hidden"
          >
            <Image
              src="/favicon.svg"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 shrink-0"
              style={{
                opacity: expanded ? 0 : 1,
                width: expanded ? 0 : 28,
                transition: 'opacity 200ms, width 200ms',
              }}
            />
            <div
              style={{
                opacity: expanded ? 1 : 0,
                width: expanded ? 180 : 0,
                transition: 'opacity 200ms, width 250ms',
                overflow: 'hidden',
              }}
            >
              <Logo variant="default" size="sm" className="!h-9 shrink-0" />
            </div>
          </Link>
        </div>

        {/* ─── Page navigation ─── */}
        <nav className="flex flex-col gap-0.5 px-2 pt-3">
          {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={itemCls(active)}
                title={!expanded ? t(labelKey) : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-dental-primary-600" />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                  style={rubikFont}
                >
                  {t(labelKey)}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="mx-3 my-2 border-t border-gray-100" />

        {/* ─── Messengers + Chat + Accessibility ─── */}
        <div className="flex flex-col gap-0.5 px-2">
          {messengerItems.map(item =>
            item.href ? (
              <a
                key={item.id}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className={itemCls()}
                title={!expanded ? item.label : undefined}
              >
                {item.icon}
                <span
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                  style={rubikFont}
                >
                  {item.label}
                </span>
              </a>
            ) : null
          )}

          <button
            type="button"
            onClick={() => setChatMode('choose')}
            className={itemCls()}
            title={!expanded ? t('radialMenu.actions.chat') : undefined}
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span
              className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
              style={rubikFont}
            >
              {t('radialMenu.actions.chat')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAccessibilityOpen(true)}
            className={itemCls()}
            title={!expanded ? t('accessibilityPanel.title') : undefined}
          >
            <Accessibility className="w-5 h-5 shrink-0" />
            <span
              className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
              style={rubikFont}
            >
              {t('accessibilityPanel.title')}
            </span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        <div className="mx-3 my-2 border-t border-gray-100" />

        {/* ─── Social links (vertical) ─── */}
        <div className="flex flex-col gap-0.5 px-2">
          {socialItems.map(({ href, label, icon }) =>
            href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={[
                  'flex items-center rounded-xl',
                  'h-9 min-w-0 px-3',
                  'text-gray-400 hover:text-dental-primary-600 hover:bg-gray-50',
                  'transition-colors duration-150',
                ].join(' ')}
                title={!expanded ? label : undefined}
              >
                {icon}
                <span
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                  style={rubikFont}
                >
                  {label}
                </span>
              </a>
            ) : null
          )}
        </div>

        {/* ─── Copyright ─── */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 mt-2 overflow-hidden">
          <p
            className="text-[10px] text-gray-400 text-center whitespace-nowrap overflow-hidden transition-all duration-200"
            style={{
              opacity: expanded ? 1 : 0,
              maxHeight: expanded ? 24 : 0,
            }}
          >
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </aside>

      {/* ─── Chat mode chooser ─── */}
      {chatMode === 'choose' && (
        <div className="fixed z-50 top-1/2 left-20 -translate-y-1/2">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-72">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-dental-dark font-semibold text-base">
                {t('radialMenu.actions.chat')}
              </h3>
              <button
                onClick={() => setChatMode(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t('radialMenu.aria.close')}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-dental-text mb-4">
              Оберіть спосіб зв&apos;язку:
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setChatMode('human')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dental-primary-600 text-white hover:bg-dental-primary-700 active:scale-[0.98] transition-all text-sm font-medium"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                Написати адміністратору
              </button>
              <button
                onClick={() => setChatMode('ai')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dental-dark text-white hover:bg-dental-dark/90 active:scale-[0.98] transition-all text-sm font-medium"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                  />
                </svg>
                AI-асистент
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LiveChat panel ─── */}
      {chatMode === 'human' && (
        <div className="fixed z-50 bottom-6 left-20">
          <LiveChat onClose={() => setChatMode(null)} />
        </div>
      )}

      {/* ─── AI Assistant panel ─── */}
      {chatMode === 'ai' && (
        <div className="fixed z-50 bottom-6 left-20">
          <AIAssistant onClose={() => setChatMode(null)} />
        </div>
      )}

      {/* ─── Accessibility panel ─── */}
      {accessibilityOpen && (
        <div className="fixed z-50 bottom-6 left-20">
          <div className="relative">
            <AccessibilityPanelDynamic defaultOpen hideToggle />
            <button
              onClick={() => setAccessibilityOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label={t('radialMenu.aria.close')}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
