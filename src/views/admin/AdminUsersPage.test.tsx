import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// t echoes the key so assertions can match on i18n keys.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'uk' } }),
}))
vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    user: { id: 'u1', name: 'Test', role: 'superadmin', doctorId: null },
  }),
}))
vi.mock('@/hooks/useCSRF', () => ({
  useCSRF: () => ({ getHeaders: () => ({}) }),
}))
vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

import AdminUsersPage from './AdminUsersPage'

describe('AdminUsersPage — failed load', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Boom' }),
      })
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('shows the error card and suppresses the "no users" empty row', async () => {
    render(<AdminUsersPage />)
    // ErrorState renders its title (the error message) once the load fails.
    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument())
    // The contradictory empty-state message must NOT stack under the error.
    expect(screen.queryByText('admin.users.empty')).not.toBeInTheDocument()
  })
})
