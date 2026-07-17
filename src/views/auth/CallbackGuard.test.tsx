import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@/lib/supabase/client'
import AuthCallbackPage from '../../../app/auth/callback/page'

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }))

const replaceMock = vi.fn()
const refreshMock = vi.fn()
let currentSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: replaceMock, refresh: refreshMock })),
  useSearchParams: vi.fn(() => ({
    get: (key: string) => currentSearchParams.get(key),
  })),
}))

// i18n `ready: true` + a `t` whose identity we can change between renders,
// mimicking react-i18next swapping `t` when the en/pl bundle finishes loading.
let tIdentity = 0
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => {
    // new function identity each render to force the effect deps to change
    const t = ((k: string) => k) as unknown
    ;(t as { _id?: number })._id = tIdentity
    return { t, ready: true }
  }),
}))

const createClientMock = vi.mocked(createClient)

describe('Auth callback — one-time token consumption', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSearchParams = new URLSearchParams()
    tIdentity = 0
  })

  it('exchanges the code exactly once even when t identity changes (re-render)', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    const getSession = vi
      .fn()
      .mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })

    createClientMock.mockReturnValue({
      auth: { exchangeCodeForSession, getSession },
    } as unknown as ReturnType<typeof createClient>)

    currentSearchParams = new URLSearchParams({
      code: 'one-time-code',
      next: '/cabinet',
    })

    const { rerender } = render(<AuthCallbackPage />)

    await waitFor(() =>
      expect(exchangeCodeForSession).toHaveBeenCalledWith('one-time-code')
    )

    // Simulate the i18n bundle loading → new `t` identity → effect deps change.
    tIdentity = 1
    rerender(<AuthCallbackPage />)
    tIdentity = 2
    rerender(<AuthCallbackPage />)

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/cabinet'))
    // The already-consumed code must NOT be exchanged again.
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
  })
})
