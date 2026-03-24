'use client'

import { useEffect, useState } from 'react'

const TOKEN_KEY = 'csrf_token'
const TOKEN_HEADER = 'X-CSRF-Token'

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hook for CSRF token management
 * Generates and manages CSRF tokens for form submissions
 */
export function useCSRF() {
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    // Check for existing token in sessionStorage
    let existingToken = sessionStorage.getItem(TOKEN_KEY)

    if (!existingToken) {
      existingToken = generateToken()
      sessionStorage.setItem(TOKEN_KEY, existingToken)
    }

    setToken(existingToken)
  }, [])

  /**
   * Refresh the CSRF token
   */
  const refreshToken = () => {
    const newToken = generateToken()
    sessionStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    return newToken
  }

  /**
   * Get headers with CSRF token attached
   */
  const getHeaders = (additionalHeaders: HeadersInit = {}): HeadersInit => {
    return {
      ...additionalHeaders,
      [TOKEN_HEADER]: token,
    }
  }

  /**
   * Validate a token against the stored token
   */
  const validateToken = (tokenToValidate: string): boolean => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY)
    return tokenToValidate === storedToken
  }

  return {
    token,
    tokenHeader: TOKEN_HEADER,
    refreshToken,
    getHeaders,
    validateToken,
  }
}

export default useCSRF
