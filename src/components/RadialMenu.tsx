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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'

interface MenuItem {
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
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [scrollIndex, setScrollIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)

  const VISIBLE_ITEMS = 4 // Number of visible items at once

  // Menu items configuration
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
        description: CONTACT_INFO.phone,
        href: tel,
        bgColor: 'bg-emerald-500',
        hoverColor: 'hover:bg-emerald-600',
      },
      {
        id: 'booking',
        icon: <Calendar className="w-5 h-5" />,
        label: 'Записатися',
        description: 'Онлайн-запис',
        href: '/booking',
        bgColor: 'bg-dental-primary-500',
        hoverColor: 'hover:bg-dental-primary-600',
      },
      {
        id: 'ai',
        icon: <Bot className="w-5 h-5" />,
        label: 'AI Асистент',
        description: 'Запитайте AI',
        onClick: onOpenAI,
        bgColor: 'bg-violet-500',
        hoverColor: 'hover:bg-violet-600',
      },
      {
        id: 'chat',
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Чат',
        description: 'Напишіть нам',
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

  const maxScrollIndex = Math.max(0, menuItems.length - VISIBLE_ITEMS)

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(0)
        setScrollIndex(0)
      }
    }
    
    // Use setTimeout to prevent immediate close on the same click that opens
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setFocusedIndex(0)
          setScrollIndex(0)
          triggerRef.current?.focus()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (focusedIndex > 0) {
            setFocusedIndex(prev => prev - 1)
            if (focusedIndex - 1 < scrollIndex) {
              setScrollIndex(prev => Math.max(0, prev - 1))
            }
            menuItemsRef.current[focusedIndex - 1]?.focus()
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (focusedIndex < menuItems.length - 1) {
            setFocusedIndex(prev => prev + 1)
            if (focusedIndex + 1 >= scrollIndex + VISIBLE_ITEMS) {
              setScrollIndex(prev => Math.min(maxScrollIndex, prev + 1))
            }
            menuItemsRef.current[focusedIndex + 1]?.focus()
          }
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          setScrollIndex(0)
          menuItemsRef.current[0]?.focus()
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(menuItems.length - 1)
          setScrollIndex(maxScrollIndex)
          menuItemsRef.current[menuItems.length - 1]?.focus()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, scrollIndex, menuItems.length, maxScrollIndex])

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        menuItemsRef.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(prev => !prev)
    if (isOpen) {
      setFocusedIndex(0)
      setScrollIndex(0)
    }
  }

  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick()
      setIsOpen(false)
    }
  }

  const scrollLeft = () => {
    setScrollIndex(prev => Math.max(0, prev - 1))
  }

  const scrollRight = () => {
    setScrollIndex(prev => Math.min(maxScrollIndex, prev + 1))
  }

  const canScrollLeft = scrollIndex > 0
  const canScrollRight = scrollIndex < maxScrollIndex

  return (
    <div 
      ref={containerRef} 
      className="fixed bottom-6 right-6 z-50"
      role="navigation"
      aria-label="Швидкі дії"
    >
      {/* Carousel menu container */}
      <div 
        className={`absolute bottom-16 right-0 transition-all duration-300 ease-out ${
          isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex items-center gap-2">
          {/* Left scroll button */}
          {menuItems.length > VISIBLE_ITEMS && (
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              aria-label="Прокрутити вліво"
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                canScrollLeft 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Menu items carousel */}
          <div 
            ref={menuRef}
            className="overflow-hidden"
            style={{ width: `${VISIBLE_ITEMS * 72}px` }}
          >
            <div 
              role="menu"
              aria-label="Швидкі дії"
              className="flex gap-2 transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${scrollIndex * 72}px)` }}
            >
              {menuItems.map((item, index) => {
                const isActive = focusedIndex === index
                
                const buttonClasses = `
                  flex flex-col items-center justify-center w-16 h-16 rounded-xl
                  text-white transition-all duration-200 flex-shrink-0
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400
                  ${item.bgColor} ${item.hoverColor}
                  ${isActive ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : ''}
                `
                
                const commonProps = {
                  role: 'menuitem' as const,
                  tabIndex: isOpen ? 0 : -1,
                  'aria-label': `${item.label}${item.description ? ` - ${item.description}` : ''}`,
                  onFocus: () => setFocusedIndex(index),
                }

                const content = (
                  <>
                    {item.icon}
                    <span className="text-[10px] font-medium mt-1 leading-tight text-center">
                      {item.label}
                    </span>
                  </>
                )

                return item.href ? (
                  <a
                    key={item.id}
                    ref={el => { menuItemsRef.current[index] = el }}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={buttonClasses}
                    {...commonProps}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    key={item.id}
                    ref={el => { menuItemsRef.current[index] = el }}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={buttonClasses}
                    {...commonProps}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right scroll button */}
          {menuItems.length > VISIBLE_ITEMS && (
            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              aria-label="Прокрутити вправо"
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                canScrollRight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Arrow pointing to trigger */}
        <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-r border-b border-slate-200 transform rotate-45" />
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
