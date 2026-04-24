'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Pencil, Archive, Loader2 } from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { hasPermission } from '@/lib/permissions'

type Tab = 'suppliers' | 'brands' | 'categories'

interface DirectoryItem {
  id: string
  name?: string
  name_uk?: string
  is_archived: boolean
  [key: string]: unknown
}

export default function AdminStockDirectoriesPage() {
  const { token: csrfToken } = useCSRF()
  const { user } = useAdminAuth()
  const [tab, setTab] = useState<Tab>('suppliers')
  const [items, setItems] = useState<DirectoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [editItem, setEditItem] = useState<DirectoryItem | null>(null)
  const [creating, setCreating] = useState(false)

  const canEdit = user ? hasPermission(user.role, 'inventory:edit') : false

  const apiPath = {
    suppliers: '/api/stock/suppliers',
    brands: '/api/stock/brands',
    categories: '/api/stock/categories',
  }[tab]

  const displayName = (item: DirectoryItem) => item.name_uk ?? item.name ?? '—'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `${apiPath}${showArchived ? '?includeArchived=true' : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setItems(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [tab, showArchived, apiPath])

  useEffect(() => {
    load()
  }, [load])

  async function archiveItem(id: string) {
    if (!confirm('Архівувати?')) return
    const res = await fetch(`${apiPath}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ isArchived: true }),
    })
    if (res.ok) load()
  }

  const TAB_LABELS: Record<Tab, string> = {
    suppliers: 'Постачальники',
    brands: 'Бренди',
    categories: 'Категорії',
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/stock"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            Довідники
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {(Object.entries(TAB_LABELS) as [Tab, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key)
                  setItems([])
                  setError(null)
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === key
                    ? 'border-dental-primary-600 text-dental-primary-600'
                    : 'border-transparent text-dental-text hover:text-dental-dark'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-dental-text cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Показати архівні
          </label>
          {canEdit && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Додати
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-dental-primary-600" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-center text-dental-text py-12">Записів немає</p>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl border bg-white p-4 ${item.is_archived ? 'opacity-50' : ''}`}
              >
                <div>
                  <p className="font-medium text-dental-dark">
                    {displayName(item)}
                  </p>
                  {item.is_archived && (
                    <p className="text-xs text-amber-600">Архів</p>
                  )}
                  {tab === 'suppliers' && !!item.email && (
                    <p className="text-xs text-dental-text">
                      {item.email as string}
                    </p>
                  )}
                  {tab === 'brands' && !!item.country && (
                    <p className="text-xs text-dental-text">
                      {item.country as string}
                    </p>
                  )}
                  {tab === 'categories' && !!item.parent_id && (
                    <p className="text-xs text-dental-text">Підкатегорія</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditItem(item)}
                      className="rounded p-1.5 text-dental-text hover:bg-gray-100"
                      title="Редагувати"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!item.is_archived && (
                      <button
                        onClick={() => archiveItem(item.id)}
                        className="rounded p-1.5 text-amber-500 hover:bg-amber-50"
                        title="Архівувати"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editItem) && (
        <DirectoryItemModal
          tab={tab}
          item={editItem}
          apiPath={apiPath}
          csrfToken={csrfToken}
          onClose={() => {
            setCreating(false)
            setEditItem(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditItem(null)
            load()
          }}
        />
      )}
    </>
  )
}

interface ModalProps {
  tab: Tab
  item: DirectoryItem | null
  apiPath: string
  csrfToken: string
  onClose: () => void
  onSaved: () => void
}

function DirectoryItemModal({
  tab,
  item,
  apiPath,
  csrfToken,
  onClose,
  onSaved,
}: ModalProps) {
  const [nameUk, setNameUk] = useState(
    item ? (item.name_uk ?? item.name ?? '') : ''
  )
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const key = tab === 'suppliers' ? 'name' : 'nameUk'
    const trimmed = nameUk.trim()
    if (!trimmed) {
      setErr("Назва обов'язкова")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const url = item ? `${apiPath}/${item.id}` : apiPath
      const method = item ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ [key]: trimmed, ...extra }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const title = item
    ? `Редагувати ${tab === 'suppliers' ? 'постачальника' : tab === 'brands' ? 'бренд' : 'категорію'}`
    : `Новий ${tab === 'suppliers' ? 'постачальник' : tab === 'brands' ? 'бренд' : 'категорія'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold text-dental-dark mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              Назва
            </label>
            <input
              value={nameUk}
              onChange={e => setNameUk(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
            />
          </div>

          {tab === 'suppliers' && (
            <>
              <div>
                <label className="block text-sm font-medium text-dental-dark mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={extra.email ?? (item?.email as string) ?? ''}
                  onChange={e =>
                    setExtra(p => ({ ...p, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dental-dark mb-1">
                  Телефон
                </label>
                <input
                  value={extra.phone ?? (item?.phone as string) ?? ''}
                  onChange={e =>
                    setExtra(p => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dental-dark mb-1">
                  ЄДРПОУ
                </label>
                <input
                  value={extra.edrpou ?? (item?.edrpou as string) ?? ''}
                  onChange={e =>
                    setExtra(p => ({ ...p, edrpou: e.target.value }))
                  }
                  maxLength={10}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
                />
              </div>
            </>
          )}

          {tab === 'brands' && (
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Країна
              </label>
              <input
                value={extra.country ?? (item?.country as string) ?? ''}
                onChange={e =>
                  setExtra(p => ({ ...p, country: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
              />
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-dental-text hover:text-dental-dark"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
