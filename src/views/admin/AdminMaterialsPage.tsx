'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  BarChart3,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button, ErrorState, Input, Select } from '@/components/ui'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { useConfirm } from '@/hooks/useConfirm'
import { useCSRF } from '@/hooks/useCSRF'
import { hasPermission } from '@/lib/permissions'
import { captureException } from '@/utils/sentry'
import AdminModal from './components/AdminModal'

const CATS = [
  'composite',
  'filling',
  'instrument',
  'implant',
  'hygiene',
  'anesthesia',
  'other',
] as const
const UNITS = ['шт', 'мл', 'г', 'упак', 'пара', 'набір'] as const

type Row = {
  id: string
  name_uk: string
  name_en: string | null
  name_pl: string | null
  category: string
  unit: string
  sku: string | null
  min_stock_level: number
  is_active: boolean
  image_url: string | null
  supplier_name: string | null
  supplier_contact: string | null
  supplier_email: string | null
  current_quantity: number
}
type Form = {
  nameUk: string
  nameEn: string
  namePl: string
  category: string
  unit: string
  sku: string
  minStockLevel: string
  supplierName: string
  supplierContact: string
  supplierEmail: string
}
const emptyForm = (): Form => ({
  nameUk: '',
  nameEn: '',
  namePl: '',
  category: 'composite',
  unit: 'шт',
  sku: '',
  minStockLevel: '0',
  supplierName: '',
  supplierContact: '',
  supplierEmail: '',
})
const toForm = (r: Row): Form => ({
  nameUk: r.name_uk,
  nameEn: r.name_en ?? '',
  namePl: r.name_pl ?? '',
  category: CATS.includes(r.category as (typeof CATS)[number])
    ? r.category
    : 'other',
  unit: UNITS.includes(r.unit as (typeof UNITS)[number]) ? r.unit : 'шт',
  sku: r.sku ?? '',
  minStockLevel: String(r.min_stock_level),
  supplierName: r.supplier_name ?? '',
  supplierContact: r.supplier_contact ?? '',
  supplierEmail: r.supplier_email ?? '',
})
const upd =
  (k: keyof Form) =>
  (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
  (f: Form) => ({ ...f, [k]: e.target.value })

export default function AdminMaterialsPage() {
  const { t } = useTranslation()
  const { user } = useAdminAuth()
  const { preferences } = useAdminPreferences()
  const { confirm, confirmDialog } = useConfirm()
  const { token, refreshToken } = useCSRF()
  const canViewAnalytics =
    !!user?.role && hasPermission(user.role, 'analytics:view')
  // RBAC-гейт дій (Р1): редагувати каталог можуть лише ролі з inventory:edit
  const canEdit = !!user?.role && hasPermission(user.role, 'inventory:edit')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catF, setCatF] = useState('all')
  const [statF, setStatF] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [stockId, setStockId] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const csrf = useCallback(() => {
    const tok = token || refreshToken()
    return { 'X-CSRF-Token': tok, 'Content-Type': 'application/json' }
  }, [token, refreshToken])

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const q = new URLSearchParams()
        if (catF !== 'all') q.set('category', catF)
        if (statF === 'active') q.set('isActive', 'true')
        if (statF === 'inactive') q.set('isActive', 'false')
        const res = await fetch(`/api/materials?${q}`, { cache: 'no-store' })
        const j = (await res.json()) as {
          success?: boolean
          data?: Row[]
          error?: string
        }
        if (!res.ok || !j.success || !j.data)
          throw new Error(j.error || t('common.error'))
        setRows(j.data)
      } catch (e) {
        captureException(e instanceof Error ? e : new Error(String(e)))
        setError(e instanceof Error ? e.message : t('common.error'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [catF, statF, t]
  )

  useEffect(() => {
    void load()
  }, [load])

  const list = useMemo(() => {
    const s = search.trim().toLowerCase()
    return s ? rows.filter(r => r.name_uk.toLowerCase().includes(s)) : rows
  }, [rows, search])

  const c = preferences.compactTables ? 'px-3 py-2' : 'px-4 py-3'
  const th = `${c} text-left text-xs font-semibold uppercase text-dental-muted`

  const F = (k: keyof Form, label: string) => (
    <div>
      <label className="text-xs font-medium text-dental-text">{label}</label>
      <div className="mt-1">
        {k === 'category' ? (
          <Select
            selectSize="compact"
            fullWidth
            value={form.category}
            onChange={e => setForm(upd('category')(e))}
          >
            {CATS.map(v => (
              <option key={v} value={v}>
                {catLab(v)}
              </option>
            ))}
          </Select>
        ) : k === 'unit' ? (
          <Select
            selectSize="compact"
            fullWidth
            value={form.unit}
            onChange={e => setForm(upd('unit')(e))}
          >
            {UNITS.map(u => (
              <option key={u} value={u}>
                {unitLab(u)}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            type={
              k === 'minStockLevel'
                ? 'number'
                : k === 'supplierEmail'
                  ? 'email'
                  : 'text'
            }
            min={k === 'minStockLevel' ? 0 : undefined}
            step={k === 'minStockLevel' ? '0.01' : undefined}
            value={form[k]}
            onChange={e => setForm(upd(k)(e))}
            required={k === 'nameUk'}
          />
        )}
      </div>
    </div>
  )

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nameUk.trim()) return
    setSaving(true)
    try {
      const body = {
        nameUk: form.nameUk.trim(),
        nameEn: form.nameEn.trim() || null,
        namePl: form.namePl.trim() || null,
        category: form.category,
        unit: form.unit,
        sku: form.sku.trim() || null,
        minStockLevel: Number(form.minStockLevel) || 0,
        supplierName: form.supplierName.trim() || null,
        supplierContact: form.supplierContact.trim() || null,
        supplierEmail: form.supplierEmail.trim() || null,
      }
      const url = editId ? `/api/materials/${editId}` : '/api/materials'
      const res = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: csrf(),
        body: JSON.stringify(body),
      })
      const j = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !j.success) throw new Error(j.error || t('common.error'))
      setOpen(false)
      void load(true)
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const saveQty = async (id: string) => {
    const raw = draft[id]
    if (raw === undefined) return
    const n = Number(raw)
    if (Number.isNaN(n) || n < 0) {
      setError(t('common.error'))
      return
    }
    setStockId(id)
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'PATCH',
        headers: csrf(),
        body: JSON.stringify({ currentQuantity: n }),
      })
      const j = (await res.json()) as {
        success?: boolean
        error?: string
        data?: Row
      }
      if (!res.ok || !j.success || !j.data)
        throw new Error(j.error || t('common.error'))
      setRows(p =>
        p.map(x =>
          x.id === id ? { ...x, current_quantity: j.data!.current_quantity } : x
        )
      )
      setDraft(d => {
        const o = { ...d }
        delete o[id]
        return o
      })
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setStockId(null)
    }
  }

  const deactivate = async (id: string) => {
    if (
      !(await confirm({
        title: t('admin.materialsPage.deactivateConfirm'),
        severity: 'significant',
        confirmLabel: t('admin.materialsPage.deactivate'),
      }))
    )
      return
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: csrf(),
      })
      const j = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !j.success) throw new Error(j.error || t('common.error'))
      void load(true)
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const uploadImage = async (file: File) => {
    if (!editId) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/materials/${editId}/upload-image`, {
        method: 'POST',
        body: fd,
      })
      const j = (await res.json()) as {
        success?: boolean
        data?: { imageUrl: string }
        error?: string
      }
      if (!res.ok || !j.success || !j.data)
        throw new Error(j.error || t('common.error'))
      setImagePreview(j.data.imageUrl)
      setRows(p =>
        p.map(x =>
          x.id === editId ? { ...x, image_url: j.data!.imageUrl } : x
        )
      )
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = async () => {
    if (!editId) return
    try {
      const res = await fetch(`/api/materials/${editId}`, {
        method: 'PATCH',
        headers: csrf(),
        body: JSON.stringify({ imageUrl: null }),
      })
      const j = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !j.success) throw new Error(j.error || t('common.error'))
      setImagePreview(null)
      setRows(p =>
        p.map(x => (x.id === editId ? { ...x, image_url: null } : x))
      )
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const catLab = (x: string) => {
    const key = `admin.materialsPage.categories.${x}`
    const translated = t(key)
    return translated !== key ? translated : x
  }
  const unitLab = (x: string) => {
    const key = `admin.materialsPage.units.${x}`
    const translated = t(key)
    return translated !== key ? translated : x
  }
  const HEAD = [
    '',
    t('admin.materialsPage.columns.name'),
    t('admin.materialsPage.columns.category'),
    t('admin.materialsPage.columns.unit'),
    t('admin.materialsPage.columns.sku'),
    t('admin.materialsPage.columns.stock'),
    t('admin.materialsPage.columns.minStock'),
    t('admin.materialsPage.columns.supplier'),
    t('admin.materialsPage.columns.status'),
    t('admin.materialsPage.columns.actions'),
  ]

  return (
    <div className="space-y-6">
      {confirmDialog}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-dental-primary-100 p-3 text-dental-teal">
            <Package className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="font-nunito text-2xl font-bold text-dental-dark">
              {t('admin.materialsPage.title')}
            </h1>
            <p className="text-sm text-dental-text">
              {t('admin.materialsPage.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canViewAnalytics && (
            <Link href="/admin/analytics/inventory">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-dental-secondary-300 gap-1"
              >
                <BarChart3 className="h-4 w-4" />
                {t('admin.materialsPage.analytics')}
              </Button>
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="border-dental-secondary-300"
            aria-label={t('admin.materialsPage.refresh')}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {t('admin.materialsPage.refresh')}
          </Button>
          {canEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditId(null)
                setForm(emptyForm())
                setImagePreview(null)
                setOpen(true)
              }}
              className="bg-dental-teal hover:bg-dental-primary-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('admin.materialsPage.addMaterial')}
            </Button>
          )}
        </div>
      </div>
      {error ? <ErrorState title={error} onRetry={() => void load()} /> : null}
      <div className="flex flex-col gap-3 rounded-xl border border-dental-secondary-200 bg-white p-4 shadow-xs lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-dental-text">
            {t('admin.materialsPage.searchByName')}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dental-muted" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('admin.materialsPage.searchByName')}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full min-w-[160px] lg:w-48">
          <label className="mb-1 block text-xs font-medium text-dental-text">
            {t('admin.materialsPage.categoryFilter')}
          </label>
          <Select
            selectSize="compact"
            fullWidth
            value={catF}
            onChange={e => setCatF(e.target.value)}
            aria-label={t('admin.materialsPage.categoryFilter')}
          >
            <option value="all">
              {t('admin.materialsPage.allCategories')}
            </option>
            {CATS.map(v => (
              <option key={v} value={v}>
                {catLab(v)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full min-w-[160px] lg:w-40">
          <label className="mb-1 block text-xs font-medium text-dental-text">
            {t('admin.materialsPage.statusFilter')}
          </label>
          <Select
            selectSize="compact"
            fullWidth
            value={statF}
            onChange={e => setStatF(e.target.value as typeof statF)}
            aria-label={t('admin.materialsPage.statusFilter')}
          >
            <option value="all">{t('admin.materialsPage.allStatuses')}</option>
            <option value="active">{t('admin.materialsPage.active')}</option>
            <option value="inactive">
              {t('admin.materialsPage.inactive')}
            </option>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-dental-secondary-200 bg-white shadow-xs">
        {loading ? (
          <p className="p-8 text-center text-dental-text">
            {t('admin.materialsPage.loading')}
          </p>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-dental-muted">
            {t('admin.materialsPage.empty')}
          </p>
        ) : (
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-dental-secondary-50">
              <tr>
                {HEAD.map(h => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const low =
                  r.is_active &&
                  Number(r.current_quantity) < Number(r.min_stock_level)
                const q = draft[r.id] ?? String(r.current_quantity ?? 0)
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-dental-secondary-100 ${low ? 'bg-status-error-100/80' : ''}`}
                  >
                    <td className={`${c} w-12`}>
                      {r.image_url ? (
                        <Image
                          src={r.image_url}
                          alt={r.name_uk}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover border border-dental-secondary-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dental-secondary-50 text-dental-muted">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className={`${c} font-medium text-dental-dark`}>
                      <span className="inline-flex items-center gap-1">
                        {r.name_uk}
                        {low ? (
                          <AlertTriangle
                            className="h-4 w-4 shrink-0 text-dental-error"
                            aria-label={t('admin.inventory.kpi.lowStock')}
                          />
                        ) : null}
                      </span>
                    </td>
                    <td className={`${c} text-dental-text`}>
                      {catLab(r.category)}
                    </td>
                    <td className={`${c} text-dental-text`}>
                      {unitLab(r.unit)}
                    </td>
                    <td className={`${c} text-dental-text`}>{r.sku || '—'}</td>
                    <td className={c}>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-24 rounded border border-dental-secondary-200 px-2 py-1 text-dental-dark"
                        value={q}
                        onChange={e =>
                          setDraft(d => ({ ...d, [r.id]: e.target.value }))
                        }
                        onBlur={() => void saveQty(r.id)}
                        disabled={stockId === r.id}
                      />
                    </td>
                    <td className={`${c} text-dental-text`}>
                      {r.min_stock_level}
                    </td>
                    <td className={`${c} text-dental-text`}>
                      {r.supplier_name || '—'}
                    </td>
                    <td className={c}>
                      <span
                        className={
                          r.is_active
                            ? 'text-status-success-700'
                            : 'text-dental-muted'
                        }
                      >
                        {r.is_active
                          ? t('admin.materialsPage.statusLabels.active')
                          : t('admin.materialsPage.statusLabels.inactive')}
                      </span>
                    </td>
                    <td className={c}>
                      <div className="flex gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(r.id)
                              setForm(toForm(r))
                              setImagePreview(r.image_url)
                              setOpen(true)
                            }}
                            className="rounded-lg p-2 text-dental-teal hover:bg-dental-primary-50"
                            aria-label={t('common.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canEdit && r.is_active ? (
                          <button
                            type="button"
                            onClick={() => void deactivate(r.id)}
                            className="rounded-lg p-2 text-dental-error hover:bg-status-error-100"
                            aria-label={t('admin.materialsPage.deactivate')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title={
          editId
            ? t('admin.materialsPage.editMaterial')
            : t('admin.materialsPage.newMaterial')
        }
        maxWidthClassName="max-w-lg"
      >
        <form onSubmit={onSave} className="space-y-3">
          {/* Image upload zone (only for edit mode) */}
          {editId && (
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt={t('admin.materialsPage.editMaterial')}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-xl object-cover border border-dental-secondary-200"
                  />
                  <button
                    type="button"
                    onClick={() => void removeImage()}
                    className="absolute -right-2 -top-2 rounded-full bg-dental-error p-0.5 text-white shadow-sm hover:bg-dental-error-dark"
                    aria-label={t('common.delete')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-dental-secondary-300 text-dental-muted hover:border-dental-teal hover:text-dental-teal transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10px]">
                    {t('admin.materialsPage.image.upload')}
                  </span>
                </button>
              )}
              <div className="flex-1 text-sm text-dental-muted">
                {uploadingImage ? (
                  <span className="text-dental-teal">
                    {t('admin.materialsPage.image.uploading')}
                  </span>
                ) : (
                  <>
                    {t('admin.materialsPage.image.formats')}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="ml-2 text-dental-teal underline hover:no-underline"
                      >
                        {t('admin.materialsPage.image.replace')}
                      </button>
                    )}
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) void uploadImage(file)
                  e.target.value = ''
                }}
              />
            </div>
          )}
          {F('nameUk', t('admin.materialsPage.form.nameUk'))}
          <div className="grid gap-3 sm:grid-cols-2">
            {F('nameEn', t('admin.materialsPage.form.nameEn'))}
            {F('namePl', t('admin.materialsPage.form.namePl'))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {F('category', t('admin.materialsPage.form.category'))}
            {F('unit', t('admin.materialsPage.form.unit'))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {F('sku', t('admin.materialsPage.form.sku'))}
            {F('minStockLevel', t('admin.materialsPage.form.minStockLevel'))}
          </div>
          {F('supplierName', t('admin.materialsPage.form.supplierName'))}
          <div className="grid gap-3 sm:grid-cols-2">
            {F(
              'supplierContact',
              t('admin.materialsPage.form.supplierContact')
            )}
            {F('supplierEmail', t('admin.materialsPage.form.supplierEmail'))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('admin.materialsPage.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-dental-teal hover:bg-dental-primary-600"
            >
              {saving
                ? t('admin.materialsPage.saving')
                : t('admin.materialsPage.save')}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
