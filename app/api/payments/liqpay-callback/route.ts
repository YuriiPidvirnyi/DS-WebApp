import { NextRequest, NextResponse } from 'next/server'
import { verifyCallback, decodeCallbackData, isConfigured } from '@/lib/liqpay'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Payment system not configured' },
      { status: 503 }
    )
  }

  let data: string
  let signature: string

  try {
    const formData = await request.formData()
    data = formData.get('data') as string
    signature = formData.get('signature') as string
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }

  if (!data || !signature) {
    return NextResponse.json(
      { success: false, error: 'Missing data or signature' },
      { status: 400 }
    )
  }

  if (!verifyCallback(data, signature)) {
    return NextResponse.json(
      { success: false, error: 'Invalid signature' },
      { status: 403 }
    )
  }

  const decoded = decodeCallbackData(data)
  if (!decoded) {
    return NextResponse.json(
      { success: false, error: 'Failed to decode callback data' },
      { status: 400 }
    )
  }

  const status = decoded.status as string
  const orderId = decoded.order_id as string

  try {
    if (['success', 'sandbox'].includes(status)) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (supabase && orderId) {
        await supabase
          .from('appointments')
          .update({ is_paid: true })
          .eq('id', orderId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
