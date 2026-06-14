import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  sanitizeHTML,
  sanitizeUserInput,
  validatePattern,
  generateNonce,
  generateCSP,
  securityPatterns,
  csrfToken,
  rateLimiter,
  sessionManager,
  auditLogger,
  validators,
  getSecureHeaders,
} from './security'

describe('sanitizeUserInput', () => {
  it('escapes angle brackets, quotes, and backslashes', () => {
    expect(sanitizeUserInput('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    )
  })

  it('escapes single quotes', () => {
    expect(sanitizeUserInput("O'Brien")).toBe('O&#39;Brien')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeUserInput('  hello  ')).toBe('hello')
  })
})

describe('sanitizeHTML', () => {
  it('strips disallowed tags but keeps content', async () => {
    const out = await sanitizeHTML('<p>Hello</p><script>evil()</script>')
    expect(out).toContain('Hello')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('evil()')
  })

  it('preserves allowed formatting tags', async () => {
    const out = await sanitizeHTML('<strong>bold</strong>')
    expect(out).toBe('<strong>bold</strong>')
  })

  it('removes inline event handlers', async () => {
    const out = await sanitizeHTML('<a href="#" onclick="steal()">link</a>')
    expect(out).not.toContain('onclick')
    expect(out).toContain('link')
  })
})

describe('validatePattern', () => {
  it('returns true when the input matches', () => {
    expect(validatePattern('abc123', /^[a-z0-9]+$/)).toBe(true)
  })

  it('returns false when the input does not match', () => {
    expect(validatePattern('abc 123', /^[a-z0-9]+$/)).toBe(false)
  })
})

describe('generateNonce', () => {
  it('produces a 32-char hex string', () => {
    const nonce = generateNonce()
    expect(nonce).toMatch(/^[0-9a-f]{32}$/)
  })

  it('produces a different value on each call', () => {
    expect(generateNonce()).not.toBe(generateNonce())
  })
})

describe('generateCSP', () => {
  it('embeds the nonce into the script-src directive', () => {
    const csp = generateCSP('abc123')
    expect(csp).toContain("'nonce-abc123'")
  })

  it('collapses whitespace into a single-line policy', () => {
    const csp = generateCSP('n')
    expect(csp).not.toMatch(/\n/)
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
  })
})

describe('securityPatterns', () => {
  it('validates Ukrainian phone numbers', () => {
    expect(securityPatterns.phone.test('+380501234567')).toBe(true)
    expect(securityPatterns.phone.test('0501234567')).toBe(false)
  })

  it('validates emails', () => {
    expect(securityPatterns.email.test('a@b.com')).toBe(true)
    expect(securityPatterns.email.test('not-an-email')).toBe(false)
  })

  it('validates UUIDs', () => {
    expect(
      securityPatterns.uuid.test('123e4567-e89b-12d3-a456-426614174000')
    ).toBe(true)
    expect(securityPatterns.uuid.test('nope')).toBe(false)
  })

  it('rejects HTML via the noHtml pattern', () => {
    expect(securityPatterns.noHtml.test('clean text')).toBe(true)
    expect(securityPatterns.noHtml.test('<b>x</b>')).toBe(false)
  })
})

describe('csrfToken', () => {
  beforeEach(() => {
    csrfToken.clearToken()
    sessionStorage.clear()
  })

  it('generates and persists a 64-char token', () => {
    const token = csrfToken.generateToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(sessionStorage.getItem('csrf_token')).toBe(token)
  })

  it('validates a matching token and rejects others', () => {
    const token = csrfToken.generateToken()
    expect(csrfToken.validateToken(token)).toBe(true)
    expect(csrfToken.validateToken('wrong')).toBe(false)
  })

  it('attaches the token header to a request', () => {
    const token = csrfToken.generateToken()
    const headers = csrfToken.attachToRequest({
      Accept: 'application/json',
    }) as Record<string, string>
    expect(headers['X-CSRF-Token']).toBe(token)
    expect(headers.Accept).toBe('application/json')
  })

  it('reads an existing token from sessionStorage', () => {
    sessionStorage.setItem('csrf_token', 'persisted-token')
    expect(csrfToken.getToken()).toBe('persisted-token')
  })
})

describe('rateLimiter', () => {
  beforeEach(() => {
    rateLimiter.clear()
  })

  it('allows attempts under the limit and reports remaining', () => {
    const first = rateLimiter.check('user-1', 3, 60_000)
    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(2)
  })

  it('blocks once the limit is exceeded', () => {
    rateLimiter.check('user-2', 2, 60_000)
    rateLimiter.check('user-2', 2, 60_000)
    const blocked = rateLimiter.check('user-2', 2, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.resetAt).toBeGreaterThan(Date.now())
  })

  it('expires attempts outside the window', () => {
    vi.useFakeTimers()
    rateLimiter.check('user-3', 1, 1_000)
    vi.advanceTimersByTime(1_500)
    const afterWindow = rateLimiter.check('user-3', 1, 1_000)
    expect(afterWindow.allowed).toBe(true)
    vi.useRealTimers()
  })

  it('resets a single key', () => {
    rateLimiter.check('user-4', 1, 60_000)
    rateLimiter.reset('user-4')
    expect(rateLimiter.check('user-4', 1, 60_000).allowed).toBe(true)
  })
})

describe('sessionManager', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('creates a retrievable session', () => {
    sessionManager.createSession('user-7')
    const session = sessionManager.getSession()
    expect(session?.userId).toBe('user-7')
    expect(sessionManager.isValid()).toBe(true)
  })

  it('returns null when no session exists', () => {
    expect(sessionManager.getSession()).toBeNull()
    expect(sessionManager.isValid()).toBe(false)
  })

  it('destroys the session', () => {
    sessionManager.createSession('user-8')
    sessionManager.destroySession()
    expect(sessionManager.getSession()).toBeNull()
  })

  it('expires a session after the inactivity timeout', () => {
    vi.useFakeTimers()
    sessionManager.createSession('user-9')
    // SESSION_TIMEOUT is 30 minutes
    vi.advanceTimersByTime(31 * 60 * 1000)
    expect(sessionManager.getSession()).toBeNull()
    vi.useRealTimers()
  })
})

