import { createVerify } from 'crypto'

const MONOBANK_TOKEN = process.env.MONOBANK_TOKEN
const MONOBANK_BASE_URL = 'https://api.monobank.ua'
const MONOBANK_PUBKEY_URL = `${MONOBANK_BASE_URL}/api/merchant/pubkey`
const MONOBANK_INVOICE_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/create`
const MONOBANK_STATUS_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/status`
const MONOBANK_REMOVE_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/remove`
const MONOBANK_FINALIZE_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/finalize`
const MONOBANK_CANCEL_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/cancel`
const MONOBANK_FISCAL_URL = `${MONOBANK_BASE_URL}/api/merchant/invoice/fiscal-checks`
const MONOBANK_WALLET_URL = `${MONOBANK_BASE_URL}/api/merchant/wallet`
const MONOBANK_WALLET_CARD_URL = `${MONOBANK_BASE_URL}/api/merchant/wallet/card`
const MONOBANK_WALLET_PAY_URL = `${MONOBANK_BASE_URL}/api/merchant/wallet/payment`

export const HOLD_EXPIRY_DAYS = 9
export const HOLD_WARNING_DAYS = 8

// ── Fiscalization (пРРО) ────────────────────────────────────────────────────

export interface BasketDiscount {
  type: 'discount' | 'extra' // discount = знижка, extra = надбавка
  mode: 'value' | 'percent' // value = фіксована сума в копійках, percent = відсоток
  value: number
}

export interface BasketOrderItem {
  name: string
  qty: number // кількість (float, напр. 1.5 для 1.5 кг)
  sum: number // ціна за одиницю в копійках
  total: number // загальна сума (sum * qty) в копійках, до знижок
  code?: string // внутрішній код товару
  barcode?: string
  tax: number[] // [0]=без ПДВ, [1]=20%, [2]=7%, [3]=0%
  uktzed?: string // код УКТЗЕД
  header?: string // текст на початку рядка чека
  footer?: string // текст в кінці рядка чека
  discounts?: BasketDiscount[] // знижки/надбавки на конкретний товар
}

export interface BasketOrder {
  items: BasketOrderItem[]
  discounts?: BasketDiscount[] // знижки/надбавки на рівні кошика
  header?: string // текст на початку чека
  footer?: string // текст в кінці чека
}

/**
 * Розраховує фінальну суму платежу з урахуванням знижок на рівні кошика.
 * Знижки на рівні товарів вже враховані в item.total.
 */
export function calculateBasketAmount(basket: BasketOrder): number {
  const subtotal = basket.items.reduce((acc, item) => acc + item.total, 0)
  if (!basket.discounts?.length) return subtotal

  return basket.discounts.reduce((acc, d) => {
    const delta =
      d.mode === 'value' ? d.value : Math.round((acc * d.value) / 100)
    return d.type === 'discount' ? acc - delta : acc + delta
  }, subtotal)
}

// ── Invoice params ──────────────────────────────────────────────────────────

export interface MonobankInvoiceParams {
  appointmentId: string
  amountKopecks: number
  description: string
  redirectUrl: string
  webHookUrl: string
  validitySeconds?: number
  saveCardData?: { saveCard: boolean; walletId: string }
  paymentType?: 'debit' | 'hold'
  basket?: BasketOrder
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
    basket,
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
        ...(basket
          ? {
              basketOrder: basket.items,
              ...(basket.discounts ? { discounts: basket.discounts } : {}),
              ...(basket.header ? { header: basket.header } : {}),
              ...(basket.footer ? { footer: basket.footer } : {}),
            }
          : {}),
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
// Pass items ONLY when amount differs from original — required for updated fiscal receipt.
export async function finalizeMonobankInvoice(
  invoiceId: string,
  amount?: number,
  items?: BasketOrderItem[]
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
        ...(items?.length ? { items } : {}),
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

// Cancel / refund a FINALIZED (success) payment. Not for holds — holds auto-expire.
// Pass amount for partial refund; omit to refund the full amount.
// Pass items for the return fiscal receipt (required when пРРО is active).
export async function cancelMonobankPayment(
  invoiceId: string,
  amount?: number,
  items?: BasketOrderItem[]
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
        ...(items?.length ? { items } : {}),
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

// Fetch fiscal check URLs (PDF links) for a paid invoice.
// Returns array of URLs — send to customer via email/Telegram.
export async function getMonobankFiscalChecks(
  invoiceId: string
): Promise<string[]> {
  if (!MONOBANK_TOKEN) return []

  try {
    const url = new URL(MONOBANK_FISCAL_URL)
    url.searchParams.set('invoiceId', invoiceId)
    const response = await fetch(url.toString(), {
      headers: { 'X-Token': MONOBANK_TOKEN },
    })
    if (!response.ok) return []
    const data = (await response.json()) as { fiscalChecks: string[] }
    return data.fiscalChecks ?? []
  } catch {
    return []
  }
}

// Returns true when a hold is 8+ days old and close to Monobank's 9-day auto-expiry.
export function isHoldExpiringSoon(holdAt: string): boolean {
  const holdMs = Date.now() - new Date(holdAt).getTime()
  return holdMs >= HOLD_WARNING_DAYS * 24 * 60 * 60 * 1000
}

// ── Analytics / Statement ────────────────────────────────────────────────────

export interface StatementCancelItem {
  amount: number
  ccy: number
  date: string
  maskedPan: string
  approvalCode?: string
  rrn?: string
}

export interface StatementItem {
  invoiceId: string
  status: 'hold' | 'processing' | 'success' | 'failure'
  maskedPan: string
  date: string
  amount: number
  ccy: number
  profitAmount?: number
  reference?: string
  destination?: string
  approvalCode?: string
  rrn?: string
  paymentScheme: 'full' | 'bnpl_later_30' | 'bnpl_parts_4'
  shortQrId?: string | null
  cancelList: StatementCancelItem[]
}

export interface StatementSummary {
  period: { from: string; to: string }
  totalTransactions: number
  successful: {
    count: number
    grossAmount: number // sum of amount (what customer paid)
    netRevenue: number // sum of profitAmount (after bank commission)
    commission: number // grossAmount - netRevenue
  }
  refunded: {
    count: number // number of invoices with at least one cancel
    totalAmount: number // sum of all cancelList amounts
  }
  netAfterRefunds: number // successful.netRevenue - refunded.totalAmount
  holds: { count: number; amount: number }
  failed: { count: number; amount: number }
  byScheme: Record<string, { count: number; amount: number }>
}

export interface MerchantDetails {
  merchantId: string
  merchantName: string
  edrpou: string
}

const MONOBANK_STATEMENT_URL = `${MONOBANK_BASE_URL}/api/merchant/statement`
const MONOBANK_DETAILS_URL = `${MONOBANK_BASE_URL}/api/merchant/details`

/**
 * Fetch merchant transaction statement for a time period.
 * from/to are UTC unix timestamps (seconds). Monobank rate-limit: 1 req/sec.
 * For large date ranges that need splitting, call multiple times with 1 s delay.
 */
export async function getMonobankStatement(
  from: number,
  to?: number,
  code?: string
): Promise<StatementItem[]> {
  if (!MONOBANK_TOKEN) return []

  try {
    const url = new URL(MONOBANK_STATEMENT_URL)
    url.searchParams.set('from', String(from))
    if (to !== undefined) url.searchParams.set('to', String(to))
    if (code) url.searchParams.set('code', code)

    const response = await fetch(url.toString(), {
      headers: { 'X-Token': MONOBANK_TOKEN },
    })
    if (!response.ok) return []
    const data = (await response.json()) as { list: StatementItem[] }
    return data.list ?? []
  } catch {
    return []
  }
}

/** Get merchant profile (name, EDRPOU, merchantId). */
export async function getMonobankMerchantDetails(): Promise<MerchantDetails | null> {
  if (!MONOBANK_TOKEN) return null

  try {
    const response = await fetch(MONOBANK_DETAILS_URL, {
      headers: { 'X-Token': MONOBANK_TOKEN },
    })
    if (!response.ok) return null
    return (await response.json()) as MerchantDetails
  } catch {
    return null
  }
}

/**
 * Aggregate statement items into a revenue summary.
 * Pure function — safe to call with any slice of items.
 */
export function analyzeStatement(
  items: StatementItem[],
  from: Date,
  to: Date
): StatementSummary {
  const summary: StatementSummary = {
    period: { from: from.toISOString(), to: to.toISOString() },
    totalTransactions: items.length,
    successful: { count: 0, grossAmount: 0, netRevenue: 0, commission: 0 },
    refunded: { count: 0, totalAmount: 0 },
    netAfterRefunds: 0,
    holds: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    byScheme: {},
  }

  for (const item of items) {
    // Tally by payment scheme
    const scheme = item.paymentScheme ?? 'full'
    if (!summary.byScheme[scheme]) {
      summary.byScheme[scheme] = { count: 0, amount: 0 }
    }

    if (item.status === 'success') {
      summary.successful.count++
      summary.successful.grossAmount += item.amount
      summary.successful.netRevenue += item.profitAmount ?? item.amount
      summary.byScheme[scheme].count++
      summary.byScheme[scheme].amount += item.amount

      // Count refunds nested inside this successful transaction
      if (item.cancelList.length > 0) {
        summary.refunded.count++
        for (const cancel of item.cancelList) {
          summary.refunded.totalAmount += cancel.amount
        }
      }
    } else if (item.status === 'hold' || item.status === 'processing') {
      summary.holds.count++
      summary.holds.amount += item.amount
    } else if (item.status === 'failure') {
      summary.failed.count++
      summary.failed.amount += item.amount
    }
  }

  summary.successful.commission =
    summary.successful.grossAmount - summary.successful.netRevenue
  summary.netAfterRefunds =
    summary.successful.netRevenue - summary.refunded.totalAmount

  return summary
}
