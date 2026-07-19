'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  Phone,
  MessageCircle,
  Accessibility,
  Pin,
} from 'lucide-react'

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
import { CONTACT_INFO } from '@/utils/constants'

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

/* Viber — official Simple Icons SVG */
const ViberIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z" />
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

type ActivePanel =
  | null
  | 'chat-choose'
  | 'chat-human'
  | 'chat-ai'
  | 'accessibility'

/* ── Font style — system sans-serif for crisp, non-rounded look ── */
const sidebarFont = {
  fontFamily: 'var(--font-nunito), "Nunito", sans-serif',
}

/* ── Component ── */

export default function SidebarNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [hovering, setHovering] = useState(false)
  // Pin (2b): hover expands the rail temporarily; the pin locks it open. The
  // choice persists in localStorage so it survives navigation/reload (finding 21).
  const [pinned, setPinned] = useState(false)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>(null)

  // Effective open state: the pointer is over the rail OR it is pinned. Deriving
  // it (instead of a second state) means a pending collapse timer can never
  // shut a pinned rail.
  const expanded = hovering || pinned

  // Restore the persisted pin state once on mount. SSR renders collapsed; the
  // pinned user re-expands here (a window-guarded initializer would risk a
  // hydration mismatch — a one-frame expand is the safe tradeoff).
  useEffect(() => {
    try {
      if (localStorage.getItem('ds_sidebar_pinned') === '1') setPinned(true)
    } catch {
      // localStorage may be unavailable (private mode) — pin just won't persist.
    }
  }, [])

  const closePanel = useCallback(() => setActivePanel(null), [])

  const expand = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setHovering(true)
  }, [])

  const collapse = useCallback(() => {
    collapseTimer.current = setTimeout(() => setHovering(false), 300)
  }, [])

  const togglePin = useCallback(() => {
    setPinned(prev => {
      const next = !prev
      try {
        localStorage.setItem('ds_sidebar_pinned', next ? '1' : '0')
      } catch {
        // ignore persistence failure
      }
      return next
    })
  }, [])

  const phone = CONTACT_INFO.phoneRaw
  const whatsapp = CONTACT_INFO.social?.whatsapp
  const viber = `viber://chat?number=${encodeURIComponent(phone)}`
  const telegram = CONTACT_INFO.social?.telegram

  /* ── Label class — smooth max-width transition ── */
  const labelCls = expanded
    ? 'max-w-[180px] opacity-100 ml-3'
    : 'max-w-0 opacity-0 ml-0'

  /* ── Section label (visible only expanded) ── */
  const sectionLabel = (text: string) => (
    <span
      className="text-[10px] uppercase tracking-wider text-dental-muted font-semibold whitespace-nowrap overflow-hidden transition-all duration-200"
      style={{
        ...sidebarFont,
        opacity: expanded ? 1 : 0,
        maxHeight: expanded ? 16 : 0,
        marginBottom: expanded ? 4 : 0,
        paddingLeft: expanded ? 12 : 0,
      }}
    >
      {text}
    </span>
  )

  /* ── Shared item styles ── */
  const itemCls = (active = false) =>
    [
      'group flex items-center rounded-xl relative',
      // 44px touch target (2b: «кожна крапка — ціль 44px»)
      'h-11 min-w-0',
      expanded ? 'px-3' : 'justify-center',
      'transition-all duration-150',
      active
        ? // Active is double-encoded (2b): brand halo + tint + the left bar,
          // not colour alone.
          'bg-dental-primary-50 text-dental-primary-ink shadow-xs ring-1 ring-dental-primary-200'
        : 'text-dental-dark hover:bg-dental-secondary-50 hover:text-dental-primary-ink hover:translate-x-0.5',
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
      icon: <FacebookIcon className="w-5 h-5 shrink-0" />,
    },
    {
      href: CONTACT_INFO.social.instagram,
      label: 'Instagram',
      icon: <InstagramIcon className="w-5 h-5 shrink-0" />,
    },
    {
      href: CONTACT_INFO.social.twitter,
      label: 'Twitter / X',
      icon: <XIcon className="w-5 h-5 shrink-0" />,
    },
    {
      href: CONTACT_INFO.social.tiktok,
      label: 'TikTok',
      icon: <TikTokIcon />,
    },
  ]

  // Hide site sidebar on cabinet and admin routes (they have their own)
  if (pathname?.startsWith('/cabinet') || pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <>
      {/* Spacer keeps 64px reserved in the flex flow. Rail hides <1280px (2b):
          on tablet the top contact bar + header nav do its job (in concert with М5). */}
      <div className="hidden xl:block w-16 shrink-0" aria-hidden="true" />

      <aside
        className="hidden xl:flex flex-col absolute top-0 left-0 bottom-0 bg-white border-r border-dental-secondary-100 z-40 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200"
        style={{
          width: expanded ? 240 : 64,
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: expanded
            ? '4px 0 24px rgba(0,0,0,0.08), 1px 0 4px rgba(0,0,0,0.04)'
            : 'none',
        }}
        onMouseEnter={expand}
        onMouseLeave={collapse}
        role="navigation"
        aria-label={t('accessibility.mainNavigation')}
      >
        {/* ─── Logo ─── */}
        <Link
          href="/"
          aria-label={t('accessibility.homeLink')}
          className="relative flex items-center justify-center h-16 border-b border-dental-secondary-100 shrink-0"
        >
          {/* Tooth icon — visible when collapsed */}
          <Image
            src="/favicon.svg"
            alt=""
            width={28}
            height={28}
            className="w-8 h-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              opacity: expanded ? 0 : 1,
              transition: 'opacity 200ms',
            }}
          />
          {/* Full logo — visible when expanded */}
          <Image
            src="/assets/images/logo/logo-mark-teal.svg"
            alt="Dental Story"
            width={140}
            height={36}
            className="h-9 w-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              opacity: expanded ? 1 : 0,
              transition: 'opacity 250ms',
            }}
          />
        </Link>

        {/* ─── Pin toggle (2b) — locks the expanded rail; only tabbable/visible
              once expanded, persisted to localStorage ─── */}
        <button
          type="button"
          onClick={togglePin}
          aria-pressed={pinned}
          aria-label={
            pinned
              ? t('accessibility.unpinNav', 'Відкріпити панель навігації')
              : t('accessibility.pinNav', 'Закріпити панель навігації')
          }
          title={
            pinned
              ? t('accessibility.unpinNav', 'Відкріпити панель навігації')
              : t('accessibility.pinNav', 'Закріпити панель навігації')
          }
          tabIndex={expanded ? 0 : -1}
          className={`absolute right-2 top-2.5 z-10 flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200 ${
            expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${
            pinned
              ? 'bg-dental-primary-100 text-dental-primary-ink'
              : 'text-dental-muted hover:bg-dental-secondary-50 hover:text-dental-primary-ink'
          }`}
        >
          <Pin
            className={`h-4.5 w-4.5 transition-transform ${pinned ? 'rotate-45' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* ─── Scrollable content area — vertically centered ─── */}
        <div className="flex-1 flex flex-col justify-evenly py-2 min-h-0">
          {/* ─── Page navigation ─── */}
          <nav className="flex flex-col gap-0.5 px-2">
            {sectionLabel(t('navigation.menu', 'Меню'))}
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
                  <Icon className="w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                  <span
                    className={`text-[15px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                    style={sidebarFont}
                  >
                    {t(labelKey)}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* ─── Зв'язок — subtle background tint to distinguish ─── */}
          <div className="mx-1 mt-1.5 mb-1 rounded-xl bg-dental-secondary-50/70 px-1 py-1">
            <div className="flex flex-col gap-0.5">
              {sectionLabel(t('navigation.contact_us', "Зв'язок"))}
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
                      className={`text-[15px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                      style={sidebarFont}
                    >
                      {item.label}
                    </span>
                  </a>
                ) : null
              )}

              <button
                type="button"
                onClick={() => setActivePanel('chat-choose')}
                className={itemCls()}
                title={!expanded ? t('radialMenu.actions.chat') : undefined}
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span
                  className={`text-[15px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                  style={sidebarFont}
                >
                  {t('radialMenu.actions.chat')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivePanel('accessibility')}
                className={itemCls()}
                title={
                  !expanded
                    ? t('accessibility.title', 'Доступність')
                    : undefined
                }
              >
                <Accessibility className="w-5 h-5 shrink-0" />
                <span
                  className={`text-[15px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                  style={sidebarFont}
                >
                  {t('accessibility.title', 'Доступність')}
                </span>
              </button>
            </div>
          </div>

          <div className="mx-3 my-0.5 border-t border-dental-secondary-100" />

          {/* ─── Social links (vertical) ─── */}
          <div className="flex flex-col gap-0.5 px-2">
            {sectionLabel(t('navigation.socials', 'Соцмережі'))}
            {socialItems.map(({ href, label, icon }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'group flex items-center rounded-xl relative',
                    'h-11 min-w-0',
                    expanded ? 'px-3' : 'justify-center',
                    'text-dental-muted hover:text-dental-primary-ink hover:bg-dental-secondary-50 hover:translate-x-0.5',
                    'transition-all duration-150',
                  ].join(' ')}
                  title={!expanded ? label : undefined}
                >
                  {icon}
                  <span
                    className={`text-[15px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${labelCls}`}
                    style={sidebarFont}
                  >
                    {label}
                  </span>
                </a>
              ) : null
            )}
          </div>
        </div>

        {/* ─── Copyright ─── */}
        <div className="px-3 pb-3 pt-2 overflow-hidden shrink-0">
          <p
            className="text-[10px] text-dental-muted text-center whitespace-nowrap overflow-hidden transition-all duration-200"
            style={{
              ...sidebarFont,
              opacity: expanded ? 1 : 0,
              maxHeight: expanded ? 24 : 0,
              transition: 'opacity 200ms, max-height 200ms',
            }}
          >
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </aside>

      {/* ─── Panel overlay (backdrop + single active panel) ─── */}
      {activePanel && (
        <>
          {/* Backdrop. An open conversation (chat-human / chat-ai) must NOT be
              dismissed by an accidental outside click (Ч3) — it closes only via
              its X button or Escape. The chooser and accessibility panels have
              no conversation to lose, so they still close on backdrop click. */}
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] transition-opacity"
            onClick={
              activePanel === 'chat-human' || activePanel === 'chat-ai'
                ? undefined
                : closePanel
            }
            aria-hidden="true"
          />

          {/* Panel container — unified position */}
          <div className="fixed z-50 top-1/2 left-20 -translate-y-1/2">
            {/* ─── Chat chooser ─── */}
            {activePanel === 'chat-choose' && (
              <div className="bg-white rounded-2xl shadow-2xl border border-dental-secondary-200 w-72 overflow-hidden">
                {/* Header — unified with accessibility panel */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-dental-secondary-200 bg-dental-primary-100 rounded-t-2xl">
                  <h3
                    className="text-base font-semibold text-dental-dark"
                    style={sidebarFont}
                  >
                    {t('radialMenu.actions.chat')}
                  </h3>
                  <button
                    onClick={closePanel}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-100 transition-colors"
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
                <div className="p-5">
                  <p
                    className="text-sm text-dental-text mb-4"
                    style={sidebarFont}
                  >
                    {t('chat.chooseChannel')}
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setActivePanel('chat-human')}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dental-primary-600 text-white hover:bg-dental-primary-700 active:scale-[0.98] transition-all text-sm font-semibold"
                      style={sidebarFont}
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
                      {t('chat.adminChannel')}
                    </button>
                    <button
                      onClick={() => setActivePanel('chat-ai')}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dental-dark text-white hover:bg-dental-dark/90 active:scale-[0.98] transition-all text-sm font-semibold"
                      style={sidebarFont}
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
                      {t('chat.aiChannel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── LiveChat ─── */}
            {activePanel === 'chat-human' && <LiveChat onClose={closePanel} />}

            {/* ─── AI Assistant ─── */}
            {activePanel === 'chat-ai' && <AIAssistant onClose={closePanel} />}

            {/* ─── Accessibility ─── */}
            {activePanel === 'accessibility' && (
              <AccessibilityPanelDynamic
                defaultOpen
                hideToggle
                onClose={closePanel}
              />
            )}
          </div>
        </>
      )}
    </>
  )
}
