'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import { TableSkeleton } from '@/components/ui'
import AdminModal from './components/AdminModal'
import { formatDateTime, getStatusTone } from './utils'

interface DoctorRow {
  id: string
  first_name: string
  last_name: string
  patronymic: string | null
  specialization: string
  experience_years: number | null
  education: string | null
  photo_url: string | null
  bio: string | null
  rating: number | null
  reviews_count: number | null
  is_active: boolean
  updated_at: string
}

type DoctorModalMode = 'create' | 'edit'

interface DoctorFormState {
  first_name: string
  last_name: string
  patronymic: string
  specialization: string
  experience_years: string
  education: string
  photo_url: string
  bio: string
  is_active: boolean
}

const EMPTY_FORM: DoctorFormState = {
  first_name: '',
  last_name: '',
  patronymic: '',
  specialization: '',
  experience_years: '0',
  education: '',
  photo_url: '',
  bio: '',
  is_active: true,
}

const DOCTOR_SELECT =
  'id, first_name, last_name, patronymic, specialization, experience_years, education, photo_url, bio, rating, reviews_count, is_active, updated_at'

export default function AdminDoctorsPage() {
  const { t } = useTranslation()
  const { preferences } = useAdminPreferences()
  const [rows, setRows] = useState<DoctorRow[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [bulkStatus, setBulkStatus] = useState<'active' | 'inactive'>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<DoctorModalMode>('create')
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
  const [formState, setFormState] = useState<DoctorFormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const loadDoctors = useCallback(
    async (silent = false) => {
      const supabase = createClient()
      if (!supabase) {
        setError(t('admin.doctorsPage.errors.supabaseUnavailable'))
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
        let query = supabase.from('doctors').select(DOCTOR_SELECT)

        if (statusFilter === 'active') {
          query = query.eq('is_active', true)
        } else if (statusFilter === 'inactive') {
          query = query.eq('is_active', false)
        }

        const normalizedSearch = searchTerm
          .replace(/[%_',]/g, ' ')
          .trim()
          .slice(0, 100)

        if (normalizedSearch) {
          query = query.or(
            `first_name.ilike.%${normalizedSearch}%,last_name.ilike.%${normalizedSearch}%,specialization.ilike.%${normalizedSearch}%`
          )
        }

        const { data, error: queryError } = await query
          .order('is_active', { ascending: false })
          .order('experience_years', { ascending: false })
          .limit(400)

        if (queryError) throw queryError

        setRows((data || []) as DoctorRow[])
      } catch (loadError) {
        captureException(
          loadError instanceof Error ? loadError : new Error(String(loadError))
        )
        setError(t('admin.doctorsPage.errors.loadFailed'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [searchTerm, statusFilter, t]
  )

  useEffect(() => {
    void loadDoctors()
  }, [loadDoctors])

  useEffect(() => {
    const visibleIds = new Set(rows.map(row => row.id))
    setSelectedIds(prev => prev.filter(id => visibleIds.has(id)))
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter(row => row.is_active).length
    const inactive = total - active
    const averageRating =
      rows.length > 0
        ? rows.reduce((sum, row) => sum + (row.rating || 0), 0) / rows.length
        : 0
    return { total, active, inactive, averageRating }
  }, [rows])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected =
    rows.length > 0 && rows.every(row => selectedSet.has(row.id))
  const tableCellClass = preferences.compactTables ? 'px-3 py-2' : 'px-4 py-3'
  const tableHeadClass = `${tableCellClass} text-left text-xs font-semibold uppercase text-dental-text-light`
  const tableEmptyStateClass = `${
    preferences.compactTables ? 'px-3 py-6' : 'px-4 py-8'
  } text-center text-dental-text-light`
  const getAvailabilityLabel = useCallback(
    (status: 'active' | 'inactive') => t(`admin.doctorStatuses.${status}`),
    [t]
  )

  const confirmIfNeeded = useCallback(
    (message: string) => {
      if (!preferences.confirmSensitiveActions) return true
      return window.confirm(message)
    },
    [preferences.confirmSensitiveActions]
  )

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds(rows.map(row => row.id))
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) return
    if (
      !confirmIfNeeded(
        t('admin.doctorsPage.confirmations.bulkStatusChange', {
          count: selectedIds.length,
          status: getAvailabilityLabel(bulkStatus),
        })
      )
    ) {
      return
    }

    const supabase = createClient()
    if (!supabase) return

    setIsUpdatingId('bulk')
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('doctors')
        .update({ is_active: bulkStatus === 'active' })
        .in('id', selectedIds)
      if (updateError) throw updateError

      setSelectedIds([])
      if (preferences.autoRefreshLists) {
        await loadDoctors(true)
        return
      }

      setRows(prev =>
        prev.map(row =>
          selectedSet.has(row.id)
            ? { ...row, is_active: bulkStatus === 'active' }
            : row
        )
      )
    } catch (updateError) {
      captureException(
        updateError instanceof Error
          ? updateError
          : new Error(String(updateError))
      )
      setError(t('admin.doctorsPage.errors.bulkUpdateFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  const toggleDoctorStatus = useCallback(
    async (id: string, isActive: boolean) => {
      if (
        !confirmIfNeeded(
          isActive
            ? t('admin.doctorsPage.confirmations.deactivateDoctor')
            : t('admin.doctorsPage.confirmations.activateDoctor')
        )
      ) {
        return
      }

      const supabase = createClient()
      if (!supabase) return

      setIsUpdatingId(id)
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from('doctors')
          .update({ is_active: !isActive })
          .eq('id', id)

        if (updateError) throw updateError

        if (preferences.autoRefreshLists) {
          await loadDoctors(true)
          return
        }

        setRows(prev =>
          prev.map(row =>
            row.id === id ? { ...row, is_active: !isActive } : row
          )
        )
      } catch (updateError) {
        captureException(
          updateError instanceof Error
            ? updateError
            : new Error(String(updateError))
        )
        setError(t('admin.doctorsPage.errors.statusUpdateFailed'))
      } finally {
        setIsUpdatingId(null)
      }
    },
    [confirmIfNeeded, loadDoctors, preferences.autoRefreshLists, t]
  )

  const openCreateModal = () => {
    setModalMode('create')
    setEditingDoctorId(null)
    setFormState(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEditModal = (row: DoctorRow) => {
    setModalMode('edit')
    setEditingDoctorId(row.id)
    setFormState({
      first_name: row.first_name,
      last_name: row.last_name,
      patronymic: row.patronymic || '',
      specialization: row.specialization,
      experience_years: String(row.experience_years ?? 0),
      education: row.education || '',
      photo_url: row.photo_url || '',
      bio: row.bio || '',
      is_active: row.is_active,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
  }

  const saveDoctor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const supabase = createClient()
    if (!supabase) return

    if (
      !formState.first_name.trim() ||
      !formState.last_name.trim() ||
      !formState.specialization.trim()
    ) {
      setError(t('admin.doctorsPage.errors.requiredFields'))
      return
    }

    const years = Number(formState.experience_years)
    if (!Number.isFinite(years) || years < 0) {
      setError(t('admin.doctorsPage.errors.invalidExperience'))
      return
    }

    const payload = {
      first_name: formState.first_name.trim(),
      last_name: formState.last_name.trim(),
      patronymic: formState.patronymic.trim() || null,
      specialization: formState.specialization.trim(),
      experience_years: years,
      education: formState.education.trim() || null,
      photo_url: formState.photo_url.trim() || null,
      bio: formState.bio.trim() || null,
      is_active: formState.is_active,
    }

    setIsSaving(true)
    setError(null)
    try {
      if (modalMode === 'create') {
        const { error: insertError } = await supabase
          .from('doctors')
          .insert(payload)
        if (insertError) throw insertError
      } else {
        if (!editingDoctorId) return
        const { error: updateError } = await supabase
          .from('doctors')
          .update(payload)
          .eq('id', editingDoctorId)
        if (updateError) throw updateError
      }

      setIsModalOpen(false)
      await loadDoctors(true)
    } catch (saveError) {
      captureException(
        saveError instanceof Error ? saveError : new Error(String(saveError))
      )
      setError(t('admin.doctorsPage.errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteDoctor = async (id: string) => {
    if (!confirmIfNeeded(t('admin.doctorsPage.confirmations.deleteDoctor')))
      return
    const supabase = createClient()
    if (!supabase) return

    setIsUpdatingId(id)
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError

      if (preferences.autoRefreshLists) {
        await loadDoctors(true)
        return
      }

      setRows(prev => prev.filter(row => row.id !== id))
      setSelectedIds(prev => prev.filter(item => item !== id))
    } catch (deleteError) {
      captureException(
        deleteError instanceof Error
          ? deleteError
          : new Error(String(deleteError))
      )
      setError(t('admin.doctorsPage.errors.deleteFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.doctorsPage.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.doctorsPage.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.doctorsPage.addDoctor')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadDoctors(true)}
            isLoading={isRefreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.doctorsPage.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.doctorsPage.summary.total')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.doctorsPage.summary.active')}
          </p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.doctorsPage.summary.inactive')}
          </p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.doctorsPage.summary.averageRating')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">
            {stats.averageRating.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('admin.doctorsPage.filters.searchPlaceholder')}
            className="md:col-span-2"
          />
          <Select
            selectSize="compact"
            fullWidth
            value={statusFilter}
            onChange={event =>
              setStatusFilter(
                event.target.value as 'all' | 'active' | 'inactive'
              )
            }
            aria-label={t('admin.doctorsPage.filters.all')}
          >
            <option value="all">{t('admin.doctorsPage.filters.all')}</option>
            <option value="active">
              {t('admin.doctorsPage.filters.activeOnly')}
            </option>
            <option value="inactive">
              {t('admin.doctorsPage.filters.inactiveOnly')}
            </option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dental-secondary-200 bg-white px-4 py-3">
        <span className="text-sm text-dental-text-light">
          {t('admin.doctorsPage.bulk.selected', { count: selectedIds.length })}
        </span>
        <Select
          selectSize="compact"
          value={bulkStatus}
          onChange={event =>
            setBulkStatus(event.target.value as 'active' | 'inactive')
          }
          aria-label={t('admin.doctorsPage.bulk.apply')}
        >
          <option value="active">
            {t('admin.doctorsPage.bulk.activateSelected')}
          </option>
          <option value="inactive">
            {t('admin.doctorsPage.bulk.deactivateSelected')}
          </option>
        </Select>
        <Button
          size="sm"
          onClick={() => void handleBulkStatusUpdate()}
          disabled={selectedIds.length === 0 || isUpdatingId === 'bulk'}
          isLoading={isUpdatingId === 'bulk'}
        >
          {t('admin.doctorsPage.bulk.apply')}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-dental-secondary-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dental-secondary-200">
            <thead className="bg-dental-secondary-50">
              <tr>
                <th className={tableHeadClass}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label={t('admin.doctorsPage.table.selectAllAria')}
                  />
                </th>
                <th className={tableHeadClass}>
                  {t('admin.doctorsPage.table.headers.doctor')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.doctorsPage.table.headers.specialization')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.doctorsPage.table.headers.experience')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.doctorsPage.table.headers.rating')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.doctorsPage.table.headers.status')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.doctorsPage.table.headers.updatedAt')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.doctorsPage.table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dental-secondary-100 bg-white text-sm">
              {isLoading ? (
                <TableSkeleton cols={8} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={tableEmptyStateClass}>
                    {t('admin.doctorsPage.table.empty')}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id}>
                    <td className={tableCellClass}>
                      <input
                        type="checkbox"
                        checked={selectedSet.has(row.id)}
                        onChange={() => toggleSelection(row.id)}
                        aria-label={t('admin.doctorsPage.table.selectRowAria', {
                          name: `${row.last_name} ${row.first_name}`,
                        })}
                      />
                    </td>
                    <td className={tableCellClass}>
                      <p className="font-medium text-dental-dark">
                        {row.last_name} {row.first_name}
                      </p>
                      {row.patronymic ? (
                        <p className="text-xs text-dental-text-light">
                          {row.patronymic}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {row.specialization}
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {t('admin.doctorsPage.table.experienceYears', {
                        years: row.experience_years ?? 0,
                      })}
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {(row.rating ?? 0).toFixed(1)} ({row.reviews_count ?? 0})
                    </td>
                    <td className={tableCellClass}>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                          row.is_active ? 'active' : 'inactive'
                        )}`}
                      >
                        {row.is_active
                          ? getAvailabilityLabel('active')
                          : getAvailabilityLabel('inactive')}
                      </span>
                    </td>
                    <td
                      className={`${tableCellClass} text-xs text-dental-text-light`}
                    >
                      {formatDateTime(row.updated_at)}
                    </td>
                    <td className={tableCellClass}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="rounded-md border border-dental-secondary p-1.5 text-dental-text hover:bg-dental-secondary-50"
                          aria-label={t('admin.doctorsPage.actions.editAria')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void toggleDoctorStatus(row.id, row.is_active)
                          }
                          disabled={isUpdatingId === row.id}
                          className="rounded-md border border-dental-secondary px-3 py-1.5 text-xs font-semibold text-dental-text hover:bg-dental-secondary-50 disabled:opacity-60"
                        >
                          {row.is_active
                            ? t('admin.doctorsPage.actions.deactivate')
                            : t('admin.doctorsPage.actions.activate')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteDoctor(row.id)}
                          disabled={isUpdatingId === row.id}
                          className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          aria-label={t('admin.doctorsPage.actions.deleteAria')}
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
            ? t('admin.doctorsPage.modal.createTitle')
            : t('admin.doctorsPage.modal.editTitle')
        }
        subtitle={t('admin.doctorsPage.modal.subtitle')}
        onClose={closeModal}
      >
        <form className="space-y-4" onSubmit={event => void saveDoctor(event)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label={t('admin.doctorsPage.form.firstName')}
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
              label={t('admin.doctorsPage.form.lastName')}
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
              label={t('admin.doctorsPage.form.patronymic')}
              value={formState.patronymic}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  patronymic: event.target.value,
                }))
              }
            />
            <Input
              label={t('admin.doctorsPage.form.specialization')}
              value={formState.specialization}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  specialization: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              min={0}
              label={t('admin.doctorsPage.form.experienceYears')}
              value={formState.experience_years}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  experience_years: event.target.value,
                }))
              }
              required
            />
            <Input
              type="url"
              label={t('admin.doctorsPage.form.photoUrl')}
              value={formState.photo_url}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  photo_url: event.target.value,
                }))
              }
            />
          </div>
          <Input
            label={t('admin.doctorsPage.form.education')}
            value={formState.education}
            onChange={event =>
              setFormState(prev => ({ ...prev, education: event.target.value }))
            }
          />
          <Textarea
            label={t('admin.doctorsPage.form.bio')}
            value={formState.bio}
            onChange={event =>
              setFormState(prev => ({ ...prev, bio: event.target.value }))
            }
            rows={4}
          />
          <label className="flex items-center gap-2 text-sm text-dental-text">
            <input
              type="checkbox"
              checked={formState.is_active}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  is_active: event.target.checked,
                }))
              }
            />
            {t('admin.doctorsPage.form.activeProfile')}
          </label>
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
                ? t('admin.doctorsPage.form.create')
                : t('admin.doctorsPage.form.saveChanges')}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
