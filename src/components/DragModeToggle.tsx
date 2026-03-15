'use client'

import { Move, X, Info } from 'lucide-react'
import { useDragMode } from '@/context/DragModeContext'

export default function DragModeToggle() {
  const { dragModeEnabled, toggleDragMode, disableDragMode } = useDragMode()

  return (
    <>
      {/* Toggle button — positioned right of Accessibility button */}
      <button
        onClick={toggleDragMode}
        aria-label={dragModeEnabled ? 'Вимкнути режим переміщення' : 'Увімкнути режим переміщення кнопок'}
        title={dragModeEnabled ? 'Вимкнути режим переміщення' : 'Перемістити кнопки'}
        className={`fixed bottom-6 left-24 z-[100] w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all duration-300
          ${dragModeEnabled
            ? 'bg-dental-primary-600 text-white shadow-dental-primary-500/30 scale-110'
            : 'bg-white border border-dental-secondary-200 text-dental-muted hover:text-dental-primary-600 hover:border-dental-primary-300 hover:shadow-lg'
          }`}
      >
        <Move className="h-4 w-4" />
      </button>

      {/* Instruction banner — shown only when drag mode is active */}
      {dragModeEnabled && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-dental-dark text-white text-sm px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300"
          role="status"
          aria-live="polite"
        >
          <Info className="h-4 w-4 text-dental-primary-300 shrink-0" />
          <span>Перетягніть кнопки на нове місце. Зміни збережуться автоматично.</span>
          <button
            onClick={disableDragMode}
            aria-label="Закрити режим переміщення"
            className="ml-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  )
}
