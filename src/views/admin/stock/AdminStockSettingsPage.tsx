'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'
import type { ClinicSettings, WriteoffMode } from '@/types/stock'

const WRITEOFF_MODE_LABELS: Record<WriteoffMode, string> = {
  none: 'Без автосписання',
  draft_hybrid: 'Автосписання-чернетка (рекомендовано)',
  auto: 'Повністю автоматичне',
}

const WRITEOFF_MODE_HINTS: Record<WriteoffMode, string> = {
  none: 'Матеріали не списуються автоматично при завершенні прийому.',
  draft_hybrid:
    'При завершенні прийому автоматично створюється чернетка списання за картками розрахунку. Персонал може редагувати та проводити вручну.',
  auto: 'Чернетка створюється та одразу проводиться. Рекомендується лише після стабілізації карток розрахунку (>90 днів).',
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
      .catch(() => setError('Не вдалося завантажити налаштування'))
      .finally(() => setLoading(false))
  }, [])

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
      setError(e instanceof Error ? e.message : 'Помилка збереження')
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
    <div className="min-h-screen bg-gray-50 p-6">
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
            Налаштування складу
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
                Тип автосписання матеріалів
              </h2>
              <div className="space-y-3">
                {(['none', 'draft_hybrid', 'auto'] as WriteoffMode[]).map(
                  mode => (
                    <label
                      key={mode}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        settings.writeoff_mode === mode
                          ? 'border-dental-primary-600 bg-dental-primary/5'
                          : 'border-gray-200 hover:bg-gray-50'
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
                          {WRITEOFF_MODE_LABELS[mode]}
                        </p>
                        <p className="text-xs text-dental-text mt-0.5">
                          {WRITEOFF_MODE_HINTS[mode]}
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
                Додаткові параметри
              </h2>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-dental-dark">
                    Дозволити негативний залишок
                  </p>
                  <p className="text-xs text-dental-text mt-0.5">
                    Рекомендується ввімкнути на перші 30–60 днів після запуску
                    для поступового введення залишків.
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
                    Використовувати права доступу
                  </p>
                  <p className="text-xs text-dental-text mt-0.5">
                    Якщо вимкнено — всі співробітники мають повний доступ до
                    всіх складів.
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
                    Показувати «Моя інвентаризація»
                  </p>
                  <p className="text-xs text-dental-text mt-0.5">
                    Персональна перевірка залишків per-warehouse для кожного
                    співробітника.
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
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
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
                {saved ? 'Збережено' : 'Зберегти'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
