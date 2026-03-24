import { createHash } from 'crypto'

const LIQPAY_API_URL = 'https://www.liqpay.ua/api/3/checkout'

export interface LiqPayConfig {
  publicKey: string
  privateKey: string
}

export interface LiqPayPaymentParams {
  orderId: string
  amount: number
  currency?: 'UAH' | 'USD' | 'EUR'
  description: string
  resultUrl?: string
  serverUrl?: string
  language?: 'uk' | 'en'
}

export interface LiqPayFormData {
  data: string
  signature: string
  checkoutUrl: string
}

function getConfig(): LiqPayConfig | null {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY
  const privateKey = process.env.LIQPAY_PRIVATE_KEY
  if (!publicKey || !privateKey) return null
  return { publicKey, privateKey }
}

function generateSignature(data: string, privateKey: string): string {
  const signString = `${privateKey}${data}${privateKey}`
  return createHash('sha1').update(signString).digest('base64')
}

export function createPaymentData(
  params: LiqPayPaymentParams
): LiqPayFormData | null {
  const config = getConfig()
  if (!config) return null

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.com.ua'

  const payload = {
    version: 3,
    public_key: config.publicKey,
    action: 'pay',
    amount: params.amount,
    currency: params.currency || 'UAH',
    description: params.description,
    order_id: params.orderId,
    result_url: params.resultUrl || `${siteUrl}/booking/success`,
    server_url: params.serverUrl || `${siteUrl}/api/payments/liqpay-callback`,
    language: params.language || 'uk',
  }

  const data = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = generateSignature(data, config.privateKey)

  return {
    data,
    signature,
    checkoutUrl: LIQPAY_API_URL,
  }
}

export function verifyCallback(data: string, signature: string): boolean {
  const config = getConfig()
  if (!config) return false

  const expectedSignature = generateSignature(data, config.privateKey)
  return signature === expectedSignature
}

export function decodeCallbackData(
  data: string
): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

export function isConfigured(): boolean {
  return getConfig() !== null
}
