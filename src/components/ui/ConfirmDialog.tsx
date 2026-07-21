'use client'

import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, OctagonAlert } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  /**
   * Рівень тертя (макет 1d): 'significant' — модалка з наслідками + кнопка
   * підтвердження; 'irreversible' — додатково вимагає набрати контрольне
   * слово (прізвище/назву об'єкта), випадкове видалення неможливе.
   * Зворотні дії не повинні відкривати модалку взагалі — виконуйте одразу
   * і показуйте тост з «Відмінити».
   */
  severity?: 'significant' | 'irreversible'
  /** Питання з назвою конкретного об'єкта: «Видалити картку пацієнта?» */
  title: string
  /** Пояснення, що саме станеться, з назвою об'єкта в тексті */
  description?: ReactNode
  /** «Разом із карткою зникнуть»: перелік того, що зникне/зміниться */
  consequences?: ReactNode[]
  /** Додаткове попередження (наприклад, про GDPR-слід у журналі аудиту) */
  warning?: ReactNode
  /** Контрольне слово для severity='irreversible' (наприклад, прізвище) */
  confirmationWord?: string
  confirmLabel: string
  cancelLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/*
 * Єдиний брендований патерн підтверджень (1d) — заміна window.confirm.
 * Безпечна дія ліворуч і нейтральна; руйнівна — червона й праворуч.
 */
export function ConfirmDialog({
  open,
  severity = 'significant',
  title,
  description,
  consequences,
  warning,
  confirmationWord,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const containerRef = useFocusTrap<HTMLDivElement>(open, onClose)
  const inputRef = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState('')
  const titleId = useId()
  const descriptionId = useId()

  // Reset the typed confirmation whenever the dialog reopens
  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  // Move initial focus into the dialog on open. useFocusTrap only traps Tab and
  // restores focus on close — it does NOT set initial focus, so without this
  // focus stays stranded on the trigger behind the modal. Focus the typing input
  // when required; otherwise the dialog container itself (APG alertdialog pattern
  // — the first Tab then lands on the least-destructive Cancel action).
  useEffect(() => {
    if (!open) return
    const needsTyping = severity === 'irreversible' && !!confirmationWord
    if (needsTyping) inputRef.current?.focus()
    else containerRef.current?.focus()
  }, [open, severity, confirmationWord, containerRef])

  if (!open) return null

  const requiresTyping = severity === 'irreversible' && !!confirmationWord
  const confirmDisabled =
    isLoading || (requiresTyping && typed.trim() !== confirmationWord.trim())

  const Icon = severity === 'irreversible' ? OctagonAlert : AlertTriangle

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-dental-dark/50 p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-dialog bg-white shadow-2xl focus:outline-hidden"
      >
        <div className="p-7 pb-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-status-error-100">
            <Icon aria-hidden="true" className="h-6 w-6 text-dental-error" />
          </div>

          <h2
            id={titleId}
            className="mb-2 text-xl font-extrabold tracking-tight text-dental-dark"
          >
            {title}
          </h2>
          {description && (
            <div
              id={descriptionId}
              className="text-sm leading-relaxed text-dental-text"
            >
              {description}
            </div>
          )}

          {consequences && consequences.length > 0 && (
            <div className="mt-4 rounded-md border border-dental-secondary-200 bg-dental-secondary-50 px-4 py-3.5">
              <p className="mb-2 text-xs font-semibold tracking-wider text-dental-muted uppercase">
                {t('confirmDialog.consequencesTitle')}
              </p>
              <ul className="space-y-1.5 text-sm text-dental-text">
                {consequences.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-dental-primary-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warning && (
            <div className="mt-4 flex items-start gap-2.5 rounded-md bg-status-error-100 px-3.5 py-3">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-4.5 w-4.5 shrink-0 text-dental-error"
              />
              <p className="text-[13px] leading-snug text-status-error-700">
                {warning}
              </p>
            </div>
          )}

          {requiresTyping && (
            <div className="mt-4">
              <label
                htmlFor={`${titleId}-confirm-input`}
                className="mb-1.5 block text-[13px] text-dental-text"
              >
                {t('confirmDialog.typeToConfirm')}{' '}
                <strong className="text-dental-dark">{confirmationWord}</strong>
              </label>
              <input
                ref={inputRef}
                id={`${titleId}-confirm-input`}
                type="text"
                value={typed}
                onChange={e => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="min-h-11 w-full rounded-md border-[1.5px] border-dental-primary-600 px-4 text-[15px] text-dental-dark focus:outline-hidden focus:ring-2 focus:ring-dental-primary-300"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-status-neutral-100 bg-dental-secondary-50 px-7 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="min-h-11"
            onClick={onConfirm}
            disabled={confirmDisabled}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
