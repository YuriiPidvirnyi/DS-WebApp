/**
 * Security utilities for the application
 */
import DOMPurify from 'dompurify'

// Use dynamic import to ensure SSR compatibility
let purifyInstance: typeof DOMPurify | null = null

// Initialize DOMPurify in browser only
const initDOMPurify = async (): Promise<typeof DOMPurify> => {
  if (!purifyInstance) {
    // Dynamic import for better tree-shaking
    const domPurifyModule = await import('dompurify')
    purifyInstance = domPurifyModule.default
  }
  return purifyInstance
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHTML = async (html: string): Promise<string> => {
  try {
    const purify = await initDOMPurify()
    return purify.sanitize(html, {
      ALLOWED_TAGS: [
        'b',
        'i',
        'em',
        'strong',
        'a',
        'p',
        'br',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'code',
        'pre',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
      ADD_TAGS: [],
      WHOLE_DOCUMENT: false,
      SANITIZE_DOM: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      FORCE_BODY: false,
      SANITIZE_NAMED_PROPS: true,
      KEEP_CONTENT: true,
    })
  } catch (error) {
    console.error('HTML sanitization failed:', error)
    // If sanitization fails, return plain text
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

/**
 * Validate and sanitize user input
 * @param input String input from user
 * @returns Sanitized string
 */
export const sanitizeUserInput = (input: string): string => {
  // Basic sanitization for plain text inputs
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\\/g, '&#92;')
}

/**
 * Validate input against allowed patterns
 * @param input Input string to validate
 * @param pattern Regular expression pattern to test against
 * @returns True if valid, false otherwise
 */
export const validatePattern = (input: string, pattern: RegExp): boolean => {
  return pattern.test(input)
}

/**
 * Generate a random nonce for CSP
 * @returns Random nonce string
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Creates CSP headers for the application
 * @param nonce CSP nonce for inline scripts
 * @returns CSP header string
 */
export const generateCSP = (nonce: string): string => {
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://www.google-analytics.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.google-analytics.com;
    frame-src 'self' https://www.google.com https://maps.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Set of common security patterns for validation
 */
export const securityPatterns = {
  // Only allow letters, numbers, spaces, and common punctuation
  name: /^[a-zA-ZаА-яЯієїґІЄЇҐ0-9\s\-'.]{2,100}$/,
  // Valid email format
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Ukrainian phone format
  phone: /^\+?380\d{9}$/,
  // URL format
  // eslint-disable-next-line no-useless-escape
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  // No HTML or script tags
  noHtml: /^((?!<[^>]+>).)*$/,
  // UUID format
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
}

// CSRF Token Management
class CSRFTokenManager {
  private token: string | null = null
  private readonly TOKEN_KEY = 'csrf_token'
  private readonly TOKEN_HEADER = 'X-CSRF-Token'

  generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    this.token = Array.from(array, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('')
    sessionStorage.setItem(this.TOKEN_KEY, this.token)
    return this.token
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = sessionStorage.getItem(this.TOKEN_KEY)
    }
    return this.token
  }

  validateToken(token: string): boolean {
    return token === this.getToken()
  }

  attachToRequest(headers: HeadersInit = {}): HeadersInit {
    const token = this.getToken() || this.generateToken()
    return {
      ...headers,
      [this.TOKEN_HEADER]: token,
    }
  }

  clearToken(): void {
    this.token = null
    sessionStorage.removeItem(this.TOKEN_KEY)
  }
}

export const csrfToken = new CSRFTokenManager()

// Rate Limiting
class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  check(
    key: string,
    maxAttempts: number,
    windowMs: number
  ): {
    allowed: boolean
    remaining: number
    resetAt: number
  } {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    const validAttempts = attempts.filter(time => now - time < windowMs)

    if (validAttempts.length >= maxAttempts) {
      const oldestAttempt = validAttempts[0]
      const resetAt = oldestAttempt + windowMs

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      }
    }

    validAttempts.push(now)
    this.attempts.set(key, validAttempts)

    return {
      allowed: true,
      remaining: maxAttempts - validAttempts.length,
      resetAt: now + windowMs,
    }
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }

  clear(): void {
    this.attempts.clear()
  }
}

export const rateLimiter = new RateLimiter()

// Secure Session Management
interface SessionData {
  userId?: string
  createdAt: number
  lastActivity: number
  expiresAt: number
}

class SecureSessionManager {
  private readonly SESSION_KEY = 'secure_session'
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private readonly ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

  createSession(userId?: string): void {
    const now = Date.now()
    const session: SessionData = {
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.ABSOLUTE_TIMEOUT,
    }

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
  }

  getSession(): SessionData | null {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY)
      if (!stored) return null

      const session: SessionData = JSON.parse(stored)
      const now = Date.now()

      if (now > session.expiresAt) {
        this.destroySession()
        return null
      }

      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.destroySession()
        return null
      }

      session.lastActivity = now
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session))

      return session
    } catch {
      return null
    }
  }

  updateActivity(): void {
    const session = this.getSession()
    if (session) {
      session.lastActivity = Date.now()
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
    }
  }

  destroySession(): void {
    sessionStorage.removeItem(this.SESSION_KEY)
    csrfToken.clearToken()
  }

  isValid(): boolean {
    return this.getSession() !== null
  }
}

