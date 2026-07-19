'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import type { EmailOtpType } from '@supabase/supabase-js'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { isSafeInternalPath } from '@/utils/security'

const SESSION_CHECK_ATTEMPTS = 20
const SESSION_CHECK_DELAY_MS = 400
const FALLBACK = {
  loading: 'Завершуємо вхід, зачекайте...',
  goToLogin: 'Перейти до входу',
  errors: {
    invalidLink:
      'Посилання для відновлення пошкоджене або неповне. Запросіть нове.',
    unavailable: 'Авторизація тимчасово недоступна',
    sessionMissing: 'Сесію не вдалося активувати. Спробуйте увійти ще раз.',
    generic: 'Не вдалося завершити авторизацію. Спробуйте ще раз.',
  },
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, ready } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  // The email token/code is one-time. This effect's deps include `tx` (derived
  // from react-i18next's `t`), and `t`'s identity changes when the en/pl bundle
  // finishes lazy-loading — which would re-run the effect and try to consume the
  // already-used token a second time, overwriting success with a spurious error.
  // Guard so the consume+redirect runs at most once per mount.
  const handledRef = useRef(false)
  const tx = useMemo(
    () => (key: string, fallback: string) => {
      const value = t(key)
      return value && value !== key ? value : fallback
    },
    [t]
  )

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const accessTokenFromQuery = searchParams.get('access_token')
  const refreshTokenFromQuery = searchParams.get('refresh_token')
  const nextParam = searchParams.get('next')
  const safeNext = useMemo(
    () => (isSafeInternalPath(nextParam) ? (nextParam as string) : '/cabinet'),
    [nextParam]
  )

  useEffect(() => {
    if (!ready) {
      return
    }
    if (handledRef.current) {
      return
    }
    handledRef.current = true

    let cancelled = false

    const handleCallback = async () => {
      const hashParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(
              window.location.hash.startsWith('#')
                ? window.location.hash.slice(1)
                : window.location.hash
            )
          : new URLSearchParams()
      const accessToken = accessTokenFromQuery ?? hashParams.get('access_token')
      const refreshToken =
        refreshTokenFromQuery ?? hashParams.get('refresh_token')
      const callbackType = (type ??
        hashParams.get('type')) as EmailOtpType | null
      const resolvedTokenHash = tokenHash ?? token
      const hasCode = Boolean(code)
      const hasOtp = Boolean(resolvedTokenHash && callbackType)
      const hasSessionTokens = Boolean(accessToken && refreshToken)

      // Expired/denied link → the friendly "request a new one" page.
      const errorCode =
        searchParams.get('error_code') ?? hashParams.get('error_code')
      const errorKind = searchParams.get('error') ?? hashParams.get('error')
      if (errorCode === 'otp_expired' || errorKind === 'access_denied') {
        router.replace('/auth/forgot-password?expired=1')
        return
      }

      // A raw token_hash reaching this auto-verifying page (old email template,
      // cached link, bookmark) would be consumed on load — reproducing the very
      // prefetch bug this change fixes. Route it through the click-gated page
      // instead. The PKCE `code` / implicit-session paths below stay here: they
      // are same-browser flows a scanner GET can't complete.
      if (hasOtp && !hasCode && !hasSessionTokens) {
        const params = new URLSearchParams()
        params.set('token_hash', resolvedTokenHash as string)
        params.set('type', callbackType as string)
        if (isSafeInternalPath(nextParam))
          params.set('next', nextParam as string)
        router.replace(`/auth/confirm?${params.toString()}`)
        return
      }

      if (!hasCode && !hasOtp && !hasSessionTokens) {
        if (!cancelled) {
          setError(
            tx('auth.callback.errors.invalidLink', FALLBACK.errors.invalidLink)
          )
        }
        return
      }

      const supabase = createClient()

      if (!supabase) {
        if (!cancelled) {
          setError(
            tx('auth.callback.errors.unavailable', FALLBACK.errors.unavailable)
          )
        }
        return
      }

      // Scrub any auth material from the address bar so a page-view or Referer
      // can't leak the code/tokens while the exchange is in flight.
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          window.history.state,
          '',
          window.location.pathname
        )
      }

      if (hasSessionTokens) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken as string,
          refresh_token: refreshToken as string,
        })

        if (setSessionError) {
          if (!cancelled) {
            setError(
              tx('auth.callback.errors.generic', FALLBACK.errors.generic)
            )
          }
          return
        }

        if (
          typeof window !== 'undefined' &&
          window.location.hash.includes('access_token=')
        ) {
          const cleanHref = `${window.location.pathname}${window.location.search}`
          window.history.replaceState(window.history.state, '', cleanHref)
        }
      } else if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          if (!cancelled) {
            setError(
              tx('auth.callback.errors.generic', FALLBACK.errors.generic)
            )
          }
          return
        }
      } else if (resolvedTokenHash && callbackType) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: resolvedTokenHash,
          type: callbackType,
        })

        if (verifyError) {
          if (!cancelled) {
            setError(
              tx('auth.callback.errors.generic', FALLBACK.errors.generic)
            )
          }
          return
        }
      }

      for (let attempt = 0; attempt < SESSION_CHECK_ATTEMPTS; attempt += 1) {
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          router.replace(safeNext)
          router.refresh()
          return
        }

        await new Promise(resolve =>
          setTimeout(resolve, SESSION_CHECK_DELAY_MS)
        )
      }

      if (!cancelled) {
        if (
          callbackType === 'recovery' &&
          safeNext === '/auth/reset-password'
        ) {
          router.replace(safeNext)
          router.refresh()
          return
        }

        setError(
          tx(
            'auth.callback.errors.sessionMissing',
            FALLBACK.errors.sessionMissing
          )
        )
      }
    }

    // A rejected Supabase call (network/thrown, not resolved-with-error) must
    // still surface a message rather than leaving the page on its spinner.
    void handleCallback().catch(() => {
      if (!cancelled) {
        setError(tx('auth.callback.errors.generic', FALLBACK.errors.generic))
      }
    })

    return () => {
      cancelled = true
    }
    // Deliberately excludes tx/searchParams-derived values: the token is
    // one-time and handledRef ensures a single run; re-running on `t` identity
    // changes would double-consume it. See handledRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Logo variant="default" size="md" />
            </Link>
          </div>
          <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="default" size="md" />
          </Link>
        </div>

        <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
          {error ? (
            <div className="space-y-4">
              <div
                role="alert"
                className="p-3 bg-dental-error-light border border-dental-error/20 rounded-xl text-dental-error-dark text-sm"
              >
                {error}
              </div>
              <Link
                href="/auth/login"
                className="w-full inline-flex items-center justify-center py-3 px-4 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-semibold text-sm rounded-xl transition-all duration-200"
              >
                {tx('auth.callback.goToLogin', FALLBACK.goToLogin)}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-6 h-6 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-dental-muted">
                {tx('auth.callback.loading', FALLBACK.loading)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
