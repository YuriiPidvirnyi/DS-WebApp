import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { requireRole, requirePermission } from './api-role-guard'
import type { GuardFail, GuardOk } from './api-role-guard'

const mockGetUser = vi.fn()
const mockCreateClient = vi.fn()
const mockGetAdminAccess = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  getAdminAccess: (...args: unknown[]) => mockGetAdminAccess(...args),
}))

const request = new NextRequest('http://localhost:3000/api/admin/anything')

function fakeSupabase() {
  return { auth: { getUser: mockGetUser } }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue(fakeSupabase())
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mockGetAdminAccess.mockResolvedValue({ role: 'admin', doctorId: null })
})

describe('requireRole', () => {
  it('returns 503 when supabase is unavailable', async () => {
    mockCreateClient.mockResolvedValue(null)
    const result = (await requireRole(request, ['admin'])) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(503)
  })

  it('returns 401 when there is no authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = (await requireRole(request, ['admin'])) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(401)
  })

  it('returns 403 when the user is not an admin member', async () => {
    mockGetAdminAccess.mockResolvedValue(null)
    const result = (await requireRole(request, ['admin'])) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(403)
  })

  it('returns 403 when the role is not allowed', async () => {
    mockGetAdminAccess.mockResolvedValue({ role: 'assistant', doctorId: null })
    const result = (await requireRole(request, [
      'admin',
      'superadmin',
    ])) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(403)
  })

  it('succeeds and returns identity when the role matches', async () => {
    mockGetAdminAccess.mockResolvedValue({ role: 'doctor', doctorId: 'doc-9' })
    const result = (await requireRole(request, ['doctor'])) as GuardOk
    expect(result.ok).toBe(true)
    expect(result.userId).toBe('user-1')
    expect(result.role).toBe('doctor')
    expect(result.doctorId).toBe('doc-9')
  })
})

describe('requirePermission', () => {
  it('returns 503 when supabase is unavailable', async () => {
    mockCreateClient.mockResolvedValue(null)
    const result = (await requirePermission(
      request,
      'analytics:view'
    )) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(503)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = (await requirePermission(
      request,
      'analytics:view'
    )) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(401)
  })

  it('returns 403 when not an admin member', async () => {
    mockGetAdminAccess.mockResolvedValue(null)
    const result = (await requirePermission(
      request,
      'analytics:view'
    )) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(403)
  })

  it('returns 403 when the role lacks the permission', async () => {
    // analyst cannot manage users
    mockGetAdminAccess.mockResolvedValue({ role: 'analyst', doctorId: null })
    const result = (await requirePermission(
      request,
      'users:manage'
    )) as GuardFail
    expect(result.ok).toBe(false)
    expect(result.response.status).toBe(403)
  })

  it('succeeds when the role holds the permission', async () => {
    mockGetAdminAccess.mockResolvedValue({ role: 'superadmin', doctorId: null })
    const result = (await requirePermission(request, 'users:manage')) as GuardOk
    expect(result.ok).toBe(true)
    expect(result.role).toBe('superadmin')
  })
})
