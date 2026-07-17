import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n/config'
import { createClient } from '@/lib/supabase/client'
import LoginPage from '../../../app/auth/login/page'
import SignUpPage from '../../../app/auth/sign-up/page'
import ForgotPasswordPage from '../../../app/auth/forgot-password/page'
import ResetPasswordPage from '../../../app/auth/reset-password/page'
import AuthCallbackPage from '../../../app/auth/callback/page'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

const pushMock = vi.fn()
const replaceMock = vi.fn()
const refreshMock = vi.fn()
let currentSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: pushMock,
    replace: replaceMock,
    refresh: refreshMock,
  })),
  useSearchParams: vi.fn(() => ({
    get: (key: string) => currentSearchParams.get(key),
  })),
}))

const createClientMock = vi.mocked(createClient)
const t = i18n.t.bind(i18n)

describe('Auth pages smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSearchParams = new URLSearchParams()
  })

  it('shows invalid credentials error on login failure', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    createClientMock.mockReturnValue({
      auth: {
        signInWithPassword,
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(t('auth.login.emailLabel')), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(t('auth.login.passwordLabel')), {
      target: { value: 'Secret123!' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.login.submit') })
    )

    await waitFor(() =>
      expect(
        screen.getByText(t('auth.login.errors.invalidCredentials'))
      ).toBeInTheDocument()
    )
  })

  it('sends reset password email with callback redirect', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null })

    createClientMock.mockReturnValue({
      auth: {
        resetPasswordForEmail,
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<ForgotPasswordPage />)

    fireEvent.change(
      screen.getByLabelText(t('auth.forgotPassword.emailLabel')),
      {
        target: { value: 'patient@example.com' },
      }
    )
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.forgotPassword.submit') })
    )

    await waitFor(() =>
      expect(resetPasswordForEmail).toHaveBeenCalledWith(
        'patient@example.com',
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        }
      )
    )

    expect(
      screen.getByText(t('auth.forgotPassword.successTitle'))
    ).toBeInTheDocument()
  })

  it('handles anti-enumeration signup response for existing user', async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: {
        user: {
          identities: [],
        },
        session: null,
      },
      error: null,
    })

    createClientMock.mockReturnValue({
      auth: {
        signUp,
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<SignUpPage />)

    fireEvent.change(screen.getByLabelText(t('auth.signUp.firstName')), {
      target: { value: 'Іван' },
    })
    fireEvent.change(screen.getByLabelText(t('auth.signUp.lastName')), {
      target: { value: 'Тест' },
    })
    fireEvent.change(screen.getByLabelText(t('auth.signUp.phone')), {
      target: { value: '671234567' },
    })
    fireEvent.change(screen.getByLabelText(t('auth.signUp.emailLabel')), {
      target: { value: 'patient@example.com' },
    })
    fireEvent.change(screen.getByLabelText(t('auth.signUp.passwordLabel')), {
      target: { value: 'Secret123!' },
    })
    fireEvent.change(
      screen.getByLabelText(t('auth.signUp.confirmPasswordLabel')),
      {
        target: { value: 'Secret123!' },
      }
    )
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.signUp.submit') })
    )

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/cabinet`,
          }),
        })
      )
    )

    expect(
      screen.getByText(t('auth.signUp.errors.alreadyRegistered'))
    ).toBeInTheDocument()
  })

  it('updates password and redirects to login', async () => {
    const getSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const signOut = vi.fn().mockResolvedValue({ error: null })

    createClientMock.mockReturnValue({
      auth: {
        getSession,
        updateUser,
        signOut,
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<ResetPasswordPage />)

    await waitFor(() => expect(getSession).toHaveBeenCalled())

    fireEvent.change(
      screen.getByLabelText(t('auth.resetPassword.passwordLabel')),
      {
        target: { value: 'NewSecret123!' },
      }
    )
    fireEvent.change(
      screen.getByLabelText(t('auth.resetPassword.confirmPasswordLabel')),
      {
        target: { value: 'NewSecret123!' },
      }
    )
    fireEvent.click(
      screen.getByRole('button', { name: t('auth.resetPassword.submit') })
    )

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ password: 'NewSecret123!' })
    )

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/auth/login?passwordReset=success')
    )
  })

  it('exchanges code and redirects from auth callback', async () => {
    currentSearchParams = new URLSearchParams('code=test-code&next=%2Fcabinet')

    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    const getSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })

    createClientMock.mockReturnValue({
      auth: {
        exchangeCodeForSession,
        getSession,
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<AuthCallbackPage />)

    await waitFor(() =>
      expect(exchangeCodeForSession).toHaveBeenCalledWith('test-code')
    )
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/cabinet'))
  })

  it('routes a token_hash callback through the click-gated /auth/confirm', async () => {
    // token_hash arriving at the auto-verifying callback (old template, cached
    // link) must NOT be consumed on load — it is forwarded to the click gate.
    currentSearchParams = new URLSearchParams(
      'token=test-token&type=recovery&next=%2Fauth%2Freset-password'
    )

    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: { verifyOtp },
    } as unknown as ReturnType<typeof createClient>)

    render(<AuthCallbackPage />)

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        '/auth/confirm?token_hash=test-token&type=recovery&next=%2Fauth%2Freset-password'
      )
    )
    // crucially, the token is NOT verified on load
    expect(verifyOtp).not.toHaveBeenCalled()
  })

  it('sends an expired callback link to forgot-password', async () => {
    currentSearchParams = new URLSearchParams(
      'error=access_denied&error_code=otp_expired'
    )
    createClientMock.mockReturnValue({
      auth: { verifyOtp: vi.fn() },
    } as unknown as ReturnType<typeof createClient>)

    render(<AuthCallbackPage />)

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        '/auth/forgot-password?expired=1'
      )
    )
  })

  it('shows invalid-link message when callback token is missing', async () => {
    currentSearchParams = new URLSearchParams('next=%2Fauth%2Freset-password')

    render(<AuthCallbackPage />)

    await waitFor(() =>
      expect(
        screen.getByText(
          'Посилання для відновлення пошкоджене або неповне. Запросіть нове.'
        )
      ).toBeInTheDocument()
    )

    expect(createClientMock).not.toHaveBeenCalled()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
