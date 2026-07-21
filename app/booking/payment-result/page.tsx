'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CONTACT_INFO } from '@/utils/constants'

type PaymentStatus =
  'created' | 'processing' | 'success' | 'failure' | 'expired'

type PollState =
  | { phase: 'polling' }
  | { phase: 'success' }
  | { phase: 'failed'; status: 'failure' | 'expired' }
  | { phase: 'timeout' }

const MAX_ATTEMPTS = 15
const POLL_INTERVAL_MS = 2000

export default function PaymentResultPage() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get('invoiceId')

  const [state, setState] = useState<PollState>({ phase: 'polling' })

  // Resolve invoiceId: URL param first, sessionStorage fallback (set before Monobank redirect)
  const resolvedInvoiceId =
    invoiceId ||
    (() => {
      try {
        return sessionStorage.getItem('pending_payment_invoice_id')
      } catch {
        return null
      }
    })()

  useEffect(() => {
    if (!resolvedInvoiceId) {
      setState({ phase: 'failed', status: 'failure' })
      return
    }
    // Clean up once we have it
    try {
      sessionStorage.removeItem('pending_payment_invoice_id')
    } catch {
      // ignore
    }

    let attempts = 0
    let cancelled = false

    const poll = async () => {
      if (cancelled) return

      attempts += 1

      try {
        const res = await fetch(
          `/api/payments/status/${encodeURIComponent(resolvedInvoiceId)}`
        )
        if (!cancelled && res.ok) {
          const json = (await res.json()) as {
            success?: boolean
            data?: { status?: PaymentStatus }
          }
          const status = json.data?.status

          if (status === 'success') {
            setState({ phase: 'success' })
            return
          }
          if (status === 'failure' || status === 'expired') {
            setState({ phase: 'failed', status })
            return
          }
        }
      } catch {
        // network error — keep polling
      }

      if (cancelled) return

      if (attempts >= MAX_ATTEMPTS) {
        setState({ phase: 'timeout' })
        return
      }

      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [resolvedInvoiceId])

  return (
    <div className="min-h-screen bg-dental-primary-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {state.phase === 'polling' && <PollingView />}
        {state.phase === 'success' && <SuccessView />}
        {state.phase === 'failed' && <FailedView />}
        {state.phase === 'timeout' && <TimeoutView />}
      </div>
    </div>
  )
}

function PollingView() {
  const { t } = useTranslation()
  return (
    <>
      <Loader2 className="w-16 h-16 text-dental-primary-600 animate-spin mx-auto mb-6" />
      <h1 className="text-xl font-semibold text-dental-dark mb-2">
        {t('payments.result.checkingStatus')}
      </h1>
      <p className="text-dental-muted text-sm">
        {t('payments.result.pleaseWait')}
      </p>
    </>
  )
}

function SuccessView() {
  const { t } = useTranslation()
  return (
    <>
      <CheckCircle className="w-16 h-16 text-dental-success mx-auto mb-6" />
      <h1 className="text-xl font-semibold text-dental-dark mb-2">
        {t('payments.result.successTitle')}
      </h1>
      <p className="text-dental-muted text-sm mb-8">
        {t('payments.result.successDescription')}
      </p>
      <Link
        href="/cabinet/payments"
        className="inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-medium rounded-xl px-6 py-3 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
      >
        {t('payments.result.viewPayments')}
      </Link>
    </>
  )
}

function FailedView() {
  const { t } = useTranslation()
  return (
    <>
      <XCircle className="w-16 h-16 text-dental-error mx-auto mb-6" />
      <h1 className="text-xl font-semibold text-dental-dark mb-2">
        {t('payments.result.failedTitle')}
      </h1>
      <p className="text-dental-muted text-sm mb-8">
        {t('payments.result.failedDescription')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/booking"
          className="inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-medium rounded-xl px-6 py-3 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
        >
          {t('payments.result.tryAgain')}
        </Link>
        <a
          href={`tel:${CONTACT_INFO.phoneRaw}`}
          className="inline-flex items-center justify-center gap-2 border border-dental-primary-600 text-dental-primary-600 hover:bg-dental-primary-50 font-medium rounded-xl px-6 py-3 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
        >
          {t('payments.result.contactUs')}
        </a>
      </div>
    </>
  )
}

function TimeoutView() {
  const { t } = useTranslation()
  return (
    <>
      <Clock className="w-16 h-16 text-dental-warning mx-auto mb-6" />
      <h1 className="text-xl font-semibold text-dental-dark mb-2">
        {t('payments.result.timeoutTitle')}
      </h1>
      <p className="text-dental-muted text-sm mb-8">
        {t('payments.result.timeoutDescription')}
      </p>
      <Link
        href="/cabinet/payments"
        className="inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-medium rounded-xl px-6 py-3 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
      >
        {t('payments.result.goToCabinet')}
      </Link>
    </>
  )
}
