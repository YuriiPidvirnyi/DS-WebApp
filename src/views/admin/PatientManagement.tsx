'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { Edit, Eye, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import AdminModal from './components/AdminModal'
import { formatDateTime } from './utils'

interface PatientRow {
  id: string
  first_name: string | null
  last_name: string | null
  patronymic: string | null
  phone: string | null
  email: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  medical_notes: string | null
  total_visits: number
  total_spent_uah: number
  created_at: string
  updated_at: string
}

type ModalMode = 'create' | 'edit' | 'view'

interface PatientFormState {
  first_name: string
  last_name: string
  patronymic: string
  phone: string
  email: string
  date_of_birth: string
  gender: string
  address: string
  medical_notes: string
}

const EMPTY_FORM: PatientFormState = {
  first_name: '',
  last_name: '',
  patronymic: '',
  phone: '',
  email: '',
  date_of_birth: '',
  gender: '',
  address: '',
  medical_notes: '',
}

const PATIENT_SELECT =
  'id, first_name, last_name, patronymic, phone, email, date_of_birth, gender, address, medical_notes, total_visits, total_spent_uah, created_at, updated_at'

export default function PatientManagement() {
  const { t, i18n } = useTranslation()
  const { preferences } = useAdminPreferences()
  const [rows, setRows] = useState<PatientRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)
  const [formState, setFormState] = useState<PatientFormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const locale =
    i18n.language === 'pl'
      ? 'pl-PL'
      : i18n.language === 'en'
        ? 'en-US'
        : 'uk-UA'

  const loadPatients = useCallback(
    async (silent = false) => {
      const supabase = createClient()
      if (!supabase) {
        setError(t('admin.patientManagement.errors.supabaseUnavailable'))
        setIsLoading(false)
        return
      }

      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        let query = supabase.from('patients').select(PATIENT_SELECT)

        const normalizedSearch = searchTerm
          .replace(/[%_',]/g, ' ')
          .trim()
          .slice(0, 100)

        if (normalizedSearch) {
          query = query.or(
            `first_name.ilike.%${normalizedSearch}%,last_name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%,email.ilike.%${normalizedSearch}%`
          )
        }

        const { data, error: queryError } = await query
          .order('created_at', { ascending: false })
          .limit(200)

        if (queryError) throw queryError

        setRows((data || []) as PatientRow[])
      } catch (loadError) {
        captureException(
          loadError instanceof Error ? loadError : new Error(String(loadError))
        )
        setError(t('admin.patientManagement.errors.loadFailed'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [searchTerm, t]
  )

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  const stats = useMemo(() => {
    const total = rows.length
    const totalVisits = rows.reduce((sum, r) => sum + r.total_visits, 0)
    const totalRevenue = rows.reduce((sum, r) => sum + r.total_spent_uah, 0)
    return { total, totalVisits, totalRevenue }
  }, [rows])

  const tableCellClass = preferences.compactTables ? 'px-3 py-2' : 'px-4 py-3'
  const tableHeadClass = `${tableCellClass} text-left text-xs font-semibold uppercase text-gray-500`
  const tableEmptyStateClass = `${
    preferences.compactTables ? 'px-3 py-6' : 'px-4 py-8'
  } text-center text-dental-text-light`

  const confirmIfNeeded = useCallback(
    (message: string) => {
      if (!preferences.confirmSensitiveActions) return true
      return window.confirm(message)
    },
    [preferences.confirmSensitiveActions]
  )

  const openCreateModal = () => {
    setModalMode('create')
    setEditingPatientId(null)
    setFormState(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEditModal = (row: PatientRow) => {
    setModalMode('edit')
    setEditingPatientId(row.id)
    setFormState({
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      patronymic: row.patronymic || '',
      phone: row.phone || '',
      email: row.email || '',
      date_of_birth: row.date_of_birth || '',
      gender: row.gender || '',
      address: row.address || '',
      medical_notes: row.medical_notes || '',
    })
    setIsModalOpen(true)
  }

  const openViewModal = (row: PatientRow) => {
    setModalMode('view')
    setEditingPatientId(row.id)
    setFormState({
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      patronymic: row.patronymic || '',
      phone: row.phone || '',
      email: row.email || '',
      date_of_birth: row.date_of_birth || '',
      gender: row.gender || '',
      address: row.address || '',
      medical_notes: row.medical_notes || '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
  }

  const savePatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const supabase = createClient()
    if (!supabase) return

    if (!formState.first_name.trim() || !formState.last_name.trim()) {
      setError(t('admin.patientManagement.errors.requiredFields'))
      return
    }

    const payload = {
      first_name: formState.first_name.trim(),
      last_name: formState.last_name.trim(),
      patronymic: formState.patronymic.trim() || null,
      phone: formState.phone.trim() || null,
      email: formState.email.trim() || null,
      date_of_birth: formState.date_of_birth || null,
      gender: formState.gender || null,
      address: formState.address.trim() || null,
      medical_notes: formState.medical_notes.trim() || null,
    }

    setIsSaving(true)
    setError(null)
    try {
      if (modalMode === 'create') {
        const { error: insertError } = await supabase
          .from('patients')
          .insert(payload)
        if (insertError) throw insertError
      } else {
        if (!editingPatientId) return
        const { error: updateError } = await supabase
          .from('patients')
          .update(payload)
          .eq('id', editingPatientId)
        if (updateError) throw updateError
      }

      setIsModalOpen(false)
      await loadPatients(true)
    } catch (saveError) {
      captureException(
        saveError instanceof Error ? saveError : new Error(String(saveError))
      )
      setError(t('admin.patientManagement.errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const deletePatient = async (id: string) => {
    if (
      !confirmIfNeeded(t('admin.patientManagement.confirmations.deletePatient'))
    )
      return

    const supabase = createClient()
    if (!supabase) return

    setIsUpdatingId(id)
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError

      if (preferences.autoRefreshLists) {
        await loadPatients(true)
        return
      }

      setRows(prev => prev.filter(row => row.id !== id))
    } catch (deleteError) {
      captureException(
        deleteError instanceof Error
          ? deleteError
          : new Error(String(deleteError))
      )
      setError(t('admin.patientManagement.errors.deleteFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  const viewingPatientRow = editingPatientId
    ? rows.find(r => r.id === editingPatientId)
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.patientManagement.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.patientManagement.totalPatients', {
              total: stats.total,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.patientManagement.newPatient')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadPatients(true)}
            isLoading={isRefreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.patientManagement.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.patientManagement.summary.total')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.patientManagement.summary.totalVisits')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">
            {stats.totalVisits}
          </p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.patientManagement.summary.totalRevenue')}
          </p>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalRevenue.toLocaleString(locale)} {t('cabinet.currency')}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dental-text-light" />
            <Input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder={t('admin.patientManagement.searchPlaceholder')}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-dental-secondary-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={tableHeadClass}>
                  {t('admin.patientManagement.table.headers.fullName')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.patientManagement.table.headers.phone')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.patientManagement.table.headers.email')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.patientManagement.table.headers.lastUpdated')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.patientManagement.table.headers.totalSpent')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.patientManagement.table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className={tableEmptyStateClass}>
                    {t('admin.patientManagement.table.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={tableEmptyStateClass}>
                    {t('admin.patientManagement.table.empty')}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id}>
                    <td className={tableCellClass}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-dental-teal/10 rounded-full flex items-center justify-center">
                          <span className="text-dental-teal font-semibold text-sm">
                            {(row.first_name || '?')[0]}
                            {(row.last_name || '?')[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-dental-dark">
                            {row.last_name} {row.first_name}
                          </p>
                          {row.patronymic && (
                            <p className="text-xs text-dental-text-light">
                              {row.patronymic}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className={`${tableCellClass} text-dental-text whitespace-nowrap`}
                    >
                      {row.phone || '—'}
                    </td>
                    <td
                      className={`${tableCellClass} text-dental-text-light whitespace-nowrap`}
                    >
                      {row.email || '—'}
                    </td>
                    <td
                      className={`${tableCellClass} text-xs text-dental-text-light whitespace-nowrap`}
                    >
                      {formatDateTime(row.updated_at)}
                    </td>
                    <td className={`${tableCellClass} whitespace-nowrap`}>
                      <span
                        className={`text-sm font-medium ${row.total_spent_uah > 0 ? 'text-green-600' : 'text-dental-text-light'}`}
                      >
                        {row.total_spent_uah.toLocaleString(locale)}{' '}
                        {t('cabinet.currency')}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(row)}
                          className="rounded-md border border-dental-secondary p-1.5 text-blue-600 hover:bg-blue-50"
                          aria-label={t(
                            'admin.patientManagement.table.actions.view'
                          )}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="rounded-md border border-dental-secondary p-1.5 text-dental-text hover:bg-dental-secondary-50"
                          aria-label={t(
                            'admin.patientManagement.table.actions.edit'
                          )}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePatient(row.id)}
                          disabled={isUpdatingId === row.id}
                          className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          aria-label={t(
                            'admin.patientManagement.table.actions.delete'
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        open={isModalOpen}
        title={
          modalMode === 'create'
            ? t('admin.patientManagement.modal.createTitle')
            : modalMode === 'edit'
              ? t('admin.patientManagement.modal.editTitle')
              : t('admin.patientManagement.modal.viewTitle')
        }
        subtitle={
          modalMode === 'view'
            ? undefined
            : t('admin.patientManagement.modal.subtitle')
        }
        onClose={closeModal}
      >
        {modalMode === 'view' ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.firstName')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.first_name || '—'}
                </p>
              </div>
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.lastName')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.last_name || '—'}
                </p>
              </div>
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.patronymic')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.patronymic || '—'}
                </p>
              </div>
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.phone')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.phone || '—'}
                </p>
              </div>
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.email')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.dateOfBirth')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.date_of_birth
                    ? new Date(formState.date_of_birth).toLocaleDateString(
                        locale
                      )
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.gender')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.gender || '—'}
                </p>
              </div>
              <div>
                <p className="text-dental-text-light">
                  {t('admin.patientManagement.form.address')}
                </p>
                <p className="font-medium text-dental-dark">
                  {formState.address || '—'}
                </p>
              </div>
            </div>
            {viewingPatientRow && (
              <div className="grid gap-4 md:grid-cols-2 border-t border-dental-secondary-200 pt-4">
                <div>
                  <p className="text-dental-text-light">
                    {t('admin.patientManagement.summary.totalVisits')}
                  </p>
                  <p className="font-medium text-dental-dark">
                    {viewingPatientRow.total_visits}
                  </p>
                </div>
                <div>
                  <p className="text-dental-text-light">
                    {t('admin.patientManagement.summary.totalRevenue')}
                  </p>
                  <p className="font-medium text-green-600">
                    {viewingPatientRow.total_spent_uah.toLocaleString(locale)}{' '}
                    {t('cabinet.currency')}
                  </p>
                </div>
              </div>
            )}
            {formState.medical_notes && (
              <div className="border-t border-dental-secondary-200 pt-4">
                <p className="text-dental-text-light mb-1">
                  {t('admin.patientManagement.form.medicalNotes')}
                </p>
                <p className="whitespace-pre-wrap text-dental-text">
                  {formState.medical_notes}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-dental-secondary-200 pt-4">
              <Button variant="outline" onClick={closeModal}>
                {t('common.close')}
              </Button>
              <Button
                onClick={() => {
                  setModalMode('edit')
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('admin.patientManagement.table.actions.edit')}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={event => void savePatient(event)}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label={t('admin.patientManagement.form.firstName')}
                value={formState.first_name}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    first_name: event.target.value,
                  }))
                }
                required
              />
              <Input
                label={t('admin.patientManagement.form.lastName')}
                value={formState.last_name}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    last_name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label={t('admin.patientManagement.form.patronymic')}
                value={formState.patronymic}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    patronymic: event.target.value,
                  }))
                }
              />
              <Input
                label={t('admin.patientManagement.form.phone')}
                type="tel"
                value={formState.phone}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label={t('admin.patientManagement.form.email')}
                type="email"
                value={formState.email}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
              <Input
                label={t('admin.patientManagement.form.dateOfBirth')}
                type="date"
                value={formState.date_of_birth}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    date_of_birth: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-dental-text">
                  {t('admin.patientManagement.form.gender')}
                </label>
                <Select
                  selectSize="compact"
                  fullWidth
                  value={formState.gender}
                  onChange={event =>
                    setFormState(prev => ({
                      ...prev,
                      gender: event.target.value,
                    }))
                  }
                  aria-label={t('admin.patientManagement.form.gender')}
                >
                  <option value="">—</option>
                  <option value="male">
                    {t('admin.patientManagement.form.genderOptions.male')}
                  </option>
                  <option value="female">
                    {t('admin.patientManagement.form.genderOptions.female')}
                  </option>
                  <option value="other">
                    {t('admin.patientManagement.form.genderOptions.other')}
                  </option>
                </Select>
              </div>
              <Input
                label={t('admin.patientManagement.form.address')}
                value={formState.address}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
              />
            </div>
            <Textarea
              label={t('admin.patientManagement.form.medicalNotes')}
              value={formState.medical_notes}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  medical_notes: event.target.value,
                }))
              }
              rows={4}
            />
            <div className="flex items-center justify-end gap-2 border-t border-dental-secondary-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {modalMode === 'create'
                  ? t('admin.patientManagement.form.create')
                  : t('admin.patientManagement.form.saveChanges')}
              </Button>
            </div>
          </form>
        )}
      </AdminModal>
    </div>
  )
}
