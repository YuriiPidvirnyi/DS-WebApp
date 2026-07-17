import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n/config'
import { createClient } from '@/lib/supabase/client'
import ConfirmPage from '../../../app/auth/confirm/page'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

const replaceMock = vi.fn()
const refreshMock = vi.fn()
let currentSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    replace: replaceMock,
    refresh: refreshMock,
  })),
  useSearchParams: vi.fn(() => ({
    get: (key: string) => currentSearchParams.get(key),
  })),
}))

const createClientMock = vi.mocked(createClient)
const t = i18n.t.bind(i18n)

describe('Auth confirm page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSearchParams = new URLSearchParams()
  })

  it('does NOT verify on load — only on explicit click (prefetch-safe)', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'abc123',
      type: 'recovery',
      next: '/auth/reset-password',
    })

    render(<ConfirmPage />)

    // A scanner/preview GET renders the page; the token must stay untouched.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: t('auth.confirm.recovery.submit') })
      ).toBeInTheDocument()
    )
    expect(verifyOtp).not.toHaveBeenCalled()
  })

  it('verifies token_hash and routes to next on click', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'abc123',
      type: 'recovery',
      next: '/auth/reset-password',
    })

    render(<ConfirmPage />)

    fireEvent.click(
      screen.getByRole('button', { name: t('auth.confirm.recovery.submit') })
    )

    await waitFor(() =>
      expect(verifyOtp).toHaveBeenCalledWith({
        token_hash: 'abc123',
        type: 'recovery',
      })
    )
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/auth/reset-password')
    )
  })

  it('defaults recovery to /auth/reset-password when next is missing', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'abc123',
      type: 'recovery',
    })

    render(<ConfirmPage />)
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.confirm.recovery.submit') })
    )

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/auth/reset-password')
    )
  })

  it('rejects an open-redirect next and falls back to a safe path', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'abc123',
      type: 'signup',
      next: 'https://evil.example.com',
    })

    render(<ConfirmPage />)
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.confirm.default.submit') })
    )

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/cabinet'))
  })

  it('rejects a protocol-relative open-redirect next (//evil.com)', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'abc123',
      type: 'recovery',
      next: '//evil.example.com',
    })

    render(<ConfirmPage />)
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.confirm.recovery.submit') })
    )

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/auth/reset-password')
    )
  })

  it('maps type=invite to /auth/reset-password', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'abc123',
      type: 'invite',
    })

    render(<ConfirmPage />)
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.confirm.recovery.submit') })
    )

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/auth/reset-password')
    )
  })

  it('disables the button while verifying (no double-submit)', async () => {
    let resolveVerify: (v: { error: null }) => void = () => {}
    const verifyOtp = vi.fn().mockReturnValue(
      new Promise(resolve => {
        resolveVerify = resolve
      })
    )
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'abc123',
      type: 'recovery',
    })

    render(<ConfirmPage />)
    const button = screen.getByRole('button', {
      name: t('auth.confirm.recovery.submit'),
    })
    fireEvent.click(button)

    // in-flight: button is disabled, a second click cannot re-trigger verify
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    fireEvent.click(screen.getByRole('button'))
    expect(verifyOtp).toHaveBeenCalledTimes(1)

    resolveVerify({ error: null })
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/auth/reset-password')
    )
  })

  it('shows an error when the token is already used/expired', async () => {
    const verifyOtp = vi
      .fn()
      .mockResolvedValue({ error: { message: 'Token has expired' } })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      token_hash: 'used',
      type: 'recovery',
    })

    render(<ConfirmPage />)
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.confirm.recovery.submit') })
    )

    await waitFor(() =>
      expect(
        screen.getByText(t('auth.confirm.errors.generic'))
      ).toBeInTheDocument()
    )
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('shows an invalid-link message when token_hash/type are absent', () => {
    createClientMock.mockReturnValue({
      auth: { verifyOtp: vi.fn() },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams()
    render(<ConfirmPage />)

    expect(
      screen.getByText(t('auth.confirm.errors.invalidLink'))
    ).toBeInTheDocument()
  })
})
