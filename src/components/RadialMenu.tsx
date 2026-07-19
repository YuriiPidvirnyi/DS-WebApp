'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Phone,
  MessageCircle,
  Accessibility,
  X,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CONTACT_INFO } from '@/utils/constants'

/* ── Brand-accurate messenger SVG icons ── */

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const ViberIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.006 0C5.391 0 .006 4.256.006 9.6c0 2.968 1.56 5.63 4.003 7.41v4.39a.6.6 0 00.957.483l3.247-2.442A14.3 14.3 0 0012.006 19.8c6.615 0 11.994-4.256 11.994-9.6V9.6C24 4.256 18.62 0 12.006 0zm.58 13.724c-.563.606-1.31.912-2.244.912h-.03a3.31 3.31 0 01-1.603-.414l-.12-.066a12.7 12.7 0 01-3.17-2.676 9.8 9.8 0 01-1.78-2.91c-.38-.93-.44-1.68-.174-2.228.174-.36.492-.624.87-.786a1.2 1.2 0 01.468-.102c.198 0 .372.054.522.156.264.18.516.546.756.888l.486.696c.228.33.168.726-.126 1.002l-.27.252c-.126.114-.126.312-.018.444.474.594 1.008 1.098 1.584 1.5.144.102.33.102.474.006l.294-.204c.306-.204.696-.174.966.078l.654.546c.372.312.588.648.648.996.06.36-.066.72-.336 1.014zm1.35-3.744a.48.48 0 01-.48-.408 2.27 2.27 0 00-.648-1.332 2.27 2.27 0 00-1.182-.618.48.48 0 01.174-.942 3.23 3.23 0 011.686.882 3.23 3.23 0 01.924 1.902.48.48 0 01-.402.546l-.072-.03zm1.494.048a.48.48 0 01-.474-.408 4.22 4.22 0 00-1.122-2.37 4.22 4.22 0 00-2.238-1.2.48.48 0 01.192-.942 5.18 5.18 0 012.748 1.476 5.18 5.18 0 011.374 2.91.48.48 0 01-.408.546l-.072-.012zm1.47.012a.48.48 0 01-.474-.414 6.17 6.17 0 00-1.626-3.408 6.17 6.17 0 00-3.282-1.74.48.48 0 01.174-.942 7.13 7.13 0 013.798 2.016 7.13 7.13 0 011.884 3.948.48.48 0 01-.402.552l-.072-.012z" />
  </svg>
)

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
)

/* ── Menu item type ── */

interface MenuItem {
  id: string
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  external?: boolean
  color: string
  // М5: contact channels are shown only <640px. On tablet the top contact bar
  // is the single channel, so the FAB keeps just chat + accessibility.
  mobileOnly?: boolean
}

/* ── Component ── */

export interface RadialMenuProps {
  onOpenChat?: () => void
  onOpenAccessibility?: () => void
}

export default function RadialMenu({
  onOpenChat,
  onOpenAccessibility,
}: RadialMenuProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const phone = CONTACT_INFO.phoneRaw
  const whatsapp = CONTACT_INFO.social?.whatsapp
  const viber = `viber://chat?number=${encodeURIComponent(phone)}`
  const telegram = CONTACT_INFO.social?.telegram

  const items: MenuItem[] = useMemo(
    () => [
      {
        id: 'phone',
        icon: <Phone className="w-5 h-5" />,
        label: t('radialMenu.actions.phone'),
        href: `tel:${phone}`,
        color: 'bg-dental-primary-600 text-white',
        mobileOnly: true,
      },
      {
        id: 'whatsapp',
        icon: <WhatsAppIcon />,
        label: 'WhatsApp',
        href: whatsapp,
        external: true,
        color: 'bg-[#25D366] text-white',
        mobileOnly: true,
      },
      {
        id: 'viber',
        icon: <ViberIcon />,
        label: 'Viber',
        href: viber,
        external: true,
        color: 'bg-[#7360F2] text-white',
        mobileOnly: true,
      },
      {
        id: 'telegram',
        icon: <TelegramIcon />,
        label: 'Telegram',
        href: telegram,
        external: true,
        color: 'bg-[#26A5E4] text-white',
        mobileOnly: true,
      },
      {
        id: 'chat',
        icon: <MessageCircle className="w-5 h-5" />,
        label: t('radialMenu.actions.chat'),
        onClick: () => {
          onOpenChat?.()
          setIsOpen(false)
        },
        color: 'bg-dental-dark text-white',
      },
      {
        id: 'accessibility',
        icon: <Accessibility className="w-5 h-5" />,
        label: t('accessibilityPanel.title'),
        onClick: () => {
          onOpenAccessibility?.()
          setIsOpen(false)
        },
        color: 'bg-dental-text text-white',
      },
    ],
    [t, phone, whatsapp, viber, telegram, onOpenChat, onOpenAccessibility]
  )

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-[calc(1.25rem+env(safe-area-inset-right,0px))]"
    >
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Expanded menu items. The container must NEVER be hit-testable: it is
          always mounted, ~200×260px, sits fixed outside the <main> scroller —
          without pointer-events-none it swallows touch scrolling in the
          thumb zone on mobile (touches land here, scroll chain goes to body,
          which has nothing to scroll). Items re-enable pointer events when
          the menu is open. */}
      <div className="pointer-events-none absolute bottom-16 right-0 flex flex-col gap-2 items-end">
        {items.map((item, idx) => {
          const style = {
            transitionDelay: isOpen
              ? `${idx * 40}ms`
              : `${(items.length - 1 - idx) * 25}ms`,
          }

          const cls = [
            'flex items-center gap-3 pl-3.5 pr-4 h-11 rounded-full shadow-lg',
            'transition-all duration-200 ease-out',
            'hover:shadow-xl active:scale-[0.96]',
            // М5: contact channels collapse away at ≥640px (tablet+), leaving
            // only chat + accessibility in the floating menu.
            item.mobileOnly ? 'sm:hidden' : '',
            item.color,
            isOpen
              ? 'pointer-events-auto opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none',
          ].join(' ')

          const content = (
            <>
              <span className="shrink-0">{item.icon}</span>
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            </>
          )

          if (item.onClick) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={cls}
                style={style}
                aria-label={item.label}
              >
                {content}
              </button>
            )
          }

          const isExternal =
            item.external ||
            item.href?.startsWith('tel:') ||
            item.href?.startsWith('viber:')

          if (isExternal) {
            return (
              <a
                key={item.id}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={() => setIsOpen(false)}
                className={cls}
                style={style}
                aria-label={item.label}
              >
                {content}
              </a>
            )
          }

          return (
            <Link
              key={item.id}
              href={item.href!}
              onClick={() => setIsOpen(false)}
              className={cls}
              style={style}
              aria-label={item.label}
            >
              {content}
            </Link>
          )
        })}
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={
          isOpen ? t('radialMenu.aria.close') : t('radialMenu.aria.open')
        }
        className={[
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
          'transition-all duration-200',
          'focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-400',
          isOpen
            ? 'bg-dental-dark text-white rotate-0'
            : 'bg-dental-primary-600 text-white hover:bg-dental-primary-700',
        ].join(' ')}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}
