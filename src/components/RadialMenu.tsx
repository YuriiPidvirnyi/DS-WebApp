'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Send, MessageCircle, Calendar, Bot, MessageSquare, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { CONTACT_INFO } from '@/utils/constants'

interface RadialMenuProps {
  onOpenChat?: () => void
  onOpenAI?: () => void
}

const RADIUS = 80
const START_ANGLE = -120
const END_ANGLE = -30

export default function RadialMenu({ onOpenChat, onOpenAI }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const tel = `tel:${CONTACT_INFO.phoneRaw}`
  const tg = CONTACT_INFO.social?.telegram || 'https://t.me/'
  const viberNum = (CONTACT_INFO.social?.viber || CONTACT_INFO.phoneRaw).replace(/\D/g, '')
  const viber = `viber://chat?number=%2B${viberNum}`

  const items = [
    { id: 'phone', icon: Phone, label: 'Зателефонувати', href: tel, bg: 'bg-emerald-500 hover:bg-emerald-600' },
    { id: 'book', icon: Calendar, label: 'Записатися', href: '/booking', bg: 'bg-teal-600 hover:bg-teal-700' },
    { id: 'ai', icon: Bot, label: 'AI Асистент', onClick: onOpenAI, bg: 'bg-violet-500 hover:bg-violet-600' },
    { id: 'chat', icon: MessageSquare, label: 'Онлайн чат', onClick: onOpenChat, bg: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'tg', icon: Send, label: 'Telegram', href: tg, external: true, bg: 'bg-sky-500 hover:bg-sky-600' },
    { id: 'viber', icon: MessageCircle, label: 'Viber', href: viber, bg: 'bg-purple-500 hover:bg-purple-600' },
  ]

  const angleStep = (END_ANGLE - START_ANGLE) / (items.length - 1)

  const getPosition = (index: number) => {
    const angle = START_ANGLE + index * angleStep
    const rad = (angle * Math.PI) / 180
    return {
      x: Math.cos(rad) * RADIUS,
      y: Math.sin(rad) * RADIUS,
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleItemClick = (item: typeof items[0]) => {
    if (item.onClick) {
      item.onClick()
    }
    setIsOpen(false)
  }

  const hoveredItem = items.find(i => i.id === hoveredId)

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Tooltip */}
      {isOpen && hoveredItem && (
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
          {hoveredItem.label}
        </div>
      )}

      {/* Menu items */}
      {items.map((item, index) => {
        const { x, y } = getPosition(index)
        const Icon = item.icon
        
        const buttonClass = `absolute w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg 
          transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2
          ${item.bg} ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`
        
        const style = {
          bottom: 4,
          right: 4,
          transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)',
          transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
        }

        const commonProps = {
          className: buttonClass,
          style,
          onMouseEnter: () => setHoveredId(item.id),
          onMouseLeave: () => setHoveredId(null),
          'aria-label': item.label,
        }

        if (item.href) {
          if (item.external || item.href.startsWith('tel:') || item.href.startsWith('viber:')) {
            return (
              <a
                key={item.id}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={() => setIsOpen(false)}
                {...commonProps}
              >
                <Icon className="w-5 h-5" />
              </a>
            )
          }
          return (
            <Link key={item.id} href={item.href} onClick={() => setIsOpen(false)} {...commonProps}>
              <Icon className="w-5 h-5" />
            </Link>
          )
        }

        return (
          <button key={item.id} type="button" onClick={() => handleItemClick(item)} {...commonProps}>
            <Icon className="w-5 h-5" />
          </button>
        )
      })}

      {/* Main toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Закрити меню' : 'Відкрити меню швидких дій'}
        className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white 
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
          ${isOpen ? 'bg-gray-700 rotate-45' : 'bg-teal-600 hover:bg-teal-700'}`}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-25" />
        )}
        {isOpen ? <X className="w-6 h-6 -rotate-45" /> : <Plus className="w-7 h-7" />}
      </button>
    </div>
  )
}
