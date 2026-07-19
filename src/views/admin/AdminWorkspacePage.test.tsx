import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// t returns the key so assertions can match on i18n keys.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'uk' } }),
}))

// Mutable current user (role/doctorId varied per test).
let mockUser: {
  id: string
  name: string
  role: string
  doctorId: string | null
}
vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({ user: mockUser }),
}))
const mockConfirm = vi.fn().mockResolvedValue(true)
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({ confirm: mockConfirm, confirmDialog: null }),
}))
vi.mock('@/hooks/useCSRF', () => ({
  useCSRF: () => ({
    token: 'x'.repeat(40),
    refreshToken: () => 'x'.repeat(40),
  }),
}))
vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))
const showError = vi.fn()
const showSuccess = vi.fn()
vi.mock('@/utils/toast', () => ({
  showError: (m: string) => showError(m),
  showSuccess: (m: string) => showSuccess(m),
}))
vi.mock('./utils', () => ({
  formatCurrency: (v: number) => `${v} грн`,
  getJoinedFieldValue: (
    j: Record<string, unknown> | Record<string, unknown>[] | null,
    k: string,
    fb: string
  ) => {
    if (!j) return fb
    const o = Array.isArray(j) ? j[0] : j
    return (o?.[k] as string) ?? fb
  },
}))

const APPTS = [
  {
    id: 'a1',
    patient_id: 'p1',
    doctor_id: 'd1',
    patient_name: 'Іван Петренко',
    guest_name: null,
    appointment_date: '2026-07-19',
    appointment_time: '10:30:00',
    duration_minutes: 45,
    status: 'confirmed',
    services: { name_uk: 'Професійна гігієна' },
  },
  {
    id: 'a2',
    patient_id: null,
    doctor_id: 'd1',
    patient_name: null,
    guest_name: 'Гість Анонім',
    appointment_date: '2026-07-19',
    appointment_time: '12:00:00',
    duration_minutes: 30,
    status: 'pending',
    services: { name_uk: 'Консультація' },
  },
]
const SERVICES = [{ id: 's1', name_uk: 'Професійна гігієна', price_uah: 1800 }]

function makeBuilder(table: string) {
  const data = table === 'appointments' ? APPTS : SERVICES
  const b: Record<string, unknown> = {}
  b.select = () => b
  b.eq = () => b
  b.order = () => b
  b.then = (resolve: (v: { data: unknown; error: null }) => void) =>
    resolve({ data, error: null })
  return b
}
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: (table: string) => makeBuilder(table) }),
}))

import AdminWorkspacePage from './AdminWorkspacePage'

const doctor = {
  id: 'u1',
  name: 'др. Бондаренко',
  role: 'doctor',
  doctorId: 'd1',
}
const admin = { id: 'u2', name: 'Адмін', role: 'admin', doctorId: null }

describe('AdminWorkspacePage (2e doctor workstation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { ...doctor }
    global.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
  })

  it('renders the title', () => {
    render(<AdminWorkspacePage />)
    expect(screen.getByText('admin.workspacePage.title')).toBeInTheDocument()
  })

  it('shows the doctor-scope notice for a doctor', () => {
    render(<AdminWorkspacePage />)
    expect(
      screen.getByText('admin.appointmentsPage.doctorScopeNotice')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('admin.workspacePage.allAppointmentsNotice')
    ).not.toBeInTheDocument()
  })

  it('shows the "all appointments" notice for a non-doctor admin (review #1)', () => {
    mockUser = { ...admin }
    render(<AdminWorkspacePage />)
    expect(
      screen.getByText('admin.workspacePage.allAppointmentsNotice')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('admin.appointmentsPage.doctorScopeNotice')
    ).not.toBeInTheDocument()
  })

  it("lists today's appointments after load", async () => {
    render(<AdminWorkspacePage />)
    expect(await screen.findByText('Іван Петренко')).toBeInTheDocument()
    expect(screen.getByText('Гість Анонім')).toBeInTheDocument()
  })

  it('opens the act editor when a patient appointment is selected', async () => {
    render(<AdminWorkspacePage />)
    fireEvent.click(await screen.findByText('Іван Петренко'))
    await waitFor(() =>
      expect(
        screen.getByText('admin.workspacePage.saveDraft')
      ).toBeInTheDocument()
    )
    // doctor has treatments:sign → sign button present
    expect(screen.getByText('admin.workspacePage.signAct')).toBeInTheDocument()
  })

  it('shows the guest-no-act notice for a guest booking (no patient record)', async () => {
    render(<AdminWorkspacePage />)
    fireEvent.click(await screen.findByText('Гість Анонім'))
    await waitFor(() =>
      expect(
        screen.getByText('admin.workspacePage.guestNoAct')
      ).toBeInTheDocument()
    )
    expect(
      screen.queryByText('admin.workspacePage.saveDraft')
    ).not.toBeInTheDocument()
  })
})
