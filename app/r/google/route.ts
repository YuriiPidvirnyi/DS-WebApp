import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/api-security'
import { googleReviewUrl, normalizeReviewSrc } from '@/utils/googleReview'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /r/google?src=<channel>
 *
 * Tracked redirect to the clinic's Google write-review form. Printed QR codes,
 * post-visit emails and the patient cabinet all point here so each channel's
 * clicks are countable (review_link_clicks) and the destination can change
 * without reprinting anything. The redirect must never fail because of
 * logging — tracking is strictly best-effort.
 */
export async function GET(request: NextRequest) {
  const src = normalizeReviewSrc(request.nextUrl.searchParams.get('src'))

  // Rate-limit the click LOGGING only (an unauthenticated GET is trivially
  // scriptable and would skew the funnel numbers) — the redirect always works.
  const logAllowed = await checkRateLimit(request, 30, 60_000)
    .then(result => result.allowed)
    .catch(() => true)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (logAllowed && url && key) {
    try {
      const supabase = createClient(url, key)
      const { error } = await supabase.from('review_link_clicks').insert({
        src,
        user_agent: request.headers.get('user-agent')?.slice(0, 256) ?? null,
      })
      if (error) {
        logger.warn('[r/google] click log failed:', { data: error.message })
      }
    } catch (err) {
      logger.warn('[r/google] click log failed:', {
        data: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.redirect(googleReviewUrl(), 302)
}
