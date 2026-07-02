import { NextRequest, NextResponse } from 'next/server'
import { requireStockAdmin, isV2On, flagOff } from '@/lib/stock-helpers'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { logger } from '@/utils/logger'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 120, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const code = request.nextUrl.searchParams.get('code')?.trim()
  if (!code) {
    return NextResponse.json(
      { success: false, error: "code обов'язковий" },
      { status: 422 }
    )
  }

  // Search in both the legacy `barcode` text field and the `barcodes` array
  const { data, error } = await auth.supabase
    .from('materials')
    .select('*')
    .or(`barcode.eq.${code},barcodes.cs.{${code}}`)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('[stock/materials/by-barcode] GET error', {
      message: error.message,
    })
    captureException(new Error('[stock/materials/by-barcode] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка пошуку' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        error: 'Матеріал не знайдено',
        code: 'BARCODE_NOT_FOUND',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}
