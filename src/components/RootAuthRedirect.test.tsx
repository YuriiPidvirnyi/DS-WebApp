import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RootAuthRedirect from './RootAuthRedirect'

const replaceMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: replaceMock })),
}))

const originalLocation = window.location

function setLocation(href: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: new URL(href),
  })
}

describe('RootAuthRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    })
  })

  it('forwards a token_hash recovery link on root to /auth/confirm', () => {
    setLocation(
      'https://app.example.com/?token_hash=abc&type=recovery&next=/auth/reset-password'
    )
    render(<RootAuthRedirect />)
    expect(replaceMock).toHaveBeenCalledWith(
      '/auth/confirm?token_hash=abc&type=recovery&next=%2Fauth%2Freset-password'
    )
  })

  it('forwards a PKCE code on root to /auth/callback', () => {
    setLocation('https://app.example.com/?code=xyz&type=recovery')
    render(<RootAuthRedirect />)
    const target = replaceMock.mock.calls[0][0] as string
    expect(target.startsWith('/auth/callback?')).toBe(true)
    expect(target).toContain('code=xyz')
    expect(target).toContain('next=%2Fauth%2Freset-password')
  })

  it('forwards implicit session tokens in the hash to /auth/callback', () => {
    setLocation(
      'https://app.example.com/#access_token=a&refresh_token=b&type=recovery'
    )
    render(<RootAuthRedirect />)
    const target = replaceMock.mock.calls[0][0] as string
    expect(target.startsWith('/auth/callback')).toBe(true)
  })

  it('sends an expired recovery error back to forgot-password', () => {
    setLocation(
      'https://app.example.com/?error=access_denied&error_code=otp_expired'
    )
    render(<RootAuthRedirect />)
    expect(replaceMock).toHaveBeenCalledWith('/auth/forgot-password?expired=1')
  })

  it('does nothing on a clean root', () => {
    setLocation('https://app.example.com/')
    render(<RootAuthRedirect />)
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('does nothing off the root route', () => {
    setLocation('https://app.example.com/services?code=xyz')
    render(<RootAuthRedirect />)
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
