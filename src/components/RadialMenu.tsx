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
  Menu,
} from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

interface RadialMenuItem {
  id: string
  icon: React.ReactNode
  label: string
  description?: string
  href?: string
  onClick?: () => void
  color: string
  external?: boolean
}

interface RadialMenuProps {
  onOpenChat?: () => void
  onOpenAI?: () => void
}

export default function RadialMenu({ onOpenChat, onOpenAI }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Menu items configuration
  const menuItems: RadialMenuItem[] = useMemo(() => {
    const tel = `tel:${CONTACT_INFO.phoneRaw}`
    const tg = CONTACT_INFO.social?.telegram || 'https://t.me/'
    const viberNum = CONTACT_INFO.social?.viber?.replace(/\D/g, '') || CONTACT_INFO.phoneRaw.replace(/\D/g, '')
    const viber = `viber://chat?number=%2B${viberNum.replace(/^\+/, '')}`
    const maps = SITE_INFO.googleMaps
    const instagram = CONTACT_INFO.social?.instagram || ''
    const facebook = CONTACT_INFO.social?.facebook || ''

    return [
      {
        id: 'phone',
        icon: <Phone className="w-5 h-5" />,
        label: 'Подзвонити',
        description: CONTACT_INFO.phone,
        href: tel,
        color: 'bg-green-500 hover:bg-green-600 text-white',
      },
      {
        id: 'booking',
        icon: <Calendar className="w-5 h-5" />,
        label: 'Записатися',
        description: 'Онлайн-запис',
        href: '/booking',
        color: 'bg-dental-primary-500 hover:bg-dental-primary-600 text-white',
      },
      {
        id: 'ai',
        icon: <Bot className="w-5 h-5" />,
        label: 'AI Асистент',
        description: 'Запитайте AI',
        onClick: onOpenAI,
        color: 'bg-purple-500 hover:bg-purple-600 text-white',
      },
      {
        id: 'chat',
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Чат',
        description: 'Напишіть нам',
        onClick: onOpenChat,
        color: 'bg-blue-500 hover:bg-blue-600 text-white',
      },
      {
        id: 'telegram',
        icon: <Send className="w-5 h-5" />,
        label: 'Telegram',
        description: 'Швидка відповідь',
        href: tg,
        external: true,
        color: 'bg-sky-500 hover:bg-sky-600 text-white',
      },
      {
        id: 'viber',
        icon: <MessageCircle className="w-5 h-5" />,
        label: 'Viber',
        description: 'Зручне листування',
        href: viber,
        color: 'bg-violet-500 hover:bg-violet-600 text-white',
      },
      {
        id: 'maps',
        icon: <Navigation className="w-5 h-5" />,
        label: 'Маршрут',
        description: 'Google Maps',
        href: maps,
        external: true,
        color: 'bg-red-500 hover:bg-red-600 text-white',
      },
      {
        id: 'instagram',
        icon: <Instagram className="w-5 h-5" />,
        label: 'Instagram',
        href: instagram,
        external: true,
        color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white',
      },
      {
        id: 'facebook',
        icon: <Facebook className="w-5 h-5" />,
        label: 'Facebook',
        href: facebook,
        external: true,
        color: 'bg-blue-600 hover:bg-blue-700 text-white',
      },
    ]
  }, [onOpenAI, onOpenChat])

  // Calculate position for each item in radial layout
  const getItemPosition = useCallback((index: number, total: number) => {
    // Fan opens upward and to the left from bottom-right position
    const startAngle = -180 // Start from left
    const endAngle = -90 // End at top
    const angleRange = endAngle - startAngle
    const angleStep = angleRange / (total - 1)
    const angle = startAngle + (index * angleStep)
    const radius = 100 // Distance from center
    
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
        case 'Tab':
          // Allow tab to cycle through items
          if (!e.shiftKey && focusedIndex === menuItems.length - 1) {
            e.preventDefault()
            setFocusedIndex(0)
            menuItemsRef.current[0]?.focus()
          } else if (e.shiftKey && focusedIndex === 0) {
            e.preventDefault()
            setFocusedIndex(menuItems.length - 1)
            menuItemsRef.current[menuItems.length - 1]?.focus()
          }
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, focusedIndex, menuItems.length])

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0)
      // Small delay to allow animation to start
      setTimeout(() => {
        menuItemsRef.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(prev => !prev)
    if (isOpen) {
      setFocusedIndex(-1)
    }
  }

  const handleItemClick = (item: RadialMenuItem) => {
    if (item.onClick) {
      item.onClick()
      setIsOpen(false)
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="fixed bottom-6 right-6 z-50"
      role="navigation"
      aria-label="Швидкі дії"
    >
      {/* Radial menu items */}
      <div 
        className={`absolute bottom-0 right-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        role="menu"
        aria-hidden={!isOpen}
      >
        {menuItems.map((item, index) => {
          const { x, y } = getItemPosition(index, menuItems.length)
          const delay = index * 30 // Stagger animation
          
          return (
            <div
              key={item.id}
              className="absolute bottom-0 right-0 transition-all duration-300 ease-out"
              style={{
                transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)',
                transitionDelay: isOpen ? `${delay}ms` : '0ms',
              }}
            >
              {/* Tooltip */}
              <div 
                className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap transition-opacity duration-200 ${
                  focusedIndex === index || isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              >
                <div className="bg-dental-dark text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-white/70">{item.description}</div>
                  )}
                  <span className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-dental-dark" />
                </div>
              </div>

              {/* Menu item button/link */}
              {item.href ? (
                <a
                  ref={el => { menuItemsRef.current[index] = el }}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  aria-label={`${item.label}${item.description ? ` - ${item.description}` : ''}`}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full shadow-lg
                    transition-all duration-200 transform
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500
                    ${item.color}
                    ${isOpen ? 'scale-100' : 'scale-0'}
                    hover:scale-110
                  `}
                  style={{
                    transitionDelay: isOpen ? `${delay}ms` : '0ms',
                  }}
                  onFocus={() => setFocusedIndex(index)}
                >
                  {item.icon}
                </a>
              ) : (
                <button
                  ref={el => { menuItemsRef.current[index] = el }}
                  type="button"
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  aria-label={`${item.label}${item.description ? ` - ${item.description}` : ''}`}
                  onClick={() => handleItemClick(item)}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full shadow-lg
                    transition-all duration-200 transform
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500
                    ${item.color}
                    ${isOpen ? 'scale-100' : 'scale-0'}
                    hover:scale-110
                  `}
                  style={{
                    transitionDelay: isOpen ? `${delay}ms` : '0ms',
                  }}
                  onFocus={() => setFocusedIndex(index)}
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
          shadow-lg transition-all duration-300 transform
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500
          ${isOpen 
            ? 'bg-dental-dark hover:bg-dental-dark/90 rotate-0' 
            : 'bg-gradient-to-br from-dental-primary-500 to-dental-primary-600 hover:from-dental-primary-600 hover:to-dental-primary-700'
          }
          hover:scale-105
        `}
      >
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-dental-primary-400 animate-ping opacity-20" />
        )}
        
        <span className={`text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
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
