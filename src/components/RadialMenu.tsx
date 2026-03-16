'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Phone, Send, MessageCircle, Calendar, Bot, MessageSquare, X, Menu } from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'

interface RadialMenuProps {
  onOpenChat?: () => void
  onOpenAI?: () => void
}

export default function RadialMenu({ onOpenChat, onOpenAI }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLElement | null)[]>([])

  const tel = `tel:${CONTACT_INFO.phoneRaw}`
  const tg = CONTACT_INFO.social?.telegram || 'https://t.me/'
  const viberNum = (CONTACT_INFO.social?.viber || CONTACT_INFO.phoneRaw).replace(/\D/g, '')
  const viber = `viber://chat?number=%2B${viberNum}`

  const items = [
    { id: 'phone', icon: Phone, label: 'Зателефонувати', href: tel, color: '#10B981' },
    { id: 'book', icon: Calendar, label: 'Записатися', href: '/booking', color: '#2A7B72' },
    { id: 'ai', icon: Bot, label: 'AI Асистент', action: onOpenAI, color: '#8B5CF6' },
    { id: 'chat', icon: MessageSquare, label: 'Чат', action: onOpenChat, color: '#3B82F6' },
    { id: 'tg', icon: Send, label: 'Telegram', href: tg, external: true, color: '#0EA5E9' },
    { id: 'viber', icon: MessageCircle, label: 'Viber', href: viber, color: '#7C3AED' },
  ]

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [isOpen])

  // Keyboard
  useEffect(() => {
    if (!isOpen) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsOpen(false); setActiveIndex(-1) }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => { const n = (i + 1) % items.length; itemsRef.current[n]?.focus(); return n })
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => { const n = i <= 0 ? items.length - 1 : i - 1; itemsRef.current[n]?.focus(); return n })
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [isOpen, items.length])

  const toggle = useCallback(() => {
    setIsOpen(o => !o)
    setActiveIndex(-1)
  }, [])

  const handleClick = useCallback((item: typeof items[0]) => {
    if (item.action) item.action()
    setIsOpen(false)
  }, [])

  // Arc layout: 6 items in upper-left quadrant, radius 85px
  const getPos = (i: number) => {
    const angle = -150 + i * 20 // -150 to -50 degrees
    const rad = (angle * Math.PI) / 180
    return { x: Math.cos(rad) * 85, y: Math.sin(rad) * 85 }
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50" role="navigation" aria-label="Швидкі дії">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      {/* Label tooltip */}
      {isOpen && activeIndex >= 0 && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap z-20">
          {items[activeIndex].label}
        </div>
      )}

      {/* Menu items */}
      <div className="absolute bottom-0 right-0" role="menu" aria-hidden={!isOpen}>
        {items.map((item, i) => {
          const { x, y } = getPos(i)
          const Icon = item.icon
          const props = {
            role: 'menuitem' as const,
            tabIndex: isOpen ? 0 : -1,
            'aria-label': item.label,
            onFocus: () => setActiveIndex(i),
            onMouseEnter: () => setActiveIndex(i),
            onMouseLeave: () => setActiveIndex(-1),
            ref: (el: HTMLElement | null) => { itemsRef.current[i] = el },
            className: `absolute bottom-0 right-0 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`,
            style: {
              backgroundColor: item.color,
              transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0,0) scale(0)',
              transitionDelay: isOpen ? `${i * 30}ms` : '0ms',
            },
          }

          return item.href ? (
            <a
              key={item.id}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              onClick={() => !item.external && setIsOpen(false)}
              {...props}
            >
              <Icon className="w-5 h-5" />
            </a>
          ) : (
            <button key={item.id} type="button" onClick={() => handleClick(item)} {...props}>
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
      </div>

      {/* Main button */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? 'Закрити меню' : 'Відкрити меню дій'}
        className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500 z-10 ${
          isOpen ? 'bg-gray-800' : 'bg-dental-primary-500 hover:bg-dental-primary-600'
        }`}
      >
        {!isOpen && <span className="absolute inset-0 rounded-full bg-dental-primary-400 animate-ping opacity-20" />}
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className="sr-only" aria-live="polite">
        {isOpen ? 'Меню відкрито. Стрілки для навігації, Escape для закриття.' : ''}
      </div>
    </div>
  )
}
