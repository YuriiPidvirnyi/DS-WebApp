import { createVerify } from 'crypto'

const MONOBANK_TOKEN = process.env.MONOBANK_TOKEN
const MONOBANK_BASE_URL = 'https://api.monobank.ua'
const MONOBANK_PUBKEY_URL = `${MONOBANK_BASE_URL}/api/merchant/pubkey`
const MONOBANK_INVOICE_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/create`
const MONOBANK_STATUS_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/status`
const MONOBANK_REMOVE_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/remove`
const MONOBANK_FINALIZE_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/finalize`
const MONOBANK_CANCEL_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/cancel`
const MONOBANK_WALLET_URL = `${MONOBANK_BASE_URL}/api/merchant/wallet`
const MONOBANK_WALLET_CARD_URL = `${MONOBANK_BASE_URL}/api/merchant/wallet/card`
const MONOBANK_WALLET_PAY_URL = `${MONOBANK_BASE_URL}/api/merchant/wallet/payment`

export const HOLD_EXPIRY_DAYS = 9
export const HOLD_WARNING_DAYS = 8

export interface MonobankInvoiceParams {
  appointmentId: string
  amountKopecks: number
  description: string
  redirectUrl: string
  webHookUrl: string
  validitySeconds?: number
  saveCardData?: { saveCard: boolean; walletId: string }
  paymentType?: 'debit' | 'hold'
}

export interface MonobankInvoiceResult {
  invoiceId: string
  pageUrl: string
}

export type MonobankInvoiceStatus =
  | 'created'
  | 'processing'
  | 'hold'
  | 'success'
  | 'failure'
  | 'expired'
  | 'reversed'

export interface MonobankWebhookPayload {
  invoiceId: string
  status: MonobankInvoiceStatus
  amount: number
  ccy: number
  reference: string
  finalAmount?: number
  createdDate: string
  modifiedDate: string
  walletData?: {
    cardToken: string
    walletId: string
    status: 'new' | 'created' | 'failed'
  }
}

export interface MonobankWalletCard {
  cardToken: string
  maskedPan: string
  country?: string
}

export interface MonobankWalletPaymentResult {
  invoiceId: string
  status: 'processing' | 'success' | 'failure'
  amount: number
  ccy: number
  failureReason?: string | null
  tdsUrl?: string | null
}

export interface MonobankInvoiceStatusResult {
  invoiceId: string
  status: MonobankInvoiceStatus
  amount: number
  ccy: number
  finalAmount?: number
  reference?: string
  errCode?: string
}

// Module-level pubkey cache
let cachedPubkey: string | null = null
let cachedPubkeyAt: number = 0
const PUBKEY_TTL_MS = 60 * 60 * 1000 // 1 hour

export function isMonobankConfigured(): boolean {
  return Boolean(MONOBANK_TOKEN)
}

export async function createMonobankInvoice(
  params: MonobankInvoiceParams
): Promise<MonobankInvoiceResult> {
  if (!MONOBANK_TOKEN) {
    throw new Error('MONOBANK_TOKEN is not configured')
  }

  const {
    appointmentId,
    amountKopecks,
    description,
    redirectUrl,
    webHookUrl,
    validitySeconds = 3600,
    saveCardData,
    paymentType,
  } = params

  const response = await fetch(MONOBANK_INVOICE_URL, {
    method: 'POST',
    headers: {
      'X-Token': MONOBANK_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountKopecks,
      ccy: 980,
      merchantPaymInfo: {
        reference: appointmentId,
        destination: description,
      },
      redirectUrl,
      webHookUrl,
      validity: validitySeconds,
      ...(paymentType ? { paymentType } : {}),
      ...(saveCardData ? { saveCardData } : {}),
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(
      `Monobank invoice creation failed (${response.status}): ${text}`
    )
  }

  const data = (await response.json()) as { invoiceId: string; pageUrl: string }
  return { invoiceId: data.invoiceId, pageUrl: data.pageUrl }
}

async function getMonobankPublicKey(): Promise<string | null> {
  if (!MONOBANK_TOKEN) {
    return null
  }

  const now = Date.now()
  if (cachedPubkey && now - cachedPubkeyAt < PUBKEY_TTL_MS) {
    return cachedPubkey
  }

  try {
    const response = await fetch(MONOBANK_PUBKEY_URL, {
      headers: { 'X-Token': MONOBANK_TOKEN },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as { key: string }
    cachedPubkey = data.key
    cachedPubkeyAt = now
    return cachedPubkey
  } catch {
    return null
  }
}

export async function verifyMonobankWebhook(
  body: Buffer,
  signature: string
): Promise<boolean> {
  const attemptVerify = async (): Promise<boolean> => {
    const pubkeyBase64 = await getMonobankPublicKey()
    if (!pubkeyBase64) return false
    // The key from monobank is base64(PEM), decode to get PEM text for ECDSA P-256
    const pubkeyPem = Buffer.from(pubkeyBase64, 'base64').toString('utf8')
    const verify = createVerify('SHA256')
    verify.update(body)
    return verify.verify(pubkeyPem, Buffer.from(signature, 'base64'))
  }

  try {
    const ok = await attemptVerify()
    if (ok) return true
    // Verification failed — key may have rotated, clear cache and retry once
    cachedPubkey = null
    cachedPubkeyAt = 0
    return attemptVerify()
  } catch {
    return false
  }
}

export async function checkMonobankInvoiceStatus(
  invoiceId: string
): Promise<MonobankInvoiceStatusResult | null> {
  if (!MONOBANK_TOKEN) return null

  try {
    const url = new URL(MONOBANK_STATUS_URL)
    url.searchParams.set('invoiceId', invoiceId)
    const response = await fetch(url.toString(), {
      headers: { 'X-Token': MONOBANK_TOKEN },
    })
    if (!response.ok) return null
    return (await response.json()) as MonobankInvoiceStatusResult
  } catch {
    return null
  }
}

export async function invalidateMonobankInvoice(
  invoiceId: string
): Promise<boolean> {
  if (!MONOBANK_TOKEN) return false

  try {
    const response = await fetch(MONOBANK_REMOVE_URL, {
      method: 'POST',
      headers: {
        'X-Token': MONOBANK_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceId }),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function listMonobankWalletCards(
  walletId: string
): Promise<MonobankWalletCard[]> {
  if (!MONOBANK_TOKEN) return []

  try {
    const url = new URL(MONOBANK_WALLET_URL)
    url.searchParams.set('walletId', walletId)
    const response = await fetch(url.toString(), {
      headers: { 'X-Token': MONOBANK_TOKEN },
    })
    if (!response.ok) return []
    const data = (await response.json()) as { wallet: MonobankWalletCard[] }
    return data.wallet ?? []
  } catch {
    return []
  }
}

export async function deleteMonobankCard(cardToken: string): Promise<boolean> {
  if (!MONOBANK_TOKEN) return false

  try {
    const url = new URL(MONOBANK_WALLET_CARD_URL)
    url.searchParams.set('cardToken', cardToken)
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { 'X-Token': MONOBANK_TOKEN },
    })
    return response.ok
  } catch {
    return false
  }
}

export async function payWithCardToken(params: {
  cardToken: string
  appointmentId: string
  amountKopecks: number
  description: string
  redirectUrl: string
  webHookUrl: string
}): Promise<MonobankWalletPaymentResult | null> {
  if (!MONOBANK_TOKEN) return null

  try {
    const response = await fetch(MONOBANK_WALLET_PAY_URL, {
      method: 'POST',
      headers: {
        'X-Token': MONOBANK_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardToken: params.cardToken,
        amount: params.amountKopecks,
        ccy: 980,
        initiationKind: 'client',
        merchantPaymInfo: {
          reference: params.appointmentId,
          destination: params.description,
        },
        redirectUrl: params.redirectUrl,
        webHookUrl: params.webHookUrl,
      }),
    })
    if (!response.ok) return null
    return (await response.json()) as MonobankWalletPaymentResult
  } catch {
    return null
  }
}

// Finalize a held invoice (capture funds). Returns true on success.
// Pass amount for partial capture; omit to capture the full held amount.
export async function finalizeMonobankInvoice(
  invoiceId: string,
  amount?: number
): Promise<boolean> {
  if (!MONOBANK_TOKEN) return false

  try {
    const response = await fetch(MONOBANK_FINALIZE_URL, {
      method: 'POST',
      headers: {
        'X-Token': MONOBANK_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId,
        ...(amount !== undefined ? { amount } : {}),
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

// Cancel / refund a FINALIZED (success) payment. Not for holds — holds auto-expire.
// Pass amount for partial refund; omit to refund the full amount.
export async function cancelMonobankPayment(
  invoiceId: string,
  amount?: number
): Promise<boolean> {
  if (!MONOBANK_TOKEN) return false

  try {
    const response = await fetch(MONOBANK_CANCEL_URL, {
      method: 'POST',
      headers: {
        'X-Token': MONOBANK_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId,
        ...(amount !== undefined ? { amount } : {}),
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

// Returns true when a hold is 8+ days old and close to Monobank's 9-day auto-expiry.
export function isHoldExpiringSoon(holdAt: string): boolean {
  const holdMs = Date.now() - new Date(holdAt).getTime()
  return holdMs >= HOLD_WARNING_DAYS * 24 * 60 * 60 * 1000
}
