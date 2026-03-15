'use client'

import { ReactNode } from 'react'
import { GripVertical, RotateCcw } from 'lucide-react'
import { useDragMode } from '@/context/DragModeContext'
import { useDraggable, Position } from '@/hooks/useDraggable'

interface DraggableWrapperProps {
  children: ReactNode
  storageKey: string
  defaultPosition: Position
  label: string
  className?: string
}

export default function DraggableWrapper({
  children,
  storageKey,
  defaultPosition,
  label,
  className = '',
}: DraggableWrapperProps) {
  const { dragModeEnabled } = useDragMode()

  const { elementRef, style, isDragging, hasMoved, onMouseDown, onTouchStart, resetPosition } =
    useDraggable({ storageKey, defaultPosition, enabled: dragModeEnabled })

  return (
    <div
      ref={elementRef}
      style={style}
      className={`${className} ${isDragging ? 'z-[9999]' : ''}`}
    >
      {/* Drag handle overlay — visible only in drag mode */}
      {dragModeEnabled && (
        <div
          className="absolute inset-0 z-50 rounded-full"
          aria-label={`Перетягнути ${label}`}
        >
          {/* Drag grip indicator */}
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={`absolute -top-2 -left-2 -right-2 -bottom-2 rounded-2xl border-2 border-dashed transition-colors duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing select-none
              ${isDragging
                ? 'border-dental-primary-500 bg-dental-primary-500/10 shadow-lg shadow-dental-primary-500/20'
                : 'border-dental-primary-400/70 bg-dental-primary-50/60 hover:border-dental-primary-500 hover:bg-dental-primary-100/60'
              }`}
          >
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
              className="absolute -top-3 -right-3 w-6 h-6 bg-white border border-dental-secondary-200 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors z-10"
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
