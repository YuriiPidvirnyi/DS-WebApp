'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

export interface SelectOption {
  value: string
  label: string
}

export interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  className?: string
  'aria-label'?: string
}

export function CustomSelect({
  value,
  onChange,
  options,
  label,
  error,
  helperText,
  fullWidth = false,
  className,
  'aria-label': ariaLabel,
}: CustomSelectProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const uid = useId()

  const selectedOption = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = options.findIndex(o => o.value === value)
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(prev => !prev)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        const next = options[Math.min(currentIndex + 1, options.length - 1)]
        if (next) onChange(next.value)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = options[Math.max(currentIndex - 1, 0)]
      if (prev) onChange(prev.value)
    }
  }

  return (
    <div
      ref={containerRef}
      className={clsx('relative', fullWidth ? 'w-full' : '', className)}
    >
      {label && (
        <label
          id={`${uid}-label`}
          className="block text-sm font-medium text-dental-dark mb-2"
        >
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${uid}-listbox`}
        aria-labelledby={label ? `${uid}-label` : undefined}
        aria-label={ariaLabel}
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'w-full min-h-[44px] flex items-center justify-between gap-2 px-4 py-2.5 text-base sm:text-sm text-dental-dark bg-white border transition-all duration-200 shadow-sm',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-dental-primary-500 focus-visible:ring-offset-1',
          error
            ? 'border-red-300 focus-visible:ring-red-500'
            : 'border-dental-secondary-200 hover:border-dental-primary-400',
          isOpen
            ? 'rounded-t-2xl border-dental-primary-400 border-b-transparent shadow-md'
            : 'rounded-2xl'
        )}
      >
        <span
          className={selectedOption ? 'text-dental-dark' : 'text-dental-muted'}
        >
          {selectedOption?.label ?? t('customSelect.placeholder')}
        </span>
        <ChevronDown
          className={clsx(
            'h-5 w-5 text-dental-muted shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {/* Dropdown list - appears as continuation of the button */}
      {isOpen && (
        <ul
          ref={listRef}
          id={`${uid}-listbox`}
          role="listbox"
          aria-label={ariaLabel ?? label}
          className={clsx(
            'absolute left-0 right-0 z-50 bg-white border border-dental-primary-400 border-t-0 rounded-b-2xl shadow-xl',
            'max-h-[min(16rem,60vh)] overflow-y-auto overscroll-contain py-1'
          )}
        >
          {options.map(option => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={clsx(
                  'px-4 py-3 sm:py-2.5 text-base sm:text-sm cursor-pointer transition-colors duration-150 select-none min-h-[44px] flex items-center',
                  isSelected
                    ? 'bg-dental-primary-600 text-white font-medium'
                    : 'text-dental-dark hover:bg-dental-primary-50 hover:text-dental-primary-700'
                )}
              >
                {option.label}
              </li>
            )
          })}
        </ul>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-dental-muted">{helperText}</p>
      )}
    </div>
  )
}
