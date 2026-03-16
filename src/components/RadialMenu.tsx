'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Phone,
  Navigation,
  Send,
  MessageCircle,
  Calendar,
  Instagram,
  Facebook,
  Bot,
  MessageSquare,
  X,
  Plus,
} from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

interface RadialMenuItem {
  id: string
  icon: React.ReactNode
  label: string
  description?: string
  href?: string
  onClick?: () => void
  bgColor: string
  hoverColor: string
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

  // Menu items configuration - reduced to 6 main actions for cleaner UI
  const menuItems: RadialMenuItem[] = useMemo(() => {
    const tel = `tel:${CONTACT_INFO.phoneRaw}`
    const tg = CONTACT_INFO.social?.telegram || 'https://t.me/'
    const viberNum = CONTACT_INFO.social?.viber?.replace(/\D/g, '') || CONTACT_INFO.phoneRaw.replace(/\D/g, '')
    const viber = `viber://chat?number=%2B${viberNum.replace(/^\+/, '')}`

    return [
      {
        id: 'phone',
        icon: <Phone className="w-5 h-5" />,
        label: 'Подзвонити',
        description: CONTACT_INFO.phone,
        href: tel,
        bgColor: 'bg-emerald-500',
        hoverColor: 'hover:bg-emerald-600',
      },
      {
        id: 'booking',
        icon: <Calendar className="w-5 h-5" />,
        label: 'Записатися',
        description: 'Онлайн-запис на прийом',
        href: '/booking',
        bgColor: 'bg-dental-primary-500',
        hoverColor: 'hover:bg-dental-primary-600',
      },
      {
        id: 'ai',
        icon: <Bot className="w-5 h-5" />,
        label: 'AI Асистент',
        description: 'Отримайте відповіді миттєво',
        onClick: onOpenAI,
        bgColor: 'bg-violet-500',
        hoverColor: 'hover:bg-violet-600',
      },
      {
        id: 'chat',
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Онлайн чат',
        description: 'Напишіть нам повідомлення',
        onClick: onOpenChat,
        bgColor: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600',
      },
      {
        id: 'telegram',
        icon: <Send className="w-5 h-5" />,
        label: 'Telegram',
        description: 'Швидка відповідь',
        href: tg,
        external: true,
        bgColor: 'bg-sky-500',
        hoverColor: 'hover:bg-sky-600',
      },
      {
        id: 'viber',
        icon: <MessageCircle className="w-5 h-5" />,
        label: 'Viber',
        description: 'Зручне листування',
        href: viber,
        bgColor: 'bg-purple-500',
        hoverColor: 'hover:bg-purple-600',
      },
    ]
  }, [onOpenAI, onOpenChat])

  // Calculate position for each item in arc layout
  const getItemPosition = useCallback((index: number, total: number) => {
    // Arc from bottom-left (-135deg) to top (-90deg) to right side (-45deg)
    const startAngle = -150
    const endAngle = -30
    const angleStep = (endAngle - startAngle) / (total - 1)
    const angle = startAngle + (index * angleStep)
    const radius = 90 // Distance from center
    
    const radians = (angle * Math.PI) / 180
    const x = Math.cos(radians) * radius
    const y = Math.sin(radians) * radius
    
    return { x, y, angle }
  }, [])

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
        setHoveredIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          setFocusedIndex(-1)
          setHoveredIndex(-1)
          triggerRef.current?.focus()
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          setFocusedIndex(prev => {
            const newIndex = prev <= 0 ? menuItems.length - 1 : prev - 1
            menuItemsRef.current[newIndex]?.focus()
            return newIndex
          })
          break
        case 'ArrowDown':
        case 'ArrowRight':
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

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, menuItems.length])

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0)
      setTimeout(() => {
        menuItemsRef.current[0]?.focus()
      }, 150)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(prev => !prev)
    if (isOpen) {
      setFocusedIndex(-1)
      setHoveredIndex(-1)
    }
  }

  const handleItemClick = (item: RadialMenuItem) => {
    if (item.onClick) {
      item.onClick()
      setIsOpen(false)
    }
  }

  // Get active item for tooltip display
  const activeItem = hoveredIndex >= 0 ? menuItems[hoveredIndex] : (focusedIndex >= 0 ? menuItems[focusedIndex] : null)

  return (
    <div 
      ref={containerRef} 
      className="fixed bottom-6 right-6 z-50"
      role="navigation"
      aria-label="Швидкі дії"
    >
      {/* Background overlay when open */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 -z-10 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Central tooltip card - shows active item info */}
      <div 
        className={`absolute bottom-20 right-0 w-48 transition-all duration-200 ${
          isOpen && activeItem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        aria-hidden="true"
      >
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-3">
          <div className="font-semibold text-slate-900 text-sm">{activeItem?.label}</div>
          {activeItem?.description && (
            <div className="text-xs text-slate-500 mt-0.5">{activeItem.description}</div>
          )}
        </div>
      </div>

      {/* Radial menu items */}
      <div 
        className={`absolute bottom-0 right-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        role="menu"
        aria-hidden={!isOpen}
      >
        {menuItems.map((item, index) => {
          const { x, y } = getItemPosition(index, menuItems.length)
          const delay = index * 40
          const isActive = hoveredIndex === index || focusedIndex === index
          
          const buttonClasses = `
            flex items-center justify-center w-12 h-12 rounded-full shadow-lg
            text-white transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900
            ${item.bgColor} ${item.hoverColor}
            ${isOpen ? 'scale-100' : 'scale-0'}
            ${isActive ? 'scale-110 ring-2 ring-white ring-offset-2' : ''}
          `
          
          const commonProps = {
            role: 'menuitem' as const,
            tabIndex: isOpen ? 0 : -1,
            'aria-label': `${item.label}${item.description ? ` - ${item.description}` : ''}`,
            onFocus: () => setFocusedIndex(index),
            onBlur: () => setFocusedIndex(-1),
            onMouseEnter: () => setHoveredIndex(index),
            onMouseLeave: () => setHoveredIndex(-1),
            style: {
              transitionDelay: isOpen ? `${delay}ms` : '0ms',
            },
          }

          return (
            <div
              key={item.id}
              className="absolute bottom-0 right-0 transition-all duration-300 ease-out"
              style={{
                transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)',
                transitionDelay: isOpen ? `${delay}ms` : '0ms',
              }}
            >
              {item.href ? (
                <a
                  ref={el => { menuItemsRef.current[index] = el }}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className={buttonClasses}
                  {...commonProps}
                >
                  {item.icon}
                </a>
              ) : (
                <button
                  ref={el => { menuItemsRef.current[index] = el }}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={buttonClasses}
                  {...commonProps}
                >
                  {item.icon}
                </button>
              )}
            </div>
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
          shadow-xl transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500
          ${isOpen 
            ? 'bg-slate-800 hover:bg-slate-700' 
            : 'bg-gradient-to-br from-dental-primary-500 to-dental-primary-600 hover:from-dental-primary-600 hover:to-dental-primary-700'
          }
          hover:scale-105 active:scale-95
        `}
      >
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-dental-primary-400 animate-ping opacity-20" />
        )}
        
        <span className={`text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
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