describe('auditLogger', () => {
  beforeEach(() => {
    auditLogger.clear()
    sessionStorage.clear()
  })

  it('records a log entry', () => {
    auditLogger.log('login', 'info')
    const logs = auditLogger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].action).toBe('login')
    expect(logs[0].severity).toBe('info')
  })

  it('filters logs by action and severity', () => {
    auditLogger.log('login', 'info')
    auditLogger.log('failed_login', 'warning')
    expect(auditLogger.getLogs({ action: 'login' })).toHaveLength(1)
    expect(auditLogger.getLogs({ severity: 'warning' })).toHaveLength(1)
  })

  it('filters logs by since timestamp', () => {
    auditLogger.log('a', 'info')
    const cutoff = Date.now() + 1
    auditLogger.getLogs({ since: cutoff }).forEach(log => {
      expect(log.timestamp).toBeGreaterThanOrEqual(cutoff)
    })
  })
})

describe('validators', () => {
  it('validates emails and phones', () => {
    expect(validators.email('a@b.com')).toBe(true)
    expect(validators.email('bad')).toBe(false)
    expect(validators.phone('+380501234567')).toBe(true)
    expect(validators.phone('123')).toBe(false)
  })

  it('validates URLs', () => {
    expect(validators.url('https://example.com')).toBe(true)
    expect(validators.url('not a url')).toBe(false)
  })

  it('evaluates password strength', () => {
    expect(validators.strongPassword('Abc123!@#').valid).toBe(true)
    const weak = validators.strongPassword('abc')
    expect(weak.valid).toBe(false)
    expect(weak.errors.length).toBeGreaterThan(0)
  })

  it('detects XSS attempts', () => {
    expect(validators.noXSS('plain')).toBe(true)
    expect(validators.noXSS('<img src=x>')).toBe(false)
  })
})

describe('getSecureHeaders', () => {
  it('returns the expected hardening headers', () => {
    const headers = getSecureHeaders()
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
  })
})

afterEach(() => {
  vi.useRealTimers()
})
