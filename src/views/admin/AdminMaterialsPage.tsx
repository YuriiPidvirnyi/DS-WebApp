'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  AlertTriangle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { useCSRF } from '@/hooks/useCSRF'
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
const CAT_UK: Record<(typeof CATS)[number], string> = {
  composite: 'Композит',
  filling: 'Пломбувальні',
  instrument: 'Інструменти',
  implant: 'Імпланти',
  hygiene: 'Гігієна',
  anesthesia: 'Анестезія',
  other: 'Інше',
}
const UNITS = ['шт', 'мл', 'г', 'упак', 'пара', 'набір'] as const
const HEAD = [
  'Назва',
  'Категорія',
  'Одиниця виміру',
  'Артикул',
  'Залишок на складі',
  'Мін. запас',
  'Постачальник',
  'Статус',
  'Дії',
] as const

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
  const { preferences } = useAdminPreferences()
  const { token, refreshToken } = useCSRF()
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
          throw new Error(j.error || 'Не вдалося завантажити матеріали')
        setRows(j.data)
      } catch (e) {
        captureException(e instanceof Error ? e : new Error(String(e)))
        setError(e instanceof Error ? e.message : 'Помилка завантаження')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [catF, statF]
  )

  useEffect(() => {
    void load()
  }, [load])

  const list = useMemo(() => {
    const s = search.trim().toLowerCase()
    return s ? rows.filter(r => r.name_uk.toLowerCase().includes(s)) : rows
  }, [rows, search])

  const c = preferences.compactTables ? 'px-3 py-2' : 'px-4 py-3'
  const th = `${c} text-left text-xs font-semibold uppercase text-gray-500`

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
                {CAT_UK[v]}
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
                {u}
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
      if (!res.ok || !j.success)
        throw new Error(j.error || 'Збереження не вдалося')
      setOpen(false)
      void load(true)
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const saveQty = async (id: string) => {
    const raw = draft[id]
    if (raw === undefined) return
    const n = Number(raw)
    if (Number.isNaN(n) || n < 0) {
      setError('Некоректна кількість')
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
        throw new Error(j.error || 'Не вдалося оновити залишок')
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
      setError(err instanceof Error ? err.message : 'Помилка залишку')
    } finally {
      setStockId(null)
    }
  }

  const deactivate = async (id: string) => {
    if (!confirm('Деактивувати цей матеріал?')) return
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: csrf(),
      })
      const j = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !j.success)
        throw new Error(j.error || 'Не вдалося деактивувати')
      void load(true)
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const catLab = (x: string) => CAT_UK[x as (typeof CATS)[number]] ?? x

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-dental-primary-100 p-3 text-dental-teal">
            <Package className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="font-nunito text-2xl font-bold text-dental-dark">
              Матеріали та витратники
            </h1>
            <p className="text-sm text-dental-text">
              Каталог і залишки на складі
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="border-dental-secondary-300"
            aria-label={t('admin.analyticsPage.refresh')}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Оновити
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditId(null)
              setForm(emptyForm())
              setOpen(true)
            }}
            className="bg-dental-teal hover:bg-dental-primary-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Додати матеріал
          </Button>
        </div>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 rounded-xl border border-dental-secondary-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-dental-text">
            Пошук за назвою
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Назва…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full min-w-[160px] lg:w-48">
          <label className="mb-1 block text-xs font-medium text-dental-text">
            Категорія
          </label>
          <Select
            selectSize="compact"
            fullWidth
            value={catF}
            onChange={e => setCatF(e.target.value)}
            aria-label="Категорія фільтр"
          >
            <option value="all">Усі категорії</option>
            {CATS.map(v => (
              <option key={v} value={v}>
                {CAT_UK[v]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full min-w-[160px] lg:w-40">
          <label className="mb-1 block text-xs font-medium text-dental-text">
            Статус
          </label>
          <Select
            selectSize="compact"
            fullWidth
            value={statF}
            onChange={e => setStatF(e.target.value as typeof statF)}
            aria-label="Статус фільтр"
          >
            <option value="all">Усі</option>
            <option value="active">Активні</option>
            <option value="inactive">Неактивні</option>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-dental-secondary-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-dental-text">Завантаження…</p>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-dental-text-light">
            Нічого не знайдено
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
                    className={`border-t border-dental-secondary-100 ${low ? 'bg-red-50/80' : ''}`}
                  >
                    <td className={`${c} font-medium text-dental-dark`}>
                      <span className="inline-flex items-center gap-1">
                        {r.name_uk}
                        {low ? (
                          <AlertTriangle
                            className="h-4 w-4 shrink-0 text-red-600"
                            aria-label="Низький залишок"
                          />
                        ) : null}
                      </span>
                    </td>
                    <td className={`${c} text-dental-text`}>
                      {catLab(r.category)}
                    </td>
                    <td className={`${c} text-dental-text`}>{r.unit}</td>
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
                            ? 'text-green-700'
                            : 'text-dental-text-light'
                        }
                      >
                        {r.is_active ? 'Активний' : 'Неактивний'}
                      </span>
                    </td>
                    <td className={c}>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditId(r.id)
                            setForm(toForm(r))
                            setOpen(true)
                          }}
                          className="rounded-lg p-2 text-dental-teal hover:bg-dental-primary-50"
                          aria-label="Редагувати"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {r.is_active ? (
                          <button
                            type="button"
                            onClick={() => void deactivate(r.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            aria-label="Деактивувати"
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
        title={editId ? 'Редагувати матеріал' : 'Новий матеріал'}
        maxWidthClassName="max-w-lg"
      >
        <form onSubmit={onSave} className="space-y-3">
          {F('nameUk', 'Назва (UK) *')}
          <div className="grid gap-3 sm:grid-cols-2">
            {F('nameEn', 'Назва (EN)')}
            {F('namePl', 'Назва (PL)')}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {F('category', 'Категорія')}
            {F('unit', 'Одиниця виміру')}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {F('sku', 'Артикул')}
            {F('minStockLevel', 'Мін. запас')}
          </div>
          {F('supplierName', 'Постачальник')}
          <div className="grid gap-3 sm:grid-cols-2">
            {F('supplierContact', 'Контакт постачальника')}
            {F('supplierEmail', 'Email постачальника')}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-dental-teal hover:bg-dental-primary-600"
            >
              {saving ? 'Збереження…' : 'Зберегти'}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
