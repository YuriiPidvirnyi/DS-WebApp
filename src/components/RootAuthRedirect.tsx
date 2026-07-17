'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isSafeInternalPath } from '@/utils/security'

/**
 * Defensive forwarder for auth links that land on the site root.
 *
 * Supabase overrides an email link's `redirect_to` with the project's Site URL
 * whenever the requested redirect isn't in the Redirect URLs allowlist. When
 * Site URL is the bare origin, a recovery/confirmation link then dumps the user
 * on `/` — where nothing exchanges the code or verifies the token — and the
 * reset silently fails.
 *
 * This runs only on the home route and, if it finds stray auth params in the
 * query or hash, forwards them to the proper handler so the flow still
 * completes. It is a safety net for links already sent / misconfigured
 * environments; correctly configured links go straight to /auth/confirm or
 * /auth/callback and never hit this.
 */
export default function RootAuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname !== '/') return

    const search = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(
      window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
    )

    const tokenHash = search.get('token_hash') || search.get('token')
    const type = search.get('type') || hash.get('type')
    const code = search.get('code')
    const hasSessionTokens =
      Boolean(hash.get('access_token')) && Boolean(hash.get('refresh_token'))
    const isRecoveryError =
      search.get('error_code') === 'otp_expired' ||
      search.get('error') === 'access_denied'

    // token_hash links → the click-gated confirm page (never auto-verify here)
    if (tokenHash && type) {
      const params = new URLSearchParams()
      params.set('token_hash', tokenHash)
      params.set('type', type)
      const next = search.get('next')
      if (isSafeInternalPath(next)) params.set('next', next as string)
      router.replace(`/auth/confirm?${params.toString()}`)
      return
    }

    // PKCE code or implicit session tokens → the callback exchanger
    if (code || hasSessionTokens) {
      const params = new URLSearchParams(window.location.search)
      if (!params.get('next') && type === 'recovery') {
        params.set('next', '/auth/reset-password')
      }
      const qs = params.toString()
      router.replace(
        `/auth/callback${qs ? `?${qs}` : ''}${window.location.hash}`
      )
      return
    }

    // An already-expired recovery link that bounced back to root with an error
    if (isRecoveryError) {
      router.replace('/auth/forgot-password?expired=1')
    }
  }, [router])

  return null
}
