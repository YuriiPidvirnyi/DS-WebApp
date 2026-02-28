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

const DEFAULT_LANG = languages[0]

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline'
  className?: string
}

export default function LanguageSwitcher({
  variant = 'dropdown',
  className = '',
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get current language - only use actual language after mount
  const currentLang = mounted 
    ? languages.find(lang => lang.code === i18n.language) || DEFAULT_LANG
    : DEFAULT_LANG

  const handleLanguageChange = useCallback((langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode
    }
  }, [i18n])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languages.map((lang, index) => (
          <span key={lang.code} className="flex items-center">
            <button
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-2 py-1 text-sm font-medium rounded-lg transition-colors ${
                mounted && lang.code === i18n.language
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              aria-label={`Switch to ${lang.name}`}
            >
              <span suppressHydrationWarning>{lang.flag}</span>
              <span className="ml-1">{lang.code.toUpperCase()}</span>
            </button>
            {index < languages.length - 1 && (
              <span className="text-border mx-0.5">|</span>
            )}
          </span>
        ))}
      </div>
    )
  }

  // Dropdown variant
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        {/* Suppress hydration warning on dynamic content */}
        <span suppressHydrationWarning>{currentLang.flag}</span>
        <span className="hidden sm:inline" suppressHydrationWarning>
          {currentLang.nativeName}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-2 z-50"
          role="listbox"
        >
          {languages.map(lang => {
            const isActive = mounted && lang.code === i18n.language
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted transition-colors ${
                  isActive ? 'bg-primary/10' : ''
                }`}
                role="option"
                aria-selected={isActive}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <div>
                    <div className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {lang.nativeName}
                    </div>
                    <div className="text-xs text-muted-foreground">{lang.name}</div>
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
