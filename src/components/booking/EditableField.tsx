'use client'

import { type ReactNode } from 'react'
import { PenSquare, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EditableFieldProps {
  label: string
  value: ReactNode
  isEditing: boolean
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  children: ReactNode
  className?: string
}

/**
 * Reusable inline-edit pattern for the booking summary step.
 * Shows a label + value by default; when editing, renders children (input fields)
 * with save/cancel buttons.
 */
export default function EditableField({
  label,
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  children,
  className = '',
}: EditableFieldProps) {
  const { t } = useTranslation()

  return (
    <div className={`relative ${className}`}>
      <div className="text-dental-muted flex justify-between">
        <span>{label}</span>
        {!isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="text-dental-muted hover:text-dental-teal"
            aria-label={t('common.edit')}
          >
            <PenSquare className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-1">
          {children}
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-dental-muted hover:text-dental-dark"
              aria-label={t('common.cancel')}
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onSave}
              className="p-1 text-dental-teal hover:text-dental-teal-dark"
              aria-label={t('common.save')}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="font-medium text-dental-dark">{value}</div>
      )}
    </div>
  )
}
