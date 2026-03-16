'use client'

import { useState, useRef, useEffect } from 'react'
import { useAccessibility } from '@/hooks/useAccessibility'
import { Accessibility, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface AccessibilityPanelProps {
  defaultOpen?: boolean
}

export function AccessibilityPanel({ defaultOpen = false }: AccessibilityPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    colorBlindnessMode,
    setColorBlindnessMode,
  } = useAccessibility()

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus trap inside panel
  useEffect(() => {
    if (isOpen) {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, input, select, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [isOpen])

  const fontSizeLabel =
    fontSize === 'normal'
      ? 'Стандартний'
      : fontSize === 'larger'
        ? 'Великий'
        : 'Найбільший'

  return (
    <div
      className="relative"
      role="region"
      aria-label="Налаштування доступності"
    >
      {/* Panel - when defaultOpen (controlled externally), no absolute positioning */}
      {isOpen && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-panel-title"
          className={`${defaultOpen ? '' : 'absolute bottom-16 right-0'} w-full sm:w-72 bg-white rounded-2xl shadow-2xl border border-dental-secondary-200 overflow-y-auto max-h-[70vh] sm:max-h-96`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dental-secondary-200 bg-dental-primary-50">
            <h3
              id="a11y-panel-title"
              className="text-base font-semibold text-dental-dark"
            >
              Налаштування доступності
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-100 transition-colors"
              aria-label="Закрити панель доступності"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Font size */}
            <div>
              <p className="text-sm font-medium text-dental-dark mb-2">
                Розмір тексту
                <span className="ml-2 text-xs font-normal text-dental-muted">
                  ({fontSizeLabel})
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize === 'normal'}
                  aria-label="Зменшити розмір тексту"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dental-secondary-200 text-dental-dark text-sm font-medium hover:bg-dental-secondary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                  Менше
                </button>
                <button
                  onClick={resetFontSize}
                  disabled={fontSize === 'normal'}
                  aria-label="Скинути розмір тексту"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-dental-secondary-200 text-dental-dark hover:bg-dental-secondary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize === 'largest'}
                  aria-label="Збільшити розмір тексту"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dental-secondary-200 text-dental-dark text-sm font-medium hover:bg-dental-secondary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Більше
                </button>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-dental-secondary-200" />

            {/* High contrast */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="high-contrast"
                className="text-sm font-medium text-dental-dark cursor-pointer"
              >
                Високий контраст
              </label>
              <button
                id="high-contrast"
                role="switch"
                aria-checked={highContrast}
                onClick={toggleHighContrast}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dental-primary-500 focus-visible:ring-offset-2 ${
                  highContrast ? 'bg-dental-primary-600' : 'bg-dental-secondary-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
                <span className="sr-only">
                  {highContrast ? 'Вимкнути' : 'Увімкнути'} високий контраст
                </span>
              </button>
            </div>

            {/* Reduced motion */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="reduced-motion"
                className="text-sm font-medium text-dental-dark cursor-pointer"
              >
                Зменшена анімація
              </label>
              <button
                id="reduced-motion"
                role="switch"
                aria-checked={reducedMotion}
                onClick={toggleReducedMotion}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dental-primary-500 focus-visible:ring-offset-2 ${
                  reducedMotion ? 'bg-dental-primary-600' : 'bg-dental-secondary-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    reducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
                <span className="sr-only">
                  {reducedMotion ? 'Вимкнути' : 'Увімкнути'} зменшену анімацію
                </span>
              </button>
            </div>

            {/* Divider */}
            <hr className="border-dental-secondary-200" />

            {/* Color blindness */}
            <div>
              <p className="text-sm font-medium text-dental-dark mb-2">
                Сприйняття кольорів
              </p>
              <CustomSelect
                value={colorBlindnessMode}
                onChange={val =>
                  setColorBlindnessMode(
                    val as 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'
                  )
                }
                options={[
                  { value: 'normal',       label: 'Звичайний режим' },
                  { value: 'protanopia',   label: 'Протанопія (червоний)' },
                  { value: 'deuteranopia', label: 'Дейтеранопія (зелений)' },
                  { value: 'tritanopia',   label: 'Тританопія (синій)' },
                ]}
                fullWidth
                aria-label="Режим сприйняття кольорів"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-controls="a11y-panel"
        aria-label={isOpen ? 'Закрити панель доступності' : 'Відкрити панель доступності'}
        className="group flex items-center gap-2 bg-gradient-to-br from-dental-primary-600 to-dental-primary-700 text-white pl-3 pr-4 h-11 rounded-full shadow-lg hover:from-dental-primary-700 hover:to-dental-primary-800 hover:shadow-xl hover:shadow-dental-primary-500/30 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dental-primary-500 focus-visible:ring-offset-2 transition-all duration-300"
      >
        <Accessibility className="h-5 w-5 shrink-0 group-hover:animate-pulse" />
        <span className="text-sm font-medium">Доступність</span>
      </button>
    </div>
  )
}
