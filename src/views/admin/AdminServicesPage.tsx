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
import { Button, Input, Textarea } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import AdminModal from './components/AdminModal'
import { formatCurrency, formatDateTime, getStatusTone } from './utils'

interface ServiceRow {
  id: string
  name_uk: string
  name_en: string | null
  name_pl: string | null
  description_uk: string | null
  description_en: string | null
  description_pl: string | null
  category: string
  price_uah: number
  duration_minutes: number
  image_url: string | null
  is_active: boolean
  updated_at: string
}

type ServiceModalMode = 'create' | 'edit'

interface ServiceFormState {
  name_uk: string
  name_en: string
  name_pl: string
  description_uk: string
  description_en: string
  description_pl: string
  category: string
  price_uah: string
  duration_minutes: string
  image_url: string
  is_active: boolean
}

const SERVICE_SELECT =
  'id, name_uk, name_en, name_pl, description_uk, description_en, description_pl, category, price_uah, duration_minutes, image_url, is_active, updated_at'

const EMPTY_FORM: ServiceFormState = {
  name_uk: '',
  name_en: '',
  name_pl: '',
  description_uk: '',
  description_en: '',
  description_pl: '',
  category: '',
  price_uah: '0',
  duration_minutes: '30',
  image_url: '',
  is_active: true,
}

