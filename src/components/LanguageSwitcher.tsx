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
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

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

  // Default language for SSR - always use 'uk' to match server
  const defaultLang = languages[0]
  const displayLang = isMounted ? currentLanguage : defaultLang

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languages.map((lang, index) => (
          <span key={lang.code} className="flex items-center">
            <button
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                lang.code === displayLang.code
                  ? 'text-dental-primary-600 bg-dental-primary-50'
                  : 'text-dental-muted hover:text-dental-primary-600 hover:bg-dental-secondary-50'
              }`}
              aria-label={`Switch to ${lang.name}`}
              aria-current={lang.code === displayLang.code ? 'true' : undefined}
            >
              {showFlag && <span className="mr-1">{lang.flag}</span>}
              {lang.code.toUpperCase()}
            </button>
            {index < languages.length - 1 && (
              <span className="text-dental-secondary-300 mx-0.5">|</span>
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
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-dental-muted hover:text-dental-primary-600 hover:bg-dental-secondary-50 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{displayLang.flag}</span>}
        <span className="hidden sm:inline">
          {showNativeName ? displayLang.nativeName : displayLang.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-dental-secondary-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
          aria-label="Available languages"
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-dental-secondary-50 transition-colors ${
                lang.code === displayLang.code ? 'bg-dental-primary-50' : ''
              }`}
              role="option"
              aria-selected={lang.code === displayLang.code}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{lang.flag}</span>
                <div>
                  <div className={`font-medium ${lang.code === displayLang.code ? 'text-dental-primary-600' : 'text-dental-dark'}`}>
                    {lang.nativeName}
                  </div>
                  <div className="text-xs text-dental-muted">{lang.name}</div>
                </div>
              </div>
              {lang.code === displayLang.code && (
                <Check className="w-4 h-4 text-dental-primary-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
