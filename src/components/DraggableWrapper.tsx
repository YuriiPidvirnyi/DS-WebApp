'use client'

import { ReactNode } from 'react'
import { GripVertical, RotateCcw } from 'lucide-react'
import { useDragMode } from '@/context/DragModeContext'
import { useDraggable } from '@/hooks/useDraggable'

interface DraggableWrapperProps {
  children: ReactNode
  storageKey: string
  label: string
  className?: string
}

export default function DraggableWrapper({
  children,
  storageKey,
  label,
  className = '',
}: DraggableWrapperProps) {
  const { dragModeEnabled } = useDragMode()

  const { elementRef, style, isDragging, hasMoved, onMouseDown, onTouchStart, resetPosition } =
    useDraggable({ storageKey, enabled: dragModeEnabled })

  return (
    <div
      ref={elementRef}
      style={hasMoved ? style : undefined}
      className={`${className} ${isDragging ? 'z-[9999] cursor-grabbing select-none' : ''}`}
    >
      {/* Drag handle overlay — visible only in drag mode */}
      {dragModeEnabled && (
        <div className="absolute inset-0 z-50 rounded-full pointer-events-none">
          {/* Dashed border + drag handle */}
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={`absolute -inset-2 rounded-2xl border-2 border-dashed transition-colors duration-200 cursor-grab active:cursor-grabbing select-none pointer-events-auto
              ${isDragging
                ? 'border-dental-primary-500 bg-dental-primary-500/10'
                : 'border-dental-primary-400/70 bg-dental-primary-50/50 hover:border-dental-primary-500 hover:bg-dental-primary-100/60'
              }`}
          >
            {/* Label chip */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-dental-primary-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow whitespace-nowrap select-none pointer-events-none">
              <GripVertical className="h-3 w-3" />
              {label}
            </div>
          </div>

          {/* Reset button — shown only when position was moved */}
          {hasMoved && (
            <button
              onClick={(e) => { e.stopPropagation(); resetPosition() }}
              aria-label={`Скинути позицію ${label}`}
              title="Скинути до початкової позиції"
              className="absolute -top-3 -right-3 w-6 h-6 bg-white border border-dental-secondary-200 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors z-10 pointer-events-auto"
            >
              <RotateCcw className="h-3 w-3 text-dental-muted hover:text-red-500" />
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  )
}
