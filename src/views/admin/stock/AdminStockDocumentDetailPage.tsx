'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Send, Undo2, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCSRF } from '@/hooks/useCSRF'
import { useConfirm } from '@/hooks/useConfirm'
import type { StockDocumentWithItems, DocType, DocStatus } from '@/types/stock'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  incoming: 'Прихідна',
  writeoff: 'Списання',
  return: 'Повернення',
  transfer: 'Переміщення',
  adjustment: 'Коригування',
}

const STATUS_STYLES: Record<DocStatus, string> = {
  draft: 'bg-dental-secondary-100 text-dental-muted',
  posted: 'bg-status-success-100 text-status-success-700',
  void: 'bg-status-error-100 text-status-error-700',
}

const STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Чернетка',
  posted: 'Проведено',
  void: 'Анульовано',
}

export default function AdminStockDocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const { confirm, confirmDialog } = useConfirm()
  const [doc, setDoc] = useState<StockDocumentWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [unpostReason, setUnpostReason] = useState('')
  const [showUnpostModal, setShowUnpostModal] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/stock/documents/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setDoc(json.data)
        else setError(json.error)
      })
      .catch(() => setError('Помилка завантаження'))
      .finally(() => setLoading(false))
  }, [id])

  async function postDocument() {
    if (
      !(await confirm({
        title: t('admin.stock.confirm.postDocument.title'),
        description: t('admin.stock.confirm.postDocument.description'),
        confirmLabel: t('admin.stock.confirm.postDocument.action'),
        severity: 'significant',
      }))
    )
      return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/stock/documents/${id}/post`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setDoc(prev => (prev ? { ...prev, status: 'posted' } : prev))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка проведення')
    } finally {
      setActionLoading(false)
    }
  }

  async function unpostDocument() {
    if (unpostReason.trim().length < 3) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/stock/documents/${id}/unpost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ reason: unpostReason.trim() }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setDoc(prev => (prev ? { ...prev, status: 'draft' } : prev))
      setShowUnpostModal(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка скасування')
    } finally {
      setActionLoading(false)
    }
  }

  async function deleteDocument() {
    if (
      !(await confirm({
        title: t('admin.stock.confirm.deleteDocument.title'),
        description: t('admin.stock.confirm.deleteDocument.description'),
        confirmLabel: t('admin.stock.confirm.deleteDocument.action'),
        severity: 'irreversible',
      }))
    )
      return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/stock/documents/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      router.push('/admin/stock/documents')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка видалення')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-dental-primary-600" />
      </div>
    )
  }

  if (error && !doc) {
    return (
      <div className="p-6">
        <p className="text-status-error-700">{error}</p>
        <Link
          href="/admin/stock/documents"
          className="mt-4 inline-block text-dental-primary-600 underline"
        >
          Назад до списку
        </Link>
      </div>
    )
  }

  if (!doc) return null

  const isDraft = doc.status === 'draft'
  const isPosted = doc.status === 'posted'

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/stock/documents"
              className="text-dental-text hover:text-dental-primary-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
                {DOC_TYPE_LABELS[doc.doc_type]} № {doc.doc_number}
              </h1>
              <span
                className={`inline-flex mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}
              >
                {STATUS_LABELS[doc.status]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <button
                  onClick={deleteDocument}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dental-error/20 px-3 py-2 text-sm text-status-error-700 hover:bg-status-error-100 disabled:opacity-60 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Видалити
                </button>
                <button
                  onClick={postDocument}
                  disabled={actionLoading || doc.items.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Провести
                </button>
              </>
            )}
            {isPosted && doc.doc_type === 'writeoff' && (
              <button
                onClick={() => setShowUnpostModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-dental-warning/30 px-3 py-2 text-sm text-status-warning-700 hover:bg-status-warning-100 disabled:opacity-60 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
                Скасувати проведення
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-white p-5 mb-4">
          <h2 className="text-sm font-semibold text-dental-dark mb-3">
            Деталі документа
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-dental-text">Дата</dt>
              <dd className="font-medium text-dental-dark">
                {new Date(doc.doc_date).toLocaleDateString('uk-UA')}
              </dd>
            </div>
            <div>
              <dt className="text-dental-text">Сума</dt>
              <dd className="font-medium text-dental-dark">
                {doc.total_amount.toFixed(2)} грн
              </dd>
            </div>
            {doc.comment && (
              <div className="col-span-2">
                <dt className="text-dental-text">Коментар</dt>
                <dd className="font-medium text-dental-dark">{doc.comment}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold text-dental-dark mb-3">
            Позиції ({doc.items.length})
          </h2>
          {doc.items.length === 0 ? (
            <p className="text-sm text-dental-text text-center py-6">
              Немає позицій
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-dental-text">
                  <th className="pb-2 font-medium">Матеріал</th>
                  <th className="pb-2 font-medium text-right">К-сть</th>
                  <th className="pb-2 font-medium text-right">Ціна</th>
                  <th className="pb-2 font-medium text-right">Сума</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {doc.items.map(item => (
                  <tr key={item.id} className="text-dental-dark">
                    <td className="py-2">{item.material_id}</td>
                    <td className="py-2 text-right">{item.unit_qty}</td>
                    <td className="py-2 text-right">
                      {item.unit_cost.toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      {item.line_total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showUnpostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
            <h2 className="text-lg font-semibold text-dental-dark mb-4">
              Скасувати проведення
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dental-dark mb-1">
                  Причина
                </label>
                <textarea
                  value={unpostReason}
                  onChange={e => setUnpostReason(e.target.value)}
                  rows={3}
                  placeholder="Мінімум 3 символи..."
                  className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowUnpostModal(false)}
                  className="px-4 py-2 text-sm text-dental-text hover:text-dental-dark"
                >
                  Відмінити
                </button>
                <button
                  onClick={unpostDocument}
                  disabled={unpostReason.trim().length < 3 || actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-status-warning-700 px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60 transition-colors"
                >
                  {actionLoading && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Підтвердити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </>
  )
}
