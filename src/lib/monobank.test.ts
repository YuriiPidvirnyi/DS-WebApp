import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateKeyPairSync, createSign } from 'crypto'

/**
 * monobank.ts reads MONOBANK_TOKEN at module-evaluation time and keeps a
 * module-level pubkey cache, so each test sets env + resets modules and imports
 * a fresh copy.
 */

const ORIGINAL_TOKEN = process.env.MONOBANK_TOKEN

async function loadModule(token: string | undefined) {
  vi.resetModules()
  if (token === undefined) {
    delete process.env.MONOBANK_TOKEN
  } else {
    process.env.MONOBANK_TOKEN = token
  }
  return import('./monobank')
}

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.MONOBANK_TOKEN
  } else {
    process.env.MONOBANK_TOKEN = ORIGINAL_TOKEN
  }
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isMonobankConfigured', () => {
  it('is true when the token is set', async () => {
    const mod = await loadModule('test-token')
    expect(mod.isMonobankConfigured()).toBe(true)
  })

  it('is false when the token is missing', async () => {
    const mod = await loadModule(undefined)
    expect(mod.isMonobankConfigured()).toBe(false)
  })
})

describe('createMonobankInvoice', () => {
  const params = {
    appointmentId: 'appt-1',
    amountKopecks: 50000,
    description: 'Consultation',
    redirectUrl: 'https://example.com/ok',
    webHookUrl: 'https://example.com/hook',
  }

  it('throws when not configured', async () => {
    const mod = await loadModule(undefined)
    await expect(mod.createMonobankInvoice(params)).rejects.toThrow(
      /MONOBANK_TOKEN is not configured/
    )
  })

  it('posts to monobank and returns invoice id + page url', async () => {
    const mod = await loadModule('test-token')
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        invoiceId: 'inv-42',
        pageUrl: 'https://pay/inv-42',
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await mod.createMonobankInvoice(params)

    expect(result).toEqual({
      invoiceId: 'inv-42',
      pageUrl: 'https://pay/inv-42',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['X-Token']).toBe(
      'test-token'
    )
    const body = JSON.parse(init.body as string)
    expect(body.amount).toBe(50000)
    expect(body.ccy).toBe(980)
    expect(body.merchantPaymInfo.reference).toBe('appt-1')
  })

  it('throws with status + body when monobank responds with an error', async () => {
    const mod = await loadModule('test-token')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'invalid amount',
      }))
    )

    await expect(mod.createMonobankInvoice(params)).rejects.toThrow(
      /Monobank invoice creation failed \(400\): invalid amount/
    )
  })
})

describe('verifyMonobankWebhook', () => {
  // ECDSA P-256 keypair shared across the signing/verifying paths.
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  })
  const pubkeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
  // Monobank serves the pubkey as base64(PEM).
  const pubkeyBase64 = Buffer.from(pubkeyPem, 'utf8').toString('base64')

  function sign(body: Buffer): string {
    const signer = createSign('SHA256')
    signer.update(body)
    return signer.sign(privateKey).toString('base64')
  }

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ key: pubkeyBase64 }),
      }))
    )
  })

  it('returns true for a valid signature', async () => {
    const mod = await loadModule('test-token')
    const body = Buffer.from(
      JSON.stringify({ invoiceId: 'inv-1', status: 'success' })
    )
    expect(await mod.verifyMonobankWebhook(body, sign(body))).toBe(true)
  })

  it('returns false for a tampered body', async () => {
    const mod = await loadModule('test-token')
    const body = Buffer.from(
      JSON.stringify({ invoiceId: 'inv-1', status: 'success' })
    )
    const signature = sign(body)
    const tampered = Buffer.from(
      JSON.stringify({ invoiceId: 'inv-1', status: 'failure' })
    )
    expect(await mod.verifyMonobankWebhook(tampered, signature)).toBe(false)
  })

  it('returns false when the public key cannot be fetched', async () => {
    const mod = await loadModule('test-token')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500 }))
    )
    const body = Buffer.from('{}')
    expect(await mod.verifyMonobankWebhook(body, sign(body))).toBe(false)
  })

  it('returns false when the token is not configured', async () => {
    const mod = await loadModule(undefined)
    const body = Buffer.from('{}')
    expect(await mod.verifyMonobankWebhook(body, sign(body))).toBe(false)
  })
})
