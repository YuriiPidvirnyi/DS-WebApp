import { createVerify } from 'crypto'

const MONOBANK_TOKEN = process.env.MONOBANK_TOKEN
const MONOBANK_PUBKEY_URL = 'https://api.monobank.ua/api/merchant/pubkey'
const MONOBANK_INVOICE_URL =
  'https://api.monobank.ua/api/merchant/invoice/create'

export interface MonobankInvoiceParams {
  appointmentId: string
  amountKopecks: number
  description: string
  redirectUrl: string
  webHookUrl: string
  validitySeconds?: number
}

export interface MonobankInvoiceResult {
  invoiceId: string
  pageUrl: string
}

export interface MonobankWebhookPayload {
  invoiceId: string
  status:
    | 'created'
    | 'processing'
    | 'hold'
    | 'success'
    | 'failure'
    | 'expired'
    | 'reversed'
  amount: number
  ccy: number
  reference: string
  finalAmount?: number
  createdDate: string
  modifiedDate: string
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
  try {
    const pubkeyBase64 = await getMonobankPublicKey()
    if (!pubkeyBase64) {
      return false
    }

    const pubkeyBuffer = Buffer.from(pubkeyBase64, 'base64')
    const signatureBuffer = Buffer.from(signature, 'base64')

    const verify = createVerify('ed25519')
    verify.update(body)
    return verify.verify(
      { key: pubkeyBuffer, format: 'der', type: 'spki' },
      signatureBuffer
    )
  } catch {
    return false
  }
}
