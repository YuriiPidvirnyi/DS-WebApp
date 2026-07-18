'use client'

import { ReactNode, useCallback, useRef, useState } from 'react'
import {
  ConfirmDialog,
  type ConfirmDialogProps,
} from '@/components/ui/ConfirmDialog'

export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'open' | 'onConfirm' | 'onClose' | 'isLoading'
>

/**
 * Promise-обгортка над <ConfirmDialog> (патерн 1d) — заміна window.confirm.
 *
 *   const { confirm, confirmDialog } = useConfirm()
 *   ...
 *   if (!(await confirm({ title, description, confirmLabel }))) return
 *   ...
 *   return <>{confirmDialog}</>
 *
 * Зворотні дії сюди не ведіть — виконуйте одразу з тостом «Відмінити».
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      // Якщо діалог уже відкритий — попередній виклик вважаємо скасованим
      resolveRef.current?.(false)
      resolveRef.current = resolve
      setOptions(opts)
    })
  }, [])

  const settle = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed)
    resolveRef.current = null
    setOptions(null)
  }, [])

  const confirmDialog: ReactNode = options ? (
    <ConfirmDialog
      {...options}
      open
      onConfirm={() => settle(true)}
      onClose={() => settle(false)}
    />
  ) : null

  return { confirm, confirmDialog }
}
