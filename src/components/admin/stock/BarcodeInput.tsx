'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ScanLine, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  onScanned?: (code: string) => void
  placeholder?: string
  className?: string
}

export default function BarcodeInput({
  value,
  onChange,
  onScanned,
  placeholder = 'Штрихкод або артикул...',
  className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scanning, setScanning] = useState(false)

  // USB keyboard-wedge scanner detection: bursts of chars ending with Enter at >200 chars/sec
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current) return

      if (e.key === 'Enter') {
        const buf = bufferRef.current.trim()
        if (buf.length >= 4 && onScanned) {
          e.preventDefault()
          onScanned(buf)
          setScanning(false)
        }
        bufferRef.current = ''
        if (timerRef.current) clearTimeout(timerRef.current)
        return
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key
        if (timerRef.current) clearTimeout(timerRef.current)
        // Reset buffer if no activity for 100ms (human typing, not scanner)
        timerRef.current = setTimeout(() => {
          bufferRef.current = ''
          setScanning(false)
        }, 100)
        // Flag scanner burst (>3 chars in <100ms)
        if (bufferRef.current.length > 3) setScanning(true)
      }
    },
    [onScanned]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-dental-secondary-300 px-3 py-2 pr-16 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 ${scanning ? 'border-dental-primary-600 bg-dental-primary/5' : ''} ${className}`}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {scanning && (
          <span className="text-xs text-dental-primary-600 animate-pulse">
            скан
          </span>
        )}
        <ScanLine className="w-4 h-4 text-dental-text" />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-dental-text hover:text-dental-dark"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
