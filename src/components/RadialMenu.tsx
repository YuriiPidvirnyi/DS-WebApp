'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Phone,
  Send,
  MessageCircle,
  Calendar,
  Bot,
  MessageSquare,
  X,
  Plus,
} from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'

interface MenuItem {
  id: string
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  bgColor: string
  external?: boolean
}

interface RadialMenuProps {
  onOpenChat?: () => void
  onOpenAI?: () => void
}

export default function RadialMenu({ onOpenChat, onOpenAI }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Menu items configuration - 6 items arranged in a fan
  const menuItems: MenuItem[] = useMemo(() => {
    const tel = `tel:${CONTACT_INFO.phoneRaw}`
    const tg = CONTACT_INFO.social?.telegram || 'https://t.me/'
    const viberNum = CONTACT_INFO.social?.viber?.replace(/\D/g, '') || CONTACT_INFO.phoneRaw.replace(/\D/g, '')
    const viber = `viber://chat?number=%2B${viberNum.replace(/^\+/, '')}`

    return [
      {
        id: 'phone',
        icon: <Phone className="w-5 h-5" />,
        label: 'Подзвонити',
        href: tel,
        bgColor: 'bg-emerald-500 hover:bg-emerald-600',
      },
      {
        id: 'booking',
        icon: <Calendar className="w-5 h-5" />,
        label: 'Записатися',
        href: '/booking',
        bgColor: 'bg-dental-primary-500 hover:bg-dental-primary-600',
      },
      {
        id: 'ai',
        icon: <Bot className="w-5 h-5" />,
        label: 'AI Асистент',
        onClick: onOpenAI,
        bgColor: 'bg-violet-500 hover:bg-violet-600',
      },
      {
        id: 'chat',
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Онлайн-чат',
        onClick: onOpenChat,
        bgColor: 'bg-blue-500 hover:bg-blue-600',
      },
      {
        id: 'telegram',
        icon: <Send className="w-5 h-5" />,
        label: 'Telegram',
        href: tg,
        external: true,
        bgColor: 'bg-sky-500 hover:bg-sky-600',
      },
      {
        id: 'viber',
        icon: <MessageCircle className="w-5 h-5" />,
        label: 'Viber',
        href: viber,
        bgColor: 'bg-purple-600 hover:bg-purple-700',
      },
    ]
  }, [onOpenAI, onOpenChat])

  // Calculate position for each item in a fan/arc pattern
  const getItemPosition = useCallback((index: number, total: number) => {
    // Fan spans from -135 degrees to -45 degrees (upper-left quadrant arc)
    const startAngle = -135
    const endAngle = -45
    const angleStep = (endAngle - startAngle) / (total - 1)
    const angle = startAngle + (index * angleStep)
    const angleRad = (angle * Math.PI) / 180
    const radius = 100 // Distance from center

    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
      angle,
    }
  }, [])

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
        setHoveredIndex(-1)
      }
    }

    // Small delay to prevent closing on same click that opened
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          triggerRef.current?.focus()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex(prev => {
            const newIndex = prev <= 0 ? menuItems.length - 1 : prev - 1
            menuItemsRef.current[newIndex]?.focus()
            return newIndex
          })
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex(prev => {
            const newIndex = prev >= menuItems.length - 1 ? 0 : prev + 1
            menuItemsRef.current[newIndex]?.focus()
            return newIndex
          })
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          menuItemsRef.current[0]?.focus()
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(menuItems.length - 1)
          menuItemsRef.current[menuItems.length - 1]?.focus()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, menuItems.length])

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setFocusedIndex(0)
        menuItemsRef.current[0]?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
    setFocusedIndex(-1)
    setHoveredIndex(-1)
  }, [])

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.onClick) {
      item.onClick()
    }
    setIsOpen(false)
    setFocusedIndex(-1)
    setHoveredIndex(-1)
  }, [])

  // Get active label to display
  const activeLabel = hoveredIndex >= 0 
    ? menuItems[hoveredIndex].label 
    : focusedIndex >= 0 
      ? menuItems[focusedIndex].label 
      : null

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50"
      role="navigation"
      aria-label="Швидкі дії"
    >
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Active item label - positioned above the trigger */}
      <div
        className={`absolute bottom-20 right-0 transition-all duration-200 ${
          activeLabel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="bg-slate-900 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
          {activeLabel}
        </div>
      </div>

      {/* Radial menu items */}
      <div
        role="menu"
        aria-label="Швидкі дії"
        aria-hidden={!isOpen}
        className="absolute bottom-0 right-0"
      >
        {menuItems.map((item, index) => {
          const { x, y } = getItemPosition(index, menuItems.length)
          const delay = index * 40 // Staggered animation delay

          const buttonClasses = `
            absolute bottom-0 right-0 w-12 h-12 rounded-full
            flex items-center justify-center text-white
            shadow-lg transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
            ${item.bgColor}
            ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          `

          const style = {
            transform: isOpen 
              ? `translate(${x}px, ${y}px) scale(1)` 
              : 'translate(0, 0) scale(0)',
            transitionDelay: isOpen ? `${delay}ms` : '0ms',
          }

          const commonProps = {
            role: 'menuitem' as const,
            tabIndex: isOpen ? 0 : -1,
            'aria-label': item.label,
            onMouseEnter: () => setHoveredIndex(index),
            onMouseLeave: () => setHoveredIndex(-1),
            onFocus: () => setFocusedIndex(index),
            onBlur: () => setFocusedIndex(-1),
          }

          return item.href ? (
            <a
              key={item.id}
              ref={el => { menuItemsRef.current[index] = el }}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={buttonClasses}
              style={style}
              onClick={() => !item.external && setIsOpen(false)}
              {...commonProps}
            >
              {item.icon}
            </a>
          ) : (
            <button
              key={item.id}
              ref={el => { menuItemsRef.current[index] = el }}
              type="button"
              onClick={() => handleItemClick(item)}
              className={buttonClasses}
              style={style}
              {...commonProps}
            >
              {item.icon}
            </button>
          )
        })}
      </div>

      {/* Main trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? 'Закрити меню швидких дій' : 'Відкрити меню швидких дій'}
        className={`
          relative flex items-center justify-center w-14 h-14 rounded-full
          shadow-xl transition-all duration-300 z-10
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500
          ${isOpen
            ? 'bg-slate-800 hover:bg-slate-700 rotate-0'
            : 'bg-gradient-to-br from-dental-primary-500 to-dental-primary-600 hover:from-dental-primary-600 hover:to-dental-primary-700'
          }
          hover:scale-105 active:scale-95
        `}
      >
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-dental-primary-400 animate-ping opacity-20" />
        )}

        <span
          className={`text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
        >
          {isOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Plus className="w-6 h-6" aria-hidden="true" />
          )}
        </span>
      </button>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        {isOpen
          ? 'Меню швидких дій відкрито. Використовуйте стрілки для навігації, Enter для вибору, Escape для закриття.'
          : ''
        }
      </div>
    </div>
  )
}
