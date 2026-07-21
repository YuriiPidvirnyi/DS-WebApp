import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// t echoes the key so assertions can match on i18n keys. initReactI18next is
// needed because ErrorBoundary (imported transitively) pulls in src/i18n/config,
// which calls i18next.use(initReactI18next) at module load.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'uk' } }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))
vi.mock('@/hooks/useAdminPreferences', () => ({
  useAdminPreferences: () => ({
    preferences: { defaultAnalyticsPeriod: 30 },
    updatePreferences: vi.fn(),
  }),
}))
vi.mock('@/hooks/useCSRF', () => ({
  useCSRF: () => ({ token: 'x'.repeat(40) }),
}))
vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))

import AdminAnalyticsPage from './AdminAnalyticsPage'

describe('AdminAnalyticsPage — failed load', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Boom')))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('shows only the error banner — no perpetual loading placeholder or content', async () => {
    render(<AdminAnalyticsPage />)
    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument())
    // The loading placeholder must not linger once the load has failed
    // (regression: it used to render forever because model stayed null).
    expect(
      screen.queryByText('admin.analyticsPage.loading')
    ).not.toBeInTheDocument()
    // And no model-dependent content should leak through.
    expect(
      screen.queryByText('admin.analyticsPage.cards.appointments')
    ).not.toBeInTheDocument()
  })
})
