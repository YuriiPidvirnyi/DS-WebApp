import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@/lib/supabase/client'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import i18n from '@/i18n/config'
import {
  listAdminAuditLogs,
  restoreFromAuditLog,
  type AdminAuditLog,
} from '@/lib/supabase/audit'
import AdminAppointmentsPage from './AdminAppointmentsPage'
import AdminContactsPage from './AdminContactsPage'
import AdminDoctorsPage from './AdminDoctorsPage'
import AdminReviewsPage from './AdminReviewsPage'
import AdminServicesPage from './AdminServicesPage'
import AdminSettingsPage from './AdminSettingsPage'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/hooks/useAdminPreferences', () => ({
  useAdminPreferences: vi.fn(),
}))

vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/audit', () => ({
  listAdminAuditLogs: vi.fn(),
  restoreFromAuditLog: vi.fn(),
}))

vi.mock('next/navigation', () => {
  const searchParams = { get: () => null }
  const router = { push: vi.fn() }

  return {
    useSearchParams: vi.fn(() => searchParams),
    useRouter: vi.fn(() => router),
  }
})

function createListBuilder<T>(rows: T[]) {
  const builder: Record<string, unknown> = {}
  const methods = ['order', 'limit', 'eq', 'or', 'gte', 'lte', 'lt']

  methods.forEach(method => {
    builder[method] = vi.fn(() => builder)
  })

  builder.then = (resolve: (value: { data: T[]; error: null }) => unknown) =>
    Promise.resolve({ data: rows, error: null as null }).then(resolve)

  return builder as {
    order: ReturnType<typeof vi.fn>
    limit: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    or: ReturnType<typeof vi.fn>
    gte: ReturnType<typeof vi.fn>
    lte: ReturnType<typeof vi.fn>
    lt: ReturnType<typeof vi.fn>
  }
}

const createClientMock = vi.mocked(createClient)
const useAdminPreferencesMock = vi.mocked(useAdminPreferences)
const useAdminAuthMock = vi.mocked(useAdminAuth)
const listAdminAuditLogsMock = vi.mocked(listAdminAuditLogs)
const restoreFromAuditLogMock = vi.mocked(restoreFromAuditLog)
const t = i18n.t.bind(i18n)

const DEFAULT_PREFS = {
  autoRefreshLists: false,
  compactTables: false,
  confirmSensitiveActions: false,
  defaultAnalyticsPeriod: 30 as const,
}

const DEFAULT_AUTH = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
}

