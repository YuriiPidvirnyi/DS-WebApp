'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Plus,
  Loader2,
  ClipboardCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'
import type { InventoryAudit, AuditStatus } from '@/types/stock'

const STATUS_LABELS: Record<AuditStatus, string> = {
  draft: 'Чернетка',
  posted: 'Проведено',
  void: 'Анульовано',
}

const STATUS_CLASSES: Record<AuditStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  posted: 'bg-green-100 text-green-700',
  void: 'bg-gray-100 text-gray-500',
}

export default function AdminStockAuditsPage() {
  const router = useRouter()
  const { token: csrfToken } = useCSRF()
  const [audits, setAudits] = useState<InventoryAudit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)

  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/stock/audits?page=${page}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAudits(json.data)
      setTotal(json.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/stock/audits/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка видалення')
    } finally {
      setDeleting(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stock"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            Інвентаризація
          </h1>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/stock/audits/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новий акт
        </button>
      </div>

      {/* List */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-dental-primary-600" />
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50">{error}</div>
        )}
        {!loading && !error && audits.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <ClipboardCheck className="w-10 h-10 text-dental-text/40" />
            <p className="text-dental-text text-sm">Інвентаризацій ще немає</p>
            <button
              type="button"
              onClick={() => router.push('/admin/stock/audits/new')}
              className="text-sm text-dental-primary-600 hover:underline"
            >
              Створити перший акт →
            </button>
          </div>
        )}

        {!loading && audits.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-dental-text">
                  Номер
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text hidden sm:table-cell">
                  Дата
                </th>
                <th className="px-4 py-3 font-medium text-dental-text">
                  Статус
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {audits.map(audit => (
                <tr
                  key={audit.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {audit.status === 'posted' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 shrink-0 text-yellow-500" />
                      )}
                      <Link
                        href={`/admin/stock/audits/${audit.id}`}
                        className="font-mono text-dental-primary-600 hover:underline"
                      >
                        {audit.audit_number}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dental-text hidden sm:table-cell">
                    {audit.audit_date}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_CLASSES[audit.status]
                      }`}
                    >
                      {STATUS_LABELS[audit.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/stock/audits/${audit.id}`}
                      className="rounded-lg border border-dental-text/20 px-3 py-1.5 text-xs font-medium text-dental-text hover:bg-gray-100 transition-colors"
                    >
                      {audit.status === 'draft' ? 'Редагувати' : 'Переглянути'}
                    </Link>
                    {audit.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(audit.id)}
                        disabled={deleting === audit.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting === audit.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Видалити'
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            ←
          </button>
          <span className="text-sm text-dental-text">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
