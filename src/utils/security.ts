/**
 * Security utilities for the application
 */
import DOMPurify from 'dompurify';

// Use dynamic import to ensure SSR compatibility
let purifyInstance: typeof DOMPurify | null = null;

// Initialize DOMPurify in browser only
const initDOMPurify = async (): Promise<typeof DOMPurify> => {
  if (!purifyInstance) {
    // Dynamic import for better tree-shaking
    const domPurifyModule = await import('dompurify');
    purifyInstance = domPurifyModule.default;
  }
  return purifyInstance;
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHTML = async (html: string): Promise<string> => {
  try {
    const purify = await initDOMPurify();
    return purify.sanitize(html, {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
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
    });
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    // If sanitization fails, return plain text
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

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
    .replace(/\\/g, '&#92;');
};

/**
 * Validate input against allowed patterns
 * @param input Input string to validate
 * @param pattern Regular expression pattern to test against
 * @returns True if valid, false otherwise
 */
export const validatePattern = (input: string, pattern: RegExp): boolean => {
  return pattern.test(input);
};

/**
 * Generate a random nonce for CSP
 * @returns Random nonce string
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

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
  `.replace(/\s+/g, ' ').trim();
};

/**
 * Set of common security patterns for validation
 */
export const securityPatterns = {
  // Only allow alphanumeric, spaces, and common punctuation
  name: /^[\p{L}\p{N}\s\-\'.]{2,100}$/u,
  // Valid email format
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Ukrainian phone format
  phone: /^\+?380\d{9}$/,
  // URL format
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  // No HTML or script tags
  noHtml: /^((?!<[^>]+>).)*$/,
  // UUID format
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};