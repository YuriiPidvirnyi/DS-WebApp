'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Download, Trash2, AlertTriangle, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCSRF } from '@/hooks/useCSRF'
import { captureException } from '@/utils/sentry'

export default function CabinetSettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { getHeaders } = useCSRF()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleExport = () => {
    window.open('/api/cabinet/export', '_blank')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/cabinet/delete-account', {
        method: 'DELETE',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }

      const supabase = createClient()
      if (supabase) {
        await supabase.auth.signOut()
      }

      router.push('/')
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setDeleteError(t('cabinet.error.description'))
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dental-dark">
          {t('cabinet.settings.title')}
        </h1>
        <p className="mt-1 text-sm text-dental-muted">
          {t('cabinet.settings.subtitle')}
        </p>
      </div>

      {/* Export section */}
      <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-dental-primary-50 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-dental-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-dental-dark">
              {t('cabinet.settings.exportSection.title')}
            </h2>
            <p className="mt-1 text-sm text-dental-muted">
              {t('cabinet.settings.exportSection.description')}
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-dental-primary-600 hover:bg-dental-primary-700 text-white text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 focus:ring-offset-2"
            >
              <Download className="w-4 h-4" />
              {t('cabinet.settings.exportSection.button')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete account section */}
      <div className="bg-white rounded-2xl shadow-xs border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-dental-dark">
              {t('cabinet.settings.deleteSection.title')}
            </h2>
            <p className="mt-1 text-sm text-dental-muted">
              {t('cabinet.settings.deleteSection.description')}
            </p>

            {deleteError && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {deleteError}
              </div>
            )}

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-300 text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('cabinet.settings.deleteSection.button')}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {t('cabinet.settings.deleteSection.confirm')}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('cabinet.settings.deleteSection.deleting')}
                      </>
                    ) : (
                      t('cabinet.settings.deleteSection.confirmButton')
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteError(null)
                    }}
                    disabled={deleting}
                    className="px-4 py-2.5 text-dental-muted hover:text-dental-dark text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-secondary-300 focus:ring-offset-2"
                  >
                    {t('cabinet.settings.deleteSection.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
