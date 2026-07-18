'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Shield, Pencil, Trash2, X, Check } from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useCSRF } from '@/hooks/useCSRF'
import { ADMIN_ROLES, hasPermission, type AdminRole } from '@/lib/permissions'
import { captureException } from '@/utils/sentry'
import { AsyncState, ErrorState, RoleBadge } from '@/components/ui'

interface AdminUserRow {
  id: string
  display_name: string | null
  role: AdminRole
  phone: string | null
  specialization: string | null
  doctor_id: string | null
  last_login_at: string | null
  created_at: string
}

interface EditDraft {
  id: string
  display_name: string
  role: AdminRole
  phone: string
  specialization: string
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAdminAuth()
  const { getHeaders } = useCSRF()

  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = user ? hasPermission(user.role, 'users:manage') : false
  const isSuperadmin = user?.role === 'superadmin'

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || t('common.error'))
      } else {
        setUsers(data.data)
      }
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (user && hasPermission(user.role, 'users:view')) {
      void fetchUsers()
    } else if (user) {
      router.replace('/admin')
    }
  }, [user, router, fetchUsers])

  const startEdit = (u: AdminUserRow) => {
    setEditDraft({
      id: u.id,
      display_name: u.display_name ?? '',
      role: u.role,
      phone: u.phone ?? '',
      specialization: u.specialization ?? '',
    })
  }

  const saveEdit = async () => {
    if (!editDraft) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editDraft.id}`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editDraft.display_name,
          role: editDraft.role,
          phone: editDraft.phone,
          specialization: editDraft.specialization,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || t('common.error'))
      } else {
        setUsers(prev =>
          prev.map(u => (u.id === editDraft.id ? { ...u, ...data.data } : u))
        )
        setEditDraft(null)
      }
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || t('common.error'))
      } else {
        setUsers(prev => prev.filter(u => u.id !== id))
        setDeleteConfirmId(null)
      }
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(t('common.error'))
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <AsyncState
        variant="loading"
        message={t('admin.users.loading')}
        className="my-8"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-dental-teal" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold text-dental-dark">
              {t('admin.users.title')}
            </h1>
            <p className="text-sm text-dental-muted mt-0.5">
              {t('admin.users.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && <ErrorState title={error} onRetry={() => void fetchUsers()} />}

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {ADMIN_ROLES.map(role => (
          <RoleBadge key={role} role={role} />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-dental-secondary-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dental-secondary-200">
            <thead className="bg-dental-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dental-muted uppercase tracking-wider">
                  {t('admin.users.columns.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dental-muted uppercase tracking-wider">
                  {t('admin.users.columns.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dental-muted uppercase tracking-wider hidden md:table-cell">
                  {t('admin.users.columns.specialization')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dental-muted uppercase tracking-wider hidden lg:table-cell">
                  {t('admin.users.columns.lastLogin')}
                </th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-dental-muted uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-dental-secondary-100">
              {users.map(u => {
                const isEditing = editDraft?.id === u.id
                const isCurrentUser = u.id === user?.id

                return (
                  <tr
                    key={u.id}
                    className={
                      isCurrentUser
                        ? 'bg-dental-primary/10'
                        : 'hover:bg-dental-secondary-50'
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.display_name}
                          onChange={e =>
                            setEditDraft(d =>
                              d ? { ...d, display_name: e.target.value } : d
                            )
                          }
                          className="w-full border border-dental-secondary-200 rounded-xl px-2 py-1 text-sm text-dental-dark focus:ring-dental-primary-500 focus:border-dental-primary-500"
                          aria-label={t('admin.users.columns.name')}
                        />
                      ) : (
                        <div className="text-sm font-medium text-dental-dark">
                          {u.display_name || '—'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-dental-muted">
                              ({t('admin.users.you')})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={editDraft.role}
                          onChange={e =>
                            setEditDraft(d =>
                              d
                                ? { ...d, role: e.target.value as AdminRole }
                                : d
                            )
                          }
                          className="border border-dental-secondary-200 rounded-xl px-2 py-1 text-sm text-dental-dark focus:ring-dental-primary-500 focus:border-dental-primary-500"
                          aria-label={t('admin.users.columns.role')}
                        >
                          {ADMIN_ROLES.filter(
                            r => r !== 'superadmin' || isSuperadmin
                          ).map(r => (
                            <option key={r} value={r}>
                              {t(`admin.roles.${r}`)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.specialization}
                          onChange={e =>
                            setEditDraft(d =>
                              d ? { ...d, specialization: e.target.value } : d
                            )
                          }
                          placeholder={t('admin.users.columns.specialization')}
                          className="w-full border border-dental-secondary-200 rounded-xl px-2 py-1 text-sm text-dental-dark focus:ring-dental-primary-500 focus:border-dental-primary-500"
                        />
                      ) : (
                        <span className="text-sm text-dental-text">
                          {u.specialization || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dental-muted hidden lg:table-cell">
                      {formatDate(u.last_login_at)}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="p-2 rounded-lg bg-status-success-100 text-status-success-700 hover:bg-dental-success/20 disabled:opacity-50 transition-colors"
                              aria-label={t('common.save')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditDraft(null)}
                              disabled={saving}
                              className="p-2 rounded-lg bg-dental-secondary-100 text-dental-text hover:bg-dental-secondary-200 transition-colors"
                              aria-label={t('common.cancel')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : deleteConfirmId === u.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-status-error-700 mr-1">
                              {t('admin.users.deleteConfirm')}
                            </span>
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={deleting}
                              className="p-2 rounded-lg bg-status-error-100 text-status-error-700 hover:bg-dental-error/20 disabled:opacity-50 transition-colors"
                              aria-label={t('common.confirm')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-2 rounded-lg bg-dental-secondary-100 text-dental-text hover:bg-dental-secondary-200 transition-colors"
                              aria-label={t('common.cancel')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(u)}
                              className="p-2 rounded-lg text-dental-text hover:bg-dental-secondary-100 transition-colors"
                              aria-label={t('common.edit')}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {isSuperadmin && !isCurrentUser && (
                              <button
                                onClick={() => setDeleteConfirmId(u.id)}
                                className="p-2 rounded-lg text-dental-error hover:bg-status-error-100 transition-colors"
                                aria-label={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-6 py-12 text-center text-dental-muted text-sm"
                  >
                    {t('admin.users.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-dental-muted">{t('admin.users.note')}</p>
    </div>
  )
}
