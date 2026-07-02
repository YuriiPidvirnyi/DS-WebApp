'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

const MONOPAY_SCRIPT_URL =
  'https://pay.monobank.ua/mono-pay-button/v1/mono-pay-button.js'

// ── MonoPay global type declaration ──────────────────────────────────────────

interface MonoPayUIOptions {
  buttonType?: 'pay' | 'donate'
  theme?: 'light' | 'dark'
  corners?: 'soft' | 'square'
}

interface MonoPayCallbacks {
  onButtonReady?: () => void
  onClick?: () => void
  onInvoiceCreate?: (invoiceId: string) => void
  onSuccess?: () => void
  onError?: (err: { errorCode: string; errorMsg: string }) => void
}

interface MonoPayInitOptions {
  keyId: string
  signature: string
  requestId: string
  payloadBase64: string
  ui?: MonoPayUIOptions
  callbacks?: MonoPayCallbacks
}

declare global {
  interface Window {
    MonoPay?: {
      init(options: MonoPayInitOptions): void
      update(options: Partial<MonoPayInitOptions>): void
      destroy(): void
    }
  }
}

// ── Script loader (singleton) ─────────────────────────────────────────────────

let scriptPromise: Promise<void> | null = null

function loadMonoPayScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  if (typeof document === 'undefined') return Promise.resolve()

  scriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${MONOPAY_SCRIPT_URL}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = MONOPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Не вдалося завантажити MonoPay'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MonoPayButtonProps {
  appointmentId: string
  amountKopecks: number
  description?: string
  paymentType?: 'debit' | 'hold'
  ui?: MonoPayUIOptions
  /** Called when Monobank confirms payment success */
  onSuccess?: (invoiceId: string | null) => void
  /** Called on any payment error */
  onError?: (errorCode: string, errorMsg: string) => void
  className?: string
}

type Phase =
  | 'loading' // fetching signed payload + loading script
  | 'ready' // button rendered by MonoPay SDK
  | 'processing' // user clicked, awaiting result
  | 'success'
  | 'error'

export function MonoPayButton({
  appointmentId,
  amountKopecks,
  description,
  paymentType = 'debit',
  ui,
  onSuccess,
  onError,
  className,
}: MonoPayButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const invoiceIdRef = useRef<string | null>(null)

  const [phase, setPhase] = useState<Phase>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSuccess = useCallback(() => {
    setPhase('success')
    onSuccess?.(invoiceIdRef.current)
  }, [onSuccess])

  const handleError = useCallback(
    (err: { errorCode: string; errorMsg: string }) => {
      setPhase('error')
      setErrorMsg(err.errorMsg || 'Помилка оплати')
      onError?.(err.errorCode, err.errorMsg)
    },
    [onError]
  )

  useEffect(() => {
    let destroyed = false

    async function init() {
      try {
        // 1. Load script + fetch signed payload in parallel
        const [, res] = await Promise.all([
          loadMonoPayScript(),
          fetch(
            `/api/payments/monopay-init?appointmentId=${encodeURIComponent(appointmentId)}&amountKopecks=${amountKopecks}${description ? `&description=${encodeURIComponent(description)}` : ''}&paymentType=${paymentType}`,
            { credentials: 'include' }
          ),
        ])

        if (destroyed) return

        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error ?? 'Помилка ініціалізації платежу')
        }

        const { data } = (await res.json()) as {
          data: {
            keyId: string
            signature: string
            requestId: string
            payloadBase64: string
          }
        }

        if (destroyed || !window.MonoPay) return

        // 2. Mount MonoPay button into our container div
        window.MonoPay.init({
          keyId: data.keyId,
          signature: data.signature,
          requestId: data.requestId,
          payloadBase64: data.payloadBase64,
          ui: {
            buttonType: 'pay',
            theme: 'light',
            corners: 'soft',
            ...ui,
          },
          callbacks: {
            onButtonReady: () => {
              if (!destroyed) setPhase('ready')
            },
            onClick: () => {
              if (!destroyed) setPhase('processing')
            },
            onInvoiceCreate: invoiceId => {
              invoiceIdRef.current = invoiceId
            },
            onSuccess: () => {
              if (!destroyed) handleSuccess()
            },
            onError: err => {
              if (!destroyed) handleError(err)
            },
          },
        })
      } catch (err) {
        if (!destroyed) {
          const msg =
            err instanceof Error ? err.message : 'Помилка ініціалізації'
          setPhase('error')
          setErrorMsg(msg)
          onError?.('INIT_ERROR', msg)
        }
      }
    }

    init()

    return () => {
      destroyed = true
      window.MonoPay?.destroy()
    }
  }, [
    appointmentId,
    amountKopecks,
    description,
    paymentType,
    ui,
    handleSuccess,
    handleError,
    onError,
  ])

  if (phase === 'success') {
    return (
      <div
        className={`flex items-center gap-2 text-green-700 font-medium ${className ?? ''}`}
      >
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <span>Оплату успішно здійснено</span>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className={`space-y-2 ${className ?? ''}`}>
        <div className="flex items-center gap-2 text-red-600 font-medium">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg ?? 'Помилка оплати'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* MonoPay SDK mounts its button here */}
      <div ref={containerRef} id="mono-pay-button-container" />

      {/* Overlay while loading or processing */}
      {(phase === 'loading' || phase === 'processing') && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-dental-primary-600" />
          <span className="ml-2 text-sm text-dental-text">
            {phase === 'loading' ? 'Завантаження...' : 'Обробка...'}
          </span>
        </div>
      )}
    </div>
  )
}
