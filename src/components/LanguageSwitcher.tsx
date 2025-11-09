import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage =
    languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
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

  // Close dropdown on Escape key
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-teal focus:ring-offset-2"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-5 w-5 text-gray-600" aria-hidden="true" />
        <span className="text-sm font-medium text-gray-700">
          {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          {languages.map(language => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                language.code === i18n.language
                  ? 'text-dental-teal font-semibold'
                  : 'text-gray-700'
              }`}
              role="menuitem"
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
              </span>
              {language.code === i18n.language && (
                <Check
                  className="h-4 w-4 text-dental-teal"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
