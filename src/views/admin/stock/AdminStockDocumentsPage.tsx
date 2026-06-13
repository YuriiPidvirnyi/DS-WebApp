'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Eye, Copy, Loader2 } from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'
import type { StockDocument, DocType, DocStatus } from '@/types/stock'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  incoming: 'Прихід',
  writeoff: 'Списання',
  return: 'Повернення',
  transfer: 'Переміщення',
  adjustment: 'Коригування',
}

const STATUS_STYLES: Record<DocStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  posted: 'bg-green-100 text-green-700',
  void: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Чернетка',
  posted: 'Проведено',
  void: 'Анульовано',
}

export default function AdminStockDocumentsPage() {
  const { token: csrfToken } = useCSRF()
  const [docs, setDocs] = useState<StockDocument[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<DocType | ''>('')
  const [filterStatus, setFilterStatus] = useState<DocStatus | ''>('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (filterType) params.set('docType', filterType)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/stock/documents?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setDocs(json.data)
      setTotal(json.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [page, filterType, filterStatus])

  useEffect(() => {
    load()
  }, [load])

  async function copyDocument(id: string) {
    const res = await fetch(`/api/stock/documents/${id}/copy`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    })
    if (res.ok) load()
  }

  const pageSize = 50
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/stock"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            Документи
          </h1>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value as DocType | '')
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
            >
              <option value="">Всі типи</option>
              {(Object.entries(DOC_TYPE_LABELS) as [DocType, string][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                )
              )}
            </select>
            <select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value as DocStatus | '')
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
            >
              <option value="">Всі статуси</option>
              {(Object.entries(STATUS_LABELS) as [DocStatus, string][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                )
              )}
            </select>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новий документ
          </button>
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

        {!loading && !error && docs.length === 0 && (
          <p className="text-center text-dental-text py-12">
            Документи відсутні
          </p>
        )}

        {!loading && docs.length > 0 && (
          <>
            <div className="space-y-2">
              {docs.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border bg-white p-4"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}
                    >
                      {STATUS_LABELS[doc.status]}
                    </span>
                    <div>
                      <p className="font-medium text-dental-dark">
                        {DOC_TYPE_LABELS[doc.doc_type]} № {doc.doc_number}
                      </p>
                      <p className="text-xs text-dental-text">
                        {new Date(doc.doc_date).toLocaleDateString('uk-UA')}
                        {doc.total_amount > 0 &&
                          ` · ${doc.total_amount.toFixed(2)} грн`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/stock/documents/${doc.id}`}
                      className="rounded p-1.5 text-dental-text hover:bg-gray-100"
                      title="Відкрити"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => copyDocument(doc.id)}
                      className="rounded p-1.5 text-dental-text hover:bg-gray-100"
                      title="Копіювати"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Попередня
                </button>
                <span className="text-sm text-dental-text">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Наступна
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {creating && (
        <CreateDocumentModal
          onClose={() => setCreating(false)}
          onCreated={id => {
            setCreating(false)
            window.location.href = `/admin/stock/documents/${id}`
          }}
          csrfToken={csrfToken}
        />
      )}
    </>
  )
}

interface CreateDocumentModalProps {
  onClose: () => void
  onCreated: (id: string) => void
  csrfToken: string
}

const DOC_TYPE_OPTIONS: DocType[] = [
  'incoming',
  'writeoff',
  'return',
  'transfer',
  'adjustment',
]

function CreateDocumentModal({
  onClose,
  onCreated,
  csrfToken,
}: CreateDocumentModalProps) {
  const [docType, setDocType] = useState<DocType>('incoming')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch('/api/stock/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ docType }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onCreated(json.data.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Помилка створення')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold text-dental-dark mb-4">
          Новий документ
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              Тип документа
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as DocType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
            >
              {DOC_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>
                  {DOC_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
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
              Створити
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