export default function AdminServicesPage() {
  const { t } = useTranslation()
  const { preferences } = useAdminPreferences()
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [bulkStatus, setBulkStatus] = useState<'active' | 'inactive'>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ServiceModalMode>('create')
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [formState, setFormState] = useState<ServiceFormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const loadServices = useCallback(
    async (silent = false) => {
      const supabase = createClient()
      if (!supabase) {
        setError(t('admin.servicesPage.errors.supabaseUnavailable'))
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
        let query = supabase.from('services').select(SERVICE_SELECT)

        if (statusFilter === 'active') {
          query = query.eq('is_active', true)
        } else if (statusFilter === 'inactive') {
          query = query.eq('is_active', false)
        }

        if (categoryFilter !== 'all') {
          query = query.eq('category', categoryFilter)
        }

        const normalizedSearch = searchTerm
          .replace(/[%_',]/g, ' ')
          .trim()
          .slice(0, 100)

        if (normalizedSearch) {
          query = query.or(
            `name_uk.ilike.%${normalizedSearch}%,category.ilike.%${normalizedSearch}%`
          )
        }

        const { data, error: queryError } = await query
          .order('category', { ascending: true })
          .order('price_uah', { ascending: true })
          .limit(500)

        if (queryError) throw queryError

        setRows((data || []) as ServiceRow[])
      } catch (loadError) {
        console.error('Failed to load services:', loadError)
        setError(t('admin.servicesPage.errors.loadFailed'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [categoryFilter, searchTerm, statusFilter, t]
  )

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  useEffect(() => {
    const visibleIds = new Set(rows.map(row => row.id))
    setSelectedIds(prev => prev.filter(id => visibleIds.has(id)))
  }, [rows])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    rows.forEach(row => unique.add(row.category))
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter(row => row.is_active).length
    const inactive = total - active
    const averagePrice =
      rows.length > 0
        ? rows.reduce((sum, row) => sum + Number(row.price_uah || 0), 0) /
          rows.length
        : 0
    return { total, active, inactive, averagePrice }
  }, [rows])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected =
    rows.length > 0 && rows.every(row => selectedSet.has(row.id))
  const tableCellClass = preferences.compactTables ? 'px-3 py-2' : 'px-4 py-3'
  const tableHeadClass = `${tableCellClass} text-left text-xs font-semibold uppercase text-gray-500`
  const tableEmptyStateClass = `${
    preferences.compactTables ? 'px-3 py-6' : 'px-4 py-8'
  } text-center text-dental-text-light`
  const getAvailabilityLabel = useCallback(
    (status: 'active' | 'inactive') => t(`admin.serviceStatuses.${status}`),
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
        t('admin.servicesPage.confirmations.bulkStatusChange', {
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
        .from('services')
        .update({ is_active: bulkStatus === 'active' })
        .in('id', selectedIds)
      if (updateError) throw updateError

      setSelectedIds([])
      if (preferences.autoRefreshLists) {
        await loadServices(true)
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
      console.error('Failed bulk update for services:', updateError)
      setError(t('admin.servicesPage.errors.bulkUpdateFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  const toggleServiceStatus = useCallback(
    async (id: string, isActive: boolean) => {
      if (
        !confirmIfNeeded(
          isActive
            ? t('admin.servicesPage.confirmations.hideService')
            : t('admin.servicesPage.confirmations.showService')
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
          .from('services')
          .update({ is_active: !isActive })
          .eq('id', id)

        if (updateError) throw updateError

        if (preferences.autoRefreshLists) {
          await loadServices(true)
          return
        }

        setRows(prev =>
          prev.map(row =>
            row.id === id ? { ...row, is_active: !isActive } : row
          )
        )
      } catch (updateError) {
        console.error('Failed to update service:', updateError)
        setError(t('admin.servicesPage.errors.statusUpdateFailed'))
      } finally {
        setIsUpdatingId(null)
      }
    },
    [confirmIfNeeded, loadServices, preferences.autoRefreshLists, t]
  )

  const openCreateModal = () => {
    setModalMode('create')
    setEditingServiceId(null)
    setFormState(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEditModal = (row: ServiceRow) => {
    setModalMode('edit')
    setEditingServiceId(row.id)
    setFormState({
      name_uk: row.name_uk,
      name_en: row.name_en || '',
      name_pl: row.name_pl || '',
      description_uk: row.description_uk || '',
      description_en: row.description_en || '',
      description_pl: row.description_pl || '',
      category: row.category,
      price_uah: String(row.price_uah ?? 0),
      duration_minutes: String(row.duration_minutes ?? 30),
      image_url: row.image_url || '',
      is_active: row.is_active,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
  }

  const saveService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const supabase = createClient()
    if (!supabase) return

    if (!formState.name_uk.trim() || !formState.category.trim()) {
      setError(t('admin.servicesPage.errors.requiredFields'))
      return
    }

    const price = Number(formState.price_uah)
    const duration = Number(formState.duration_minutes)
    if (!Number.isFinite(price) || price < 0) {
      setError(t('admin.servicesPage.errors.invalidPrice'))
      return
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setError(t('admin.servicesPage.errors.invalidDuration'))
      return
    }

    const payload = {
      name_uk: formState.name_uk.trim(),
      name_en: formState.name_en.trim() || null,
      name_pl: formState.name_pl.trim() || null,
      description_uk: formState.description_uk.trim() || null,
      description_en: formState.description_en.trim() || null,
      description_pl: formState.description_pl.trim() || null,
      category: formState.category.trim(),
      price_uah: price,
      duration_minutes: duration,
      image_url: formState.image_url.trim() || null,
      is_active: formState.is_active,
    }

    setIsSaving(true)
    setError(null)
    try {
      if (modalMode === 'create') {
        const { error: insertError } = await supabase
          .from('services')
          .insert(payload)
        if (insertError) throw insertError
      } else {
        if (!editingServiceId) return
        const { error: updateError } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingServiceId)
        if (updateError) throw updateError
      }

      setIsModalOpen(false)
      await loadServices(true)
    } catch (saveError) {
      console.error('Failed to save service:', saveError)
      setError(t('admin.servicesPage.errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteService = async (id: string) => {
    if (!confirmIfNeeded(t('admin.servicesPage.confirmations.deleteService')))
      return
    const supabase = createClient()
    if (!supabase) return

    setIsUpdatingId(id)
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError

      if (preferences.autoRefreshLists) {
        await loadServices(true)
        return
      }

      setRows(prev => prev.filter(row => row.id !== id))
      setSelectedIds(prev => prev.filter(item => item !== id))
    } catch (deleteError) {
      console.error('Failed to delete service:', deleteError)
      setError(t('admin.servicesPage.errors.deleteFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.servicesPage.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.servicesPage.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.servicesPage.addService')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadServices(true)}
            isLoading={isRefreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.servicesPage.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.servicesPage.summary.total')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.servicesPage.summary.active')}
          </p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.servicesPage.summary.inactive')}
          </p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.servicesPage.summary.averagePrice')}
          </p>
          <p className="text-xl font-bold text-dental-dark">
            {formatCurrency(stats.averagePrice)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('admin.servicesPage.filters.searchPlaceholder')}
            className="md:col-span-2"
          />
          <select
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">
              {t('admin.servicesPage.filters.allCategories')}
            </option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(
                event.target.value as 'all' | 'active' | 'inactive'
              )
            }
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">
              {t('admin.servicesPage.filters.allStatuses')}
            </option>
            <option value="active">
              {t('admin.servicesPage.filters.activeOnly')}
            </option>
            <option value="inactive">
              {t('admin.servicesPage.filters.inactiveOnly')}
            </option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dental-secondary-200 bg-white px-4 py-3">
        <span className="text-sm text-dental-text-light">
          {t('admin.servicesPage.bulk.selected', { count: selectedIds.length })}
        </span>
        <select
          value={bulkStatus}
          onChange={event =>
            setBulkStatus(event.target.value as 'active' | 'inactive')
          }
          className="rounded-md border border-dental-secondary px-3 py-1.5 text-sm"
        >
          <option value="active">
            {t('admin.servicesPage.bulk.showSelected')}
          </option>
          <option value="inactive">
            {t('admin.servicesPage.bulk.hideSelected')}
          </option>
        </select>
        <Button
          size="sm"
          onClick={() => void handleBulkStatusUpdate()}
          disabled={selectedIds.length === 0 || isUpdatingId === 'bulk'}
          isLoading={isUpdatingId === 'bulk'}
        >
          {t('admin.servicesPage.bulk.apply')}
        </Button>
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
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label={t('admin.servicesPage.table.selectAllAria')}
                  />
                </th>
                <th className={tableHeadClass}>
                  {t('admin.servicesPage.table.headers.service')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.servicesPage.table.headers.category')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.servicesPage.table.headers.price')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.servicesPage.table.headers.duration')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.servicesPage.table.headers.status')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.servicesPage.table.headers.updatedAt')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.servicesPage.table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className={tableEmptyStateClass}>
                    {t('admin.servicesPage.table.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={tableEmptyStateClass}>
                    {t('admin.servicesPage.table.empty')}
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
                        aria-label={t(
                          'admin.servicesPage.table.selectRowAria',
                          {
                            name: row.name_uk,
                          }
                        )}
                      />
                    </td>
                    <td className={tableCellClass}>
                      <p className="font-medium text-dental-dark">
                        {row.name_uk}
                      </p>
                      {row.name_en || row.name_pl ? (
                        <p className="text-xs text-dental-text-light">
                          {[row.name_en, row.name_pl]
                            .filter(Boolean)
                            .join(' / ')}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {row.category}
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {formatCurrency(row.price_uah)}
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {t('admin.servicesPage.table.durationMinutes', {
                        minutes: row.duration_minutes,
                      })}
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
                          aria-label={t('admin.servicesPage.actions.editAria')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void toggleServiceStatus(row.id, row.is_active)
                          }
                          disabled={isUpdatingId === row.id}
                          className="rounded-md border border-dental-secondary px-3 py-1.5 text-xs font-semibold text-dental-text hover:bg-dental-secondary-50 disabled:opacity-60"
                        >
                          {row.is_active
                            ? t('admin.servicesPage.actions.hide')
                            : t('admin.servicesPage.actions.show')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteService(row.id)}
                          disabled={isUpdatingId === row.id}
                          className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          aria-label={t(
                            'admin.servicesPage.actions.deleteAria'
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
            ? t('admin.servicesPage.modal.createTitle')
            : t('admin.servicesPage.modal.editTitle')
        }
        subtitle={t('admin.servicesPage.modal.subtitle')}
        onClose={closeModal}
        maxWidthClassName="max-w-4xl"
      >
        <form className="space-y-4" onSubmit={event => void saveService(event)}>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label={t('admin.servicesPage.form.nameUk')}
              value={formState.name_uk}
              onChange={event =>
                setFormState(prev => ({ ...prev, name_uk: event.target.value }))
              }
              required
            />
            <Input
              label={t('admin.servicesPage.form.nameEn')}
              value={formState.name_en}
              onChange={event =>
                setFormState(prev => ({ ...prev, name_en: event.target.value }))
              }
            />
            <Input
              label={t('admin.servicesPage.form.namePl')}
              value={formState.name_pl}
              onChange={event =>
                setFormState(prev => ({ ...prev, name_pl: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label={t('admin.servicesPage.form.category')}
              value={formState.category}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  category: event.target.value,
                }))
              }
              required
            />
            <Input
              type="number"
              min={0}
              label={t('admin.servicesPage.form.priceUah')}
              value={formState.price_uah}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  price_uah: event.target.value,
                }))
              }
              required
            />
            <Input
              type="number"
              min={1}
              label={t('admin.servicesPage.form.durationMinutes')}
              value={formState.duration_minutes}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  duration_minutes: event.target.value,
                }))
              }
              required
            />
          </div>
          <Input
            type="url"
            label={t('admin.servicesPage.form.imageUrl')}
            value={formState.image_url}
            onChange={event =>
              setFormState(prev => ({ ...prev, image_url: event.target.value }))
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            <Textarea
              label={t('admin.servicesPage.form.descriptionUk')}
              value={formState.description_uk}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  description_uk: event.target.value,
                }))
              }
              rows={4}
            />
            <Textarea
              label={t('admin.servicesPage.form.descriptionEn')}
              value={formState.description_en}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  description_en: event.target.value,
                }))
              }
              rows={4}
            />
            <Textarea
              label={t('admin.servicesPage.form.descriptionPl')}
              value={formState.description_pl}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  description_pl: event.target.value,
                }))
              }
              rows={4}
            />
          </div>
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
            {t('admin.servicesPage.form.activeService')}
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
                ? t('admin.servicesPage.form.create')
                : t('admin.servicesPage.form.saveChanges')}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
