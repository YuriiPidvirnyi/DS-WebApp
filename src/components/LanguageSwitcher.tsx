'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, ChevronDown, Check } from 'lucide-react'
import uk from '@/locales/uk'
import { setLanguage } from '@/i18n/config'
import {
  trackEvent,
  EngagementEvent,
  AnalyticsEventCategory,
} from '@/utils/analytics'

interface Language {
  code: 'uk' | 'en' | 'pl'
  /** Short UI label — NOT the ISO code: 'uk' must read as UA, never "UK". */
  label: 'UA' | 'EN' | 'PL'
}

// No country flags: the design canon bans flag/emoji iconography site-wide
// (handoff rules А2/Л4) — language is text («UA», «Українська»), never a flag.
const languages: Language[] = [
  { code: 'uk', label: 'UA' },
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
]

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline'
  showNativeName?: boolean
  className?: string
}

export default function LanguageSwitcher({
  variant = 'dropdown',
  showNativeName = true,
  className = '',
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const currentLanguage =
    languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = useCallback((langCode: Language['code']) => {
    void setLanguage(langCode)
    setIsOpen(false)

    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode
    }

    try {
      trackEvent(
        EngagementEvent.LanguageChanged,
        AnalyticsEventCategory.Engagement,
        {
          language: langCode,
        }
      )
    } catch {
      // analytics may fail silently
    }
  }, [])

  const getLanguageMeta = (code: Language['code']) => {
    if (!isMounted) {
      return {
        name: uk.languageSwitcher.languages[code].name,
        nativeName: uk.languageSwitcher.languages[code].nativeName,
      }
    }

    return {
      name: t(`languageSwitcher.languages.${code}.name`),
      nativeName: t(`languageSwitcher.languages.${code}.nativeName`),
    }
  }

  const getSwitchToLabel = (code: Language['code']) => {
    if (!isMounted) {
      return uk.languageSwitcher.aria.switchTo.replace(
        '{{language}}',
        getLanguageMeta(code).name
      )
    }

    return t('languageSwitcher.aria.switchTo', {
      language: getLanguageMeta(code).name,
    })
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
              aria-label={getSwitchToLabel(lang.code)}
              aria-current={lang.code === displayLang.code ? 'true' : undefined}
            >
              {lang.label}
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
        className={`flex min-h-[44px] items-center font-medium text-dental-muted hover:text-dental-primary-600 transition-colors border border-transparent ${
          showNativeName
            ? 'gap-2 px-3 py-2 text-sm'
            : 'gap-1.5 px-2.5 py-1 text-xs'
        } ${
          showNativeName
            ? isOpen
              ? 'rounded-t-2xl border-dental-primary-400 border-b-transparent bg-white shadow-xs'
              : 'rounded-2xl hover:bg-dental-secondary-50'
            : // Compact mode (topbar «UA ˅» button): handoff canon verbatim —
              // radius 8px, no flag, stable look in both states (no white
              // morph that would swallow the light text on the dark bar).
              'rounded-[8px]'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={
          isMounted
            ? t('languageSwitcher.aria.select')
            : uk.languageSwitcher.aria.select
        }
      >
        {showNativeName && <Globe className="w-4 h-4" />}
        <span className={showNativeName ? 'hidden sm:inline' : undefined}>
          {showNativeName
            ? getLanguageMeta(displayLang.code).nativeName
            : displayLang.label}
        </span>
        <ChevronDown
          className={`${showNativeName ? 'w-4 h-4' : 'w-3 h-3'} transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-50 origin-top-right bg-white py-1 shadow-xl ${
            showNativeName
              ? 'mt-0 w-56 rounded-b-2xl border border-dental-primary-400 border-t-0'
              : // Compact mode: handoff canon — control radius (12px), warm
                // #d1cac0 border, panel fitted to content (no dead air).
                'mt-1.5 w-fit min-w-0 rounded-[12px] border border-dental-secondary'
          }`}
          role="listbox"
          aria-label={
            isMounted
              ? t('languageSwitcher.aria.available')
              : uk.languageSwitcher.aria.available
          }
        >
          {languages.map(lang => {
            const meta = getLanguageMeta(lang.code)
            const active = lang.code === displayLang.code
            if (!showNativeName) {
              // Compact mode, handoff canon: no flags (banned deck-wide),
              // selected = #f0f7f8 tint + teal ink — never a solid dark fill.
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex min-h-[44px] items-center gap-2.5 whitespace-nowrap px-3.5 py-2 text-left text-sm transition-colors duration-150 first:rounded-t-[11px] last:rounded-b-[11px] ${
                    active
                      ? 'bg-dental-primary-50 font-medium text-dental-primary-700'
                      : 'text-dental-dark hover:bg-dental-primary-50/60 hover:text-dental-primary-700'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  {meta.nativeName}
                  <Check
                    className={`ml-auto w-3.5 h-3.5 text-dental-primary-600 ${active ? '' : 'invisible'}`}
                  />
                </button>
              )
            }
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex min-h-[44px] items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  active
                    ? 'bg-dental-primary-600 text-white'
                    : 'hover:bg-dental-primary-50 hover:text-dental-primary-700'
                }`}
                role="option"
                aria-selected={active}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold ${active ? 'text-white/90' : 'text-dental-muted'}`}
                  >
                    {lang.label}
                  </span>
                  <div>
                    <div
                      className={`font-medium ${
                        lang.code === displayLang.code
                          ? 'text-white'
                          : 'text-dental-dark'
                      }`}
                    >
                      {meta.nativeName}
                    </div>
                    <div
                      className={`text-xs ${
                        lang.code === displayLang.code
                          ? 'text-white/80'
                          : 'text-dental-muted'
                      }`}
                    >
                      {meta.name}
                    </div>
                  </div>
                </div>
                {lang.code === displayLang.code && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
