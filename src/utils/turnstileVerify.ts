// Turnstile server verification utility
// This would normally be run server-side, but we're creating a client-side mock version
// that simulates the verification process for the demo

/**
 * The response from Cloudflare Turnstile verification
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
 * Verifies a Turnstile token with Cloudflare
 * In a real implementation, this would be done server-side
 * Here we're simulating the server verification in the client for demo purposes
 */
export async function verifyTurnstileToken(
  token: string
): Promise<TurnstileVerifyResponse> {
  // In a real implementation, this would be a fetch to the Cloudflare API from your server
  // The secret key should NEVER be exposed to the client

  // Check if we have a token
  if (!token) {
    return {
      success: false,
      error_codes: ['missing-token'],
    }
  }

  // Check if Turnstile is enabled in the environment
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
  if (!siteKey) {
    // If no site key is configured, we'll simulate a successful response
    console.log('Turnstile verification skipped (no site key configured)')
    return {
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: window.location.hostname,
    }
  }

  // Mock the server verification with high success rate (95%) for demo purposes
  const shouldSucceed = Math.random() < 0.95

  // Add a small delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 300))

  if (shouldSucceed) {
    return {
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: window.location.hostname,
    }
  } else {
    return {
      success: false,
      error_codes: ['invalid-token'],
    }
  }
}

/**
 * For demo purposes: Verify token and throw error if verification fails
 * In a real implementation, this would be similar but run on the server
 */
export async function assertValidTurnstile(token: string): Promise<void> {
  const result = await verifyTurnstileToken(token)

  if (!result.success) {
    throw new Error('Перевірка CAPTCHA не пройдена. Спробуйте ще раз.')
  }
}