export const sessionManager = new SecureSessionManager()

// Audit Logging
interface AuditLog {
  id: string
  timestamp: number
  action: string
  userId?: string
  details?: Record<string, unknown>
  severity: 'info' | 'warning' | 'error' | 'critical'
}

class AuditLogger {
  private logs: AuditLog[] = []
  private readonly MAX_LOGS = 1000
  private readonly STORAGE_KEY = 'audit_logs'

  log(
    action: string,
    severity: AuditLog['severity'] = 'info',
    details?: Record<string, unknown>
  ): void {
    const session = sessionManager.getSession()

    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action,
      userId: session?.userId,
      details,
      severity,
    }

    this.logs.push(log)

    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift()
    }

    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.logs.slice(-100))
      )
    } catch {
      // Ignore storage errors
    }

    if (severity === 'critical' || severity === 'error') {
      console.error('[AUDIT]', log)
    }
  }

  getLogs(filter?: {
    action?: string
    severity?: AuditLog['severity']
    userId?: string
    since?: number
  }): AuditLog[] {
    let filtered = [...this.logs]

    if (filter?.action) {
      filtered = filtered.filter(log => log.action === filter.action)
    }
    if (filter?.severity) {
      filtered = filtered.filter(log => log.severity === filter.severity)
    }
    if (filter?.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId)
    }
    if (filter?.since !== undefined) {
      filtered = filtered.filter(log => log.timestamp >= filter.since!)
    }

    return filtered
  }

  clear(): void {
    this.logs = []
    localStorage.removeItem(this.STORAGE_KEY)
  }
}

export const auditLogger = new AuditLogger()

// Enhanced Input Validators
export const validators = {
  email: (email: string): boolean => {
    return securityPatterns.email.test(email)
  },

  phone: (phone: string): boolean => {
    return securityPatterns.phone.test(phone)
  },

  url: (url: string): boolean => {
    try {
      new URL(url)
      return securityPatterns.url.test(url)
    } catch {
      return false
    }
  },

  strongPassword: (
    password: string
  ): {
    valid: boolean
    errors: string[]
  } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Must be at least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Must contain number')
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Must contain special character')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  noXSS: (input: string): boolean => {
    return securityPatterns.noHtml.test(input)
  },
}

// Secure Headers
export function getSecureHeaders(): Record<string, string> {
  const nonce = generateNonce()
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': generateCSP(nonce),
  }
}

// Initialize security features
export function initSecurity(): void {
  // Generate CSRF token
  csrfToken.generateToken()

  // Create session
  sessionManager.createSession()

  // Track session activity
  document.addEventListener('click', () => sessionManager.updateActivity())
  document.addEventListener('keypress', () => sessionManager.updateActivity())

  // Log initialization
  auditLogger.log('security_initialized', 'info')
}

/**
 * Whether a post-auth `next` redirect target is a safe same-origin path.
 *
 * Accepts only absolute in-app paths ("/cabinet"). Rejects protocol-relative
 * ("//evil.com") and backslash-escaped ("/\\evil.com") forms that browsers
 * treat as cross-origin — the classic open-redirect vector on auth callbacks.
 */
export const isSafeInternalPath = (
  path: string | null | undefined
): boolean => {
  if (!path) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.startsWith('/\\') || path.startsWith('/%5C')) return false
  return true
}
