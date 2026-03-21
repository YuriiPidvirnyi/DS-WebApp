'use client'

import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

interface AdminModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

export default function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidthClassName = 'max-w-2xl',
}: AdminModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full ${maxWidthClassName} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-dental-secondary-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-dental-dark">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-dental-text-light">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-dental-text-light transition-colors hover:bg-dental-secondary-50 hover:text-dental-dark"
            aria-label={t('admin.modal.closeAria')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
