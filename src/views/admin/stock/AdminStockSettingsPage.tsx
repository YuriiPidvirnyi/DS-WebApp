'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'
import { useTranslation } from 'react-i18next'
import type { ClinicSettings, WriteoffMode } from '@/types/stock'

const WRITEOFF_MODE_LABEL_KEYS: Record<WriteoffMode, string> = {
  none: 'admin.stock.settingsPage.writeoffModeNoneLabel',
  draft_hybrid: 'admin.stock.settingsPage.writeoffModeDraftHybridLabel',
  auto: 'admin.stock.settingsPage.writeoffModeAutoLabel',
}

const WRITEOFF_MODE_HINT_KEYS: Record<WriteoffMode, string> = {
  none: 'admin.stock.settingsPage.writeoffModeNoneHint',
  draft_hybrid: 'admin.stock.settingsPage.writeoffModeDraftHybridHint',
  auto: 'admin.stock.settingsPage.writeoffModeAutoHint',
}

interface SettingRow {
  key: string
  value: unknown
}

function parseSettings(rows: SettingRow[]): ClinicSettings {
  const map: Record<string, unknown> = {}
  for (const r of rows) map[r.key] = r.value
  return {
    allow_negative_balance: Boolean(map.allow_negative_balance ?? false),
    writeoff_mode: (map.writeoff_mode as WriteoffMode) ?? 'none',
    auto_ap_bill_on_incoming: Boolean(map.auto_ap_bill_on_incoming ?? false),
    default_expense_category_id:
      (map.default_expense_category_id as string | null) ?? null,
    enforce_stock_permissions: Boolean(map.enforce_stock_permissions ?? true),
    show_my_inventory: Boolean(map.show_my_inventory ?? true),
  }
}

export default function AdminStockSettingsPage() {
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/stock/clinic-settings')
      .then(r => r.json())
      .then((j: { success: boolean; data?: SettingRow[] }) => {
        if (j.success && j.data) setSettings(parseSettings(j.data))
      })
      .catch(() => setError(t('admin.stock.settingsPage.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/stock/clinic-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          allow_negative_balance: settings.allow_negative_balance,
          writeoff_mode: settings.writeoff_mode,
          enforce_stock_permissions: settings.enforce_stock_permissions,
          show_my_inventory: settings.show_my_inventory,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('admin.stock.settingsPage.saveError')
      )
    } finally {
      setSaving(false)
    }
  }

  function update<K extends keyof ClinicSettings>(
    key: K,
    value: ClinicSettings[K]
  ) {
    setSettings(prev => (prev ? { ...prev, [key]: value } : prev))
    setSaved(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/stock"
          className="text-dental-text hover:text-dental-primary-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
          {t('admin.stock.settingsPage.title')}
        </h1>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-dental-primary-600" />
        </div>
      )}

      {!loading && settings && (
        <div className="space-y-4">
          {/* Writeoff mode */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold text-dental-dark mb-3">
              {t('admin.stock.settingsPage.writeoffModeHeading')}
            </h2>
            <div className="space-y-3">
              {(['none', 'draft_hybrid', 'auto'] as WriteoffMode[]).map(
                mode => (
                  <label
                    key={mode}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      settings.writeoff_mode === mode
                        ? 'border-dental-primary-600 bg-dental-primary/5'
                        : 'border-dental-secondary-200 hover:bg-dental-secondary-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="writeoff_mode"
                      value={mode}
                      checked={settings.writeoff_mode === mode}
                      onChange={() => update('writeoff_mode', mode)}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-dental-dark">
                        {t(WRITEOFF_MODE_LABEL_KEYS[mode])}
                      </p>
                      <p className="text-xs text-dental-text mt-0.5">
                        {t(WRITEOFF_MODE_HINT_KEYS[mode])}
                      </p>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-dental-dark">
              {t('admin.stock.settingsPage.additionalParamsHeading')}
            </h2>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-dental-dark">
                  {t('admin.stock.settingsPage.allowNegativeBalanceLabel')}
                </p>
                <p className="text-xs text-dental-text mt-0.5">
                  {t('admin.stock.settingsPage.allowNegativeBalanceHint')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_negative_balance}
                onChange={e =>
                  update('allow_negative_balance', e.target.checked)
                }
                className="rounded ml-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-dental-dark">
                  {t('admin.stock.settingsPage.enforcePermissionsLabel')}
                </p>
                <p className="text-xs text-dental-text mt-0.5">
                  {t('admin.stock.settingsPage.enforcePermissionsHint')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enforce_stock_permissions}
                onChange={e =>
                  update('enforce_stock_permissions', e.target.checked)
                }
                className="rounded ml-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-dental-dark">
                  {t('admin.stock.settingsPage.showMyInventoryLabel')}
                </p>
                <p className="text-xs text-dental-text mt-0.5">
                  {t('admin.stock.settingsPage.showMyInventoryHint')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.show_my_inventory}
                onChange={e => update('show_my_inventory', e.target.checked)}
                className="rounded ml-4 shrink-0"
              />
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
              className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved && <CheckCircle2 className="w-4 h-4" />}
              {saved
                ? t('admin.stock.settingsPage.saved')
                : t('admin.stock.settingsPage.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
