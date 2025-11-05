import { useState } from 'react'
import { useAccessibility } from './AccessibilityProvider'
import { Settings, Maximize, Minimize } from 'lucide-react'
import { Button } from './ui'

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false)
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

  return (
    <div
      className="fixed bottom-4 left-4 z-50"
      role="region"
      aria-label="Налаштування доступності"
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-controls="a11y-panel"
        className="bg-dental-blue text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-dental-blue focus:ring-offset-2"
        aria-label={
          isOpen ? 'Закрити панель доступності' : 'Відкрити панель доступності'
        }
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Accessibility panel */}
      {isOpen && (
        <div
          id="a11y-panel"
          className="bg-white rounded-lg shadow-xl p-4 absolute bottom-16 left-0 w-64 border border-gray-200"
          aria-live="polite"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Доступність
          </h3>

          {/* Font size controls */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Розмір тексту
            </h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseFontSize}
                aria-label="Зменшити розмір тексту"
                disabled={fontSize === 'normal'}
              >
                <Minimize className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={resetFontSize}
                aria-label="Скинути розмір тексту"
                disabled={fontSize === 'normal'}
              >
                <span className="text-xs">A</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={increaseFontSize}
                aria-label="Збільшити розмір тексту"
                disabled={fontSize === 'largest'}
              >
                <Maximize className="h-4 w-4" />
              </Button>

              <span className="text-sm text-gray-500 ml-2">
                {fontSize === 'normal'
                  ? 'Стандартний'
                  : fontSize === 'larger'
                    ? 'Великий'
                    : 'Найбільший'}
              </span>
            </div>
          </div>

          {/* High contrast toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="high-contrast"
                className="text-sm font-medium text-gray-700"
              >
                Високий контраст
              </label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id="high-contrast"
                  name="high-contrast"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                  className="sr-only"
                />
                <div
                  className={`block h-6 rounded-full w-10 transition-colors duration-200 ease-in-out ${highContrast ? 'bg-dental-teal' : 'bg-gray-300'}`}
                ></div>
                <div
                  className={`absolute left-0.5 top-0.5 bg-white border w-5 h-5 rounded-full transition-transform duration-200 ease-in-out transform ${highContrast ? 'translate-x-4 border-dental-teal' : 'translate-x-0 border-gray-300'}`}
                ></div>
              </div>
            </div>
          </div>

          {/* Reduced motion toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reduced-motion"
                className="text-sm font-medium text-gray-700"
              >
                Зменшена анімація
              </label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id="reduced-motion"
                  name="reduced-motion"
                  checked={reducedMotion}
                  onChange={toggleReducedMotion}
                  className="sr-only"
                />
                <div
                  className={`block h-6 rounded-full w-10 transition-colors duration-200 ease-in-out ${reducedMotion ? 'bg-dental-teal' : 'bg-gray-300'}`}
                ></div>
                <div
                  className={`absolute left-0.5 top-0.5 bg-white border w-5 h-5 rounded-full transition-transform duration-200 ease-in-out transform ${reducedMotion ? 'translate-x-4 border-dental-teal' : 'translate-x-0 border-gray-300'}`}
                ></div>
              </div>
            </div>
          </div>

          {/* Color blindness mode */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Режим сприйняття кольорів
            </h4>
            <select
              value={colorBlindnessMode}
              onChange={e =>
                setColorBlindnessMode(
                  e.target.value as
                    | 'normal'
                    | 'protanopia'
                    | 'deuteranopia'
                    | 'tritanopia'
                )
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              aria-label="Режим сприйняття кольорів"
            >
              <option value="normal">Звичайний режим</option>
              <option value="protanopia">Протанопія (червоний)</option>
              <option value="deuteranopia">Дейтеранопія (зелений)</option>
              <option value="tritanopia">Тританопія (синій)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
