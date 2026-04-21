import { NextRequest, NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
  listMonobankWalletCards,
  deleteMonobankCard,
  isMonobankConfigured,
} from '@/lib/monobank'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function getAuthUser(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return { rateLimited: true, remaining, user: null }

  const userClient = await createUserClient()
  if (!userClient) return { rateLimited: false, user: null }
  const {
    data: { user },
  } = await userClient.auth.getUser()
  return { rateLimited: false, user }
}

// GET /api/payments/wallet — list saved cards for the current user
export async function GET(request: NextRequest) {
  const { rateLimited, remaining, user } = await getAuthUser(request)
  if (rateLimited) return rateLimitResponse(remaining!)
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  const svc = getServiceClient()
  if (!svc) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  // Sync from Monobank to get up-to-date maskedPan values
  if (isMonobankConfigured()) {
    const monoCards = await listMonobankWalletCards(user.id)

    if (monoCards.length > 0) {
      // Upsert all Monobank cards into our DB
      for (const card of monoCards) {
        await svc.from('patient_wallet_cards').upsert(
          {
            user_id: user.id,
            card_token: card.cardToken,
            masked_pan: card.maskedPan,
            country: card.country ?? null,
          },
          { onConflict: 'user_id,card_token' }
        )
      }

      // Remove DB cards that no longer exist in Monobank wallet
      const monoTokens = monoCards.map(c => c.cardToken)
      await svc
        .from('patient_wallet_cards')
        .delete()
        .eq('user_id', user.id)
        .not('card_token', 'in', `(${monoTokens.map(t => `"${t}"`).join(',')})`)
    } else {
      // Wallet is empty on Monobank side — clear our DB too
      await svc.from('patient_wallet_cards').delete().eq('user_id', user.id)
    }
  }

  const { data: cards, error } = await svc
    .from('patient_wallet_cards')
    .select('id, card_token, masked_pan, country, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    captureException(new Error('[wallet] Failed to fetch wallet cards'), {
      error,
      userId: user.id,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося отримати картки' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: cards ?? [] })
}

// DELETE /api/payments/wallet?cardToken=xxx — remove a saved card
export async function DELETE(request: NextRequest) {
  const { rateLimited, remaining, user } = await getAuthUser(request)
  if (rateLimited) return rateLimitResponse(remaining!)
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  const cardToken = request.nextUrl.searchParams.get('cardToken')
  if (!cardToken) {
    return NextResponse.json(
      { success: false, error: 'cardToken обовʼязковий' },
      { status: 400 }
    )
  }

  const svc = getServiceClient()
  if (!svc) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  // Verify the card belongs to this user
  const { data: card, error: findErr } = await svc
    .from('patient_wallet_cards')
    .select('id')
    .eq('user_id', user.id)
    .eq('card_token', cardToken)
    .single()

  if (findErr || !card) {
    return NextResponse.json(
      { success: false, error: 'Картку не знайдено' },
      { status: 404 }
    )
  }

  // Delete from Monobank
  const deleted = await deleteMonobankCard(cardToken)
  if (!deleted) {
    logger.warn('[wallet] Monobank card deletion failed', {
      cardToken,
      userId: user.id,
    })
  }

  // Always remove from our DB regardless of Monobank result
  const { error: deleteErr } = await svc
    .from('patient_wallet_cards')
    .delete()
    .eq('id', card.id)

  if (deleteErr) {
    captureException(new Error('[wallet] Failed to delete wallet card'), {
      deleteErr,
      cardId: card.id,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити картку' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
