/**
 * Turnstile verification utility
 *
 * Client-side: sends the token to our own API route for server-side validation.
 * If Turnstile is not configured (no site key), verification is skipped.
 */

export interface TurnstileVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  error_codes?: string[]
  action?: string
  cdata?: string
}

/**
 * Verify a Turnstile token by calling our server-side verification endpoint.
 */
export async function verifyTurnstileToken(
  token: string
): Promise<TurnstileVerifyResponse> {
  if (!token) {
    return { success: false, error_codes: ['missing-token'] }
  }

  // If no site key is configured, skip verification (dev / CI)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  if (!siteKey) {
    return {
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: typeof window !== 'undefined' ? window.location.hostname : '',
    }
  }

  try {
    const res = await fetch('/api/turnstile/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) {
      return { success: false, error_codes: ['server-error'] }
    }

    return (await res.json()) as TurnstileVerifyResponse
  } catch {
    return { success: false, error_codes: ['network-error'] }
  }
}

/**
 * Verify token and throw a user-facing error on failure.
 */
export async function assertValidTurnstile(token: string): Promise<void> {
  const result = await verifyTurnstileToken(token)

  if (!result.success) {
    throw new Error('Перевірка CAPTCHA не пройдена. Спробуйте ще раз.')
  }
}