describe('Admin pages UI smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAdminPreferencesMock.mockReturnValue({
      preferences: DEFAULT_PREFS,
      updatePreferences: vi.fn(),
    })
    useAdminAuthMock.mockReturnValue(DEFAULT_AUTH)
  })

  it('runs doctors toggle and bulk actions against Supabase', async () => {
    const doctorsRows = [
      {
        id: 'doctor-1',
        first_name: 'Іван',
        last_name: 'Петров',
        patronymic: null,
        specialization: 'Хірург',
        experience_years: 10,
        education: null,
        photo_url: null,
        bio: null,
        rating: 4.6,
        reviews_count: 12,
        is_active: true,
        updated_at: '2026-03-21T10:00:00.000Z',
      },
    ]
    const queryBuilder = createListBuilder(doctorsRows)
    const updateIn = vi.fn().mockResolvedValue({ error: null })
    const updateEq = vi.fn().mockResolvedValue({ error: null })

    createClientMock.mockReturnValue({
      from: (table: string) => {
        if (table !== 'doctors') throw new Error(`Unexpected table ${table}`)
        return {
          select: vi.fn(() => queryBuilder),
          update: vi.fn(() => ({ in: updateIn, eq: updateEq })),
        }
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<AdminDoctorsPage />)

    // dual-render: name appears in both desktop table and mobile card
    await screen.findAllByText('Петров Іван')

    fireEvent.click(
      screen.getAllByRole('button', {
        name: t('admin.doctorsPage.actions.deactivate'),
      })[0]
    )
    await waitFor(() => expect(updateEq).toHaveBeenCalledWith('id', 'doctor-1'))

    fireEvent.click(
      screen.getByLabelText(
        t('admin.doctorsPage.table.selectRowAria', { name: 'Петров Іван' })
      )
    )
    fireEvent.click(
      screen.getByRole('button', { name: t('admin.doctorsPage.bulk.apply') })
    )

    await waitFor(() =>
      expect(updateIn).toHaveBeenCalledWith('id', ['doctor-1'])
    )
  })

  it('runs services delete action against Supabase', async () => {
    const servicesRows = [
      {
        id: 'service-1',
        name_uk: 'Професійна чистка',
        name_en: null,
        name_pl: null,
        description_uk: null,
        description_en: null,
        description_pl: null,
        category: 'Гігієна',
        price_uah: 1800,
        duration_minutes: 45,
        image_url: null,
        is_active: true,
        updated_at: '2026-03-21T10:00:00.000Z',
      },
    ]
    const queryBuilder = createListBuilder(servicesRows)
    const deleteEq = vi.fn().mockResolvedValue({ error: null })

    createClientMock.mockReturnValue({
      from: (table: string) => {
        if (table !== 'services') throw new Error(`Unexpected table ${table}`)
        return {
          select: vi.fn(() => queryBuilder),
          delete: vi.fn(() => ({ eq: deleteEq })),
          update: vi.fn(() => ({ eq: vi.fn(), in: vi.fn() })),
        }
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<AdminServicesPage />)

    // dual-render: name appears in both desktop table and mobile card
    await screen.findAllByText('Професійна чистка')
    fireEvent.click(
      screen.getAllByLabelText(t('admin.servicesPage.actions.deleteAria'))[0]
    )

    await waitFor(() =>
      expect(deleteEq).toHaveBeenCalledWith('id', 'service-1')
    )
  })

  it('runs appointments bulk status update against Supabase', async () => {
    // Bulk-status controls are RBAC-gated on appointments:edit (Р1);
    // a real user on this page is an admin, so mock that role.
    useAdminAuthMock.mockReturnValue({
      ...DEFAULT_AUTH,
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        name: 'Admin',
        doctorId: null,
      },
      isAuthenticated: true,
    })
    const appointmentRows = [
      {
        id: 'appt-1',
        patient_name: 'Петро Тестовий',
        guest_name: null,
        guest_phone: '+380000000001',
        guest_email: 'petro@test.com',
        appointment_date: '2026-03-25',
        appointment_time: '10:30:00',
        status: 'pending' as const,
        source: 'manual',
        created_at: '2026-03-21T10:00:00.000Z',
        notes: null,
        services: { name_uk: 'Консультація' },
        doctors: { first_name: 'Іван', last_name: 'Петров' },
      },
    ]
    const queryBuilder = createListBuilder(appointmentRows)
    const updateIn = vi.fn().mockResolvedValue({ error: null })

    createClientMock.mockReturnValue({
      from: (table: string) => {
        if (table !== 'appointments')
          throw new Error(`Unexpected table ${table}`)
        return {
          select: vi.fn(() => queryBuilder),
          update: vi.fn(() => ({ in: updateIn, eq: vi.fn() })),
        }
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<AdminAppointmentsPage />)

    // dual-render: name appears in both desktop table and mobile card
    await screen.findAllByText('Петро Тестовий')
    fireEvent.click(
      screen.getByLabelText(
        t('admin.appointmentsPage.table.selectRowAria', {
          name: 'Петро Тестовий',
        })
      )
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: t('admin.appointmentsPage.bulk.apply'),
      })
    )

    await waitFor(() => expect(updateIn).toHaveBeenCalledWith('id', ['appt-1']))
  })

  it('runs reviews bulk moderation against Supabase', async () => {
    const reviewRows = [
      {
        id: 'review-1',
        name: 'Олена',
        rating: 5,
        service: 'Імплантація',
        doctor: 'Петров Іван',
        comment: 'Все супер',
        status: 'pending' as const,
        would_recommend: true,
        is_featured: false,
        created_at: '2026-03-21T10:00:00.000Z',
      },
    ]
    const queryBuilder = createListBuilder(reviewRows)
    const updateIn = vi.fn().mockResolvedValue({ error: null })

    createClientMock.mockReturnValue({
      from: (table: string) => {
        if (table !== 'reviews') throw new Error(`Unexpected table ${table}`)
        return {
          select: vi.fn(() => queryBuilder),
          update: vi.fn(() => ({ in: updateIn, eq: vi.fn() })),
        }
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<AdminReviewsPage />)

    await screen.findByText('Олена')
    fireEvent.click(
      screen.getByLabelText(
        t('admin.reviewsPage.card.selectAria', { name: 'Олена' })
      )
    )
    fireEvent.click(
      screen.getByRole('button', { name: t('admin.reviewsPage.bulk.apply') })
    )

    await waitFor(() =>
      expect(updateIn).toHaveBeenCalledWith('id', ['review-1'])
    )
  })

  it('runs contacts bulk processing against Supabase', async () => {
    const contactRows = [
      {
        id: 'contact-1',
        name: 'Марія',
        phone: '+380000000002',
        email: 'maria@test.com',
        message: 'Потрібна консультація',
        status: 'new',
        is_read: false,
        admin_notes: null,
        created_at: '2026-03-21T10:00:00.000Z',
      },
    ]
    const queryBuilder = createListBuilder(contactRows)
    const updateIn = vi.fn().mockResolvedValue({ error: null })

    createClientMock.mockReturnValue({
      from: (table: string) => {
        if (table !== 'contact_submissions') {
          throw new Error(`Unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => queryBuilder),
          update: vi.fn(() => ({ in: updateIn, eq: vi.fn() })),
        }
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<AdminContactsPage />)

    await screen.findByText('Марія')
    fireEvent.click(
      screen.getByLabelText(
        t('admin.contactsPage.card.selectAria', { name: 'Марія' })
      )
    )
    fireEvent.click(
      screen.getByRole('button', { name: t('admin.contactsPage.bulk.apply') })
    )

    await waitFor(() =>
      expect(updateIn).toHaveBeenCalledWith('id', ['contact-1'])
    )
  })

  it('runs rollback flow with reason and refreshes audit logs', async () => {
    const auditLog: AdminAuditLog = {
      id: 'audit-1',
      table_name: 'doctors',
      record_id: 'doctor-1',
      action: 'UPDATE',
      before_data: { is_active: true },
      after_data: { is_active: false },
      changed_by: 'admin-1',
      changed_at: '2026-03-21T10:00:00.000Z',
    }

    listAdminAuditLogsMock.mockResolvedValue([auditLog])
    restoreFromAuditLogMock.mockResolvedValue({
      restored: true,
      table: 'doctors',
      record_id: 'doctor-1',
      reverted_action: 'UPDATE',
    })

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        role: 'admin',
        display_name: 'Smoke Admin',
        created_at: '2026-03-20T10:00:00.000Z',
        last_login_at: null,
      },
      error: null,
    })

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'admin-1',
              email: 'admin@test.com',
              last_sign_in_at: '2026-03-21T09:00:00.000Z',
            },
          },
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      from: (table: string) => {
        if (table !== 'admin_users')
          throw new Error(`Unexpected table ${table}`)
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle,
            })),
          })),
        }
      },
    } as unknown as ReturnType<typeof createClient>)

    render(<AdminSettingsPage />)

    await screen.findByText(t('admin.settingsPage.audit.title'))
    await screen.findByText('doctor-1')

    fireEvent.click(
      screen.getByRole('button', {
        name: t('admin.settingsPage.audit.actions.rollback'),
      })
    )
    await screen.findByText(t('admin.settingsPage.rollback.modal.title'))

    const [rollbackReasonInput] = screen.getAllByRole('textbox')
    fireEvent.change(rollbackReasonInput, {
      target: { value: 'Невірна модерація запису' },
    })
    fireEvent.click(
      screen.getByRole('button', {
        name: t('admin.settingsPage.rollback.modal.confirm'),
      })
    )

    await waitFor(() =>
      expect(restoreFromAuditLogMock).toHaveBeenCalledWith(
        expect.any(Object),
        'audit-1',
        {
          reason: 'Невірна модерація запису',
          comment: undefined,
        }
      )
    )
    await waitFor(() =>
      expect(listAdminAuditLogsMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    )
  })
})
