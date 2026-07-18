'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Download, Trash2, AlertTriangle, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCSRF } from '@/hooks/useCSRF'
import { captureException } from '@/utils/sentry'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
      setShowDeleteConfirm(false)
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
            <Shield className="w-5 h-5 text-dental-primary-ink" />
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
      <div className="bg-white rounded-2xl shadow-xs border border-dental-error/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-status-error-100 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-dental-error" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-dental-dark">
              {t('cabinet.settings.deleteSection.title')}
            </h2>
            <p className="mt-1 text-sm text-dental-muted">
              {t('cabinet.settings.deleteSection.description')}
            </p>

            {deleteError && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-status-error-100 border border-dental-error/20 text-status-error-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {deleteError}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setDeleteError(null)
                setShowDeleteConfirm(true)
              }}
              className="mt-4 inline-flex min-h-11 items-center gap-2 px-4 py-2.5 bg-white hover:bg-status-error-100 text-status-error-700 border border-dental-error/30 text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-error focus:ring-offset-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('cabinet.settings.deleteSection.button')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        severity="irreversible"
        title={t('cabinet.settings.deleteSection.title')}
        description={t('cabinet.settings.deleteSection.description')}
        warning={t('confirmDialog.irreversibleWarning')}
        confirmationWord={t('cabinet.settings.deleteSection.confirmWord')}
        confirmLabel={t('cabinet.settings.deleteSection.confirmButton')}
        cancelLabel={t('cabinet.settings.deleteSection.cancel')}
        isLoading={deleting}
        onConfirm={handleDeleteAccount}
        onClose={() => {
          if (deleting) return
          setShowDeleteConfirm(false)
        }}
      />
    </div>
  )
}
