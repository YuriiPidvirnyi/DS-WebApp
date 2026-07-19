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
    global.fetch = vi.fn().mockResolvedValue({
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

  // A method-aware fetch: the openAct lookup (GET) yields no existing act, POST
  // mints a new draft id, PATCH signs it. Lets us assert the real save/sign path
  // instead of the always-empty stub from beforeEach.
  function methodAwareFetch() {
    return vi.fn((_url: string, opts?: RequestInit) => {
      const method = opts?.method ?? 'GET'
      if (method === 'POST')
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ success: true, data: { id: 'act-new' } }),
        })
      if (method === 'PATCH')
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      // GET openAct lookup — patient has no prior act for this appointment.
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
    })
  }

  // Open a fresh act editor for the patient booking and pick service s1
  // (price 1800). Returns the fetch mock for call assertions.
  async function openActAndPickService() {
    const fetchMock = methodAwareFetch()
    global.fetch = fetchMock as unknown as typeof fetch
    render(<AdminWorkspacePage />)
    fireEvent.click(await screen.findByText('Іван Петренко'))
    const svc = await screen.findByLabelText(
      'admin.treatmentsPage.modal.service'
    )
    fireEvent.change(svc, { target: { value: 's1' } })
    return fetchMock
  }

  it('POSTs a new draft act with the patient/doctor/items payload on Save draft', async () => {
    const fetchMock = await openActAndPickService()
    fireEvent.click(screen.getByText('admin.workspacePage.saveDraft'))

    await waitFor(() => expect(showSuccess).toHaveBeenCalled())
    const post = fetchMock.mock.calls.find(
      ([u, o]) => u === '/api/treatment-records' && o?.method === 'POST'
    )
    expect(post).toBeTruthy()
    const body = JSON.parse((post![1] as RequestInit).body as string)
    expect(body.patientId).toBe('p1')
    expect(body.doctorId).toBe('d1')
    expect(body.items).toHaveLength(1)
    expect(body.items[0].serviceId).toBe('s1')
    expect(body.items[0].priceAtTime).toBe(1800)
    // No status transition on a draft save → no follow-up PATCH.
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'PATCH')).toBe(
      false
    )
  })

  it('POSTs then PATCHes status=signed when the sign is confirmed', async () => {
    const fetchMock = await openActAndPickService()
    fireEvent.click(screen.getByText('admin.workspacePage.signAct'))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([u, o]) =>
            typeof u === 'string' &&
            u.startsWith('/api/treatment-records/') &&
            o?.method === 'PATCH'
        )
      ).toBe(true)
    )
    expect(mockConfirm).toHaveBeenCalled()
    const patch = fetchMock.mock.calls.find(
      ([u, o]) =>
        typeof u === 'string' &&
        u.startsWith('/api/treatment-records/') &&
        o?.method === 'PATCH'
    )!
    // actId was set right after the POST (review #1) → PATCH targets the new id.
    expect(patch[0]).toBe('/api/treatment-records/act-new')
    expect(JSON.parse((patch[1] as RequestInit).body as string).status).toBe(
      'signed'
    )
  })

  it('clamps the displayed total to what gets billed (drop price<0, floor qty≥1)', async () => {
    await openActAndPickService()
    // service s1 → price 1800, qty 1 → total mirrors the billed 1800
    expect(await screen.findByText(/1800 грн/)).toBeInTheDocument()

    // A negative price is dropped from the total (never billed as a credit).
    const price = screen.getByLabelText('admin.treatmentsPage.modal.price')
    fireEvent.change(price, { target: { value: '-5' } })
    expect(screen.getByText(/(^|\s)0 грн/)).toBeInTheDocument()

    // qty below 1 is floored to 1 (matches linesToPayload), not zeroed.
    fireEvent.change(price, { target: { value: '1800' } })
    const qty = screen.getByLabelText('admin.treatmentsPage.modal.quantity')
    fireEvent.change(qty, { target: { value: '0' } })
    expect(screen.getByText(/1800 грн/)).toBeInTheDocument()
  })
})
