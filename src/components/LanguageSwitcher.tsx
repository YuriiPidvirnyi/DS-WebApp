'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, ChevronDown, Check } from 'lucide-react'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
]

// Default language for SSR - must match server render
const DEFAULT_LANG = languages[0]

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline'
  showFlag?: boolean
  showNativeName?: boolean
  className?: string
}

export default function LanguageSwitcher({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = '',
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch by only showing actual language after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use default language on server, actual language only after hydration
  const currentLanguage = mounted 
    ? (languages.find(lang => lang.code === i18n.language) || DEFAULT_LANG)
    : DEFAULT_LANG

  const handleLanguageChange = useCallback((langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode
    }
  }, [i18n])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (variant === 'inline') {
    const activeCode = mounted ? i18n.language : DEFAULT_LANG.code
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languages.map((lang, index) => (
          <span key={lang.code} className="flex items-center">
            <button
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                lang.code === activeCode
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
              }`}
              aria-label={`Switch to ${lang.name}`}
              aria-current={lang.code === activeCode ? 'true' : undefined}
            >
              {showFlag && <span className="mr-1">{lang.flag}</span>}
              {lang.code.toUpperCase()}
            </button>
            {index < languages.length - 1 && (
              <span className="text-slate-300 mx-0.5">|</span>
            )}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{currentLanguage.flag}</span>}
        <span className="hidden sm:inline">
          {showNativeName ? currentLanguage.nativeName : currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
          aria-label="Available languages"
        >
          {languages.map(lang => {
            const isActive = lang.code === currentLanguage.code
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                  isActive ? 'bg-teal-50' : ''
                }`}
                role="option"
                aria-selected={isActive}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <div>
                    <div className={`font-medium ${isActive ? 'text-teal-600' : 'text-slate-900'}`}>
                      {lang.nativeName}
                    </div>
                    <div className="text-xs text-slate-500">{lang.name}</div>
                  </div>
                </div>
                {isActive && (
                  <Check className="w-4 h-4 text-teal-600" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
