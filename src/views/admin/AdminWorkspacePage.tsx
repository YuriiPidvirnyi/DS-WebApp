'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Info } from 'lucide-react'
import {
  Button,
  ErrorState,
  Input,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
  type StatusTone,
} from '@/components/ui'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { can, hasDoctorScope } from '@/lib/permissions'
import { useConfirm } from '@/hooks/useConfirm'
import { useCSRF } from '@/hooks/useCSRF'
import { createClient } from '@/lib/supabase/client'
import { computeTotalCost } from '@/lib/treatment-cost'
import { captureException } from '@/utils/sentry'
import { showError, showSuccess } from '@/utils/toast'
import { formatCurrency, getJoinedFieldValue } from './utils'

type ApptStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
type ActStatus = 'draft' | 'signed' | 'completed'
type PayStatus = 'unpaid' | 'partial' | 'paid' | 'waived' | 'refunded'

type JoinedField = Record<string, unknown> | Record<string, unknown>[] | null

interface Appt {
  id: string
  patient_id: string | null
  doctor_id: string | null
  patient_name: string | null
  guest_name: string | null
  appointment_date: string
  appointment_time: string
  duration_minutes: number | null
  status: ApptStatus
  services: JoinedField
}
interface FormLine {
  serviceId: string
  toothNumber: string
  quantity: string
  price: string
}
type SvcOpt = { id: string; name_uk: string; price_uah: number }

// Appointment status → semantic tone (Ф-3 scale, mirrors the 1f StatusBadge).
const APPT_TONE: Record<ApptStatus, StatusTone> = {
  pending: 'warning',
  confirmed: 'accent',
  completed: 'success',
  cancelled: 'neutral',
  no_show: 'error',
}
// Act lifecycle tones — identical to the treatments page (draft→signed→completed).
const ACT_TONE: Record<ActStatus, StatusTone> = {
  draft: 'neutral',
  signed: 'accent',
  completed: 'success',
}
const PAY_TONE: Record<PayStatus, StatusTone> = {
  unpaid: 'error',
  partial: 'warning',
  paid: 'success',
  waived: 'neutral',
  refunded: 'neutral',
}
const ACT_FLOW: ActStatus[] = ['draft', 'signed', 'completed']

const emptyLine = (): FormLine => ({
  serviceId: '',
  toothNumber: '',
  quantity: '1',
  price: '',
})
function parseTeeth(s: string) {
  return s
    .split(/[,;\s]+/)
    .map(x => x.trim())
    .filter(Boolean)
}
function linesToPayload(lines: FormLine[]) {
  return lines
    .filter(l => l.serviceId)
    .map(l => ({
      serviceId: l.serviceId,
      toothNumber: l.toothNumber.trim() || null,
      quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
      priceAtTime: Number(l.price) || 0,
    }))
}
function toMinutes(hhmmss: string) {
  const [h, m] = hhmmss.split(':').map(n => parseInt(n, 10) || 0)
  return h * 60 + m
}

/**
 * Робоче місце лікаря (макет 2e): день прийомів + акт робіт на одному екрані.
 * Лівий стовпець — власні записи лікаря на сьогодні (RBAC: тільки свої); правий —
 * акт, підставлений з обраного прийому (пацієнт/лікар/візит), із життєвим циклом
 * Чернетка → Підписано → Завершено. «Підписати акт» — значуща дія (патерн 1d).
 */
export default function AdminWorkspacePage() {
  const { t, i18n } = useTranslation()
  const { user } = useAdminAuth()
  const { confirm, confirmDialog } = useConfirm()
  const { token: csrfToken, refreshToken } = useCSRF()

  const isDoctor = user ? hasDoctorScope(user.role) : false
  const canSign = user ? can(user.role, 'treatments:sign') : false
  const canCreate = user ? can(user.role, 'treatments:create') : false

  const [appts, setAppts] = useState<Appt[]>([])
  const [services, setServices] = useState<SvcOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Act editor state (for the selected appointment)
  const [actId, setActId] = useState<string | null>(null)
  const [actStatus, setActStatus] = useState<ActStatus>('draft')
  const [payStatus, setPayStatus] = useState<PayStatus>('unpaid')
  const [diagnosis, setDiagnosis] = useState('')
  const [teethStr, setTeethStr] = useState('')
  const [lines, setLines] = useState<FormLine[]>([emptyLine()])
  const [actLoading, setActLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  // Monotonic token so a slow openAct() lookup can't overwrite a newer
  // selection ("latest request wins") — see review #2.
  const openReqRef = useRef(0)

  const csrf = useCallback(
    () =>
      csrfToken ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('csrf_token') || refreshToken()
        : ''),
    [csrfToken, refreshToken]
  )

  const load = useCallback(async () => {
    const sb = createClient()
    if (!sb) {
      setError(t('common.error'))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    // A doctor with no linked doctorId can't be scoped app-side; don't fall back
    // to fetching (and RLS-filtering) every doctor's day — show empty instead
    // of relying on RLS alone for the scoping this screen promises (review #9).
    if (isDoctor && !user?.doctorId) {
      setAppts([])
      setServices([])
      setLoading(false)
      return
    }
    try {
      const today = new Date().toISOString().slice(0, 10)
      let q = sb
        .from('appointments')
        .select(
          'id, patient_id, doctor_id, patient_name, guest_name, appointment_date, appointment_time, duration_minutes, status, services(name_uk)'
        )
        .eq('appointment_date', today)
      // Defense-in-depth on top of RLS: doctors see only their own day.
      if (isDoctor && user?.doctorId) q = q.eq('doctor_id', user.doctorId)
      const [apptRes, svcRes] = await Promise.all([
        q.order('appointment_time', { ascending: true }),
        sb
          .from('services')
          .select('id, name_uk, price_uah')
          .eq('is_active', true)
          .order('name_uk'),
      ])
      if (apptRes.error) throw apptRes.error
      setAppts((apptRes.data ?? []) as unknown as Appt[])
      setServices((svcRes.data ?? []) as unknown as SvcOpt[])
    } catch (e) {
      captureException(e instanceof Error ? e : new Error(String(e)))
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t, isDoctor, user?.doctorId])

  useEffect(() => {
    void load()
  }, [load])

  // The live "Йде прийом" badge derives from the wall clock, which is only
  // re-read on render — without a periodic nudge an appointment would never
  // flip to/from live on its own while the page sits open. Tick every minute
  // (badge granularity is start/end of a slot, so sub-minute isn't needed).
  const [, setClockTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setClockTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Fresh clock each render so the "in progress" indicator reflects the wall time.
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const isLive = (a: Appt) => {
    if (a.status !== 'confirmed') return false
    const start = toMinutes(a.appointment_time)
    return nowMin >= start && nowMin < start + (a.duration_minutes ?? 30)
  }

  const selected = appts.find(a => a.id === selectedId) ?? null

  // Load (or reset to a fresh draft for) the act tied to the selected appointment.
  const openAct = useCallback(
    async (appt: Appt) => {
      const reqId = ++openReqRef.current
      setSelectedId(appt.id)
      // Guest bookings have no patient record — an act cannot be attached.
      if (!appt.patient_id) {
        setActId(null)
        setLines([emptyLine()])
        setDiagnosis('')
        setTeethStr('')
        setActStatus('draft')
        setPayStatus('unpaid')
        return
      }
      setActLoading(true)
      try {
        // Fetch only this appointment's act (server-side appointmentId filter),
        // not the patient's whole treatment history.
        const res = await fetch(
          `/api/treatment-records?appointmentId=${encodeURIComponent(appt.id)}`
        )
        // A newer selection superseded this one while we awaited — drop it (#2).
        if (openReqRef.current !== reqId) return
        // A failed lookup must NOT silently present a blank draft — that risks a
        // duplicate act on save if an act actually exists (#4).
        if (!res.ok) throw new Error(`lookup failed (${res.status})`)
        const json = (await res.json()) as {
          success?: boolean
          data?: Array<{
            id: string
            appointment_id: string | null
            diagnosis: string | null
            tooth_numbers: string[] | null
            status: ActStatus
            payment_status: PayStatus
            treatment_record_items: Array<{
              service_id: string
              tooth_number: string | null
              quantity: number
              price_at_time: number
            }> | null
          }>
        }
        const existing = json.data?.find(r => r.appointment_id === appt.id)
        if (existing) {
          setActId(existing.id)
          setDiagnosis(existing.diagnosis ?? '')
          setTeethStr((existing.tooth_numbers ?? []).join(', '))
          setActStatus(existing.status)
          setPayStatus(existing.payment_status)
          const its = existing.treatment_record_items ?? []
          setLines(
            its.length
              ? its.map(it => ({
                  serviceId: it.service_id,
                  toothNumber: it.tooth_number ?? '',
                  quantity: String(it.quantity),
                  price: String(it.price_at_time),
                }))
              : [emptyLine()]
          )
        } else {
          setActId(null)
          setDiagnosis('')
          setTeethStr('')
          setActStatus('draft')
          setPayStatus('unpaid')
          setLines([emptyLine()])
        }
      } catch (e) {
        // Ignore errors from a superseded request; only surface the current one.
        if (openReqRef.current === reqId) {
          captureException(e instanceof Error ? e : new Error(String(e)))
          showError(t('common.error'))
          // Couldn't determine the act state — deselect so the doctor can't
          // accidentally create a duplicate over an existing act (#4).
          setSelectedId(null)
        }
      } finally {
        if (openReqRef.current === reqId) setActLoading(false)
      }
    },
    [t]
  )

  // Display exactly what will be billed: run the lines through the same payload
  // mapper and the shared cost calc the server uses, so the on-screen total is
  // literally the persisted total — one source of truth, no drift (review #6).
  const total = useMemo(() => computeTotalCost(linesToPayload(lines)), [lines])

  const patchLine = (idx: number, patch: Partial<FormLine>) =>
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  const onServicePick = (idx: number, serviceId: string) => {
    const svc = services.find(s => s.id === serviceId)
    patchLine(idx, {
      serviceId,
      price: svc ? String(svc.price_uah) : '',
    })
  }

  // Persist the act (create if new, else update). Returns the act id or null.
  const persist = useCallback(
    async (nextStatus?: ActStatus): Promise<string | null> => {
      if (!selected?.patient_id) return null
      const items = linesToPayload(lines)
      const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf(),
      }
      try {
        if (!actId) {
          // The act must be attributed to a doctor. Normally the appointment
          // carries one; if it doesn't and the viewer isn't a doctor, bail with
          // a clear message rather than POSTing an empty doctor_id (review #4).
          const doctorId = selected.doctor_id ?? user?.doctorId ?? ''
          if (!doctorId) {
            showError(t('admin.workspacePage.noDoctorError'))
            return null
          }
          const res = await fetch('/api/treatment-records', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              appointmentId: selected.id,
              patientId: selected.patient_id,
              doctorId,
              toothNumbers: parseTeeth(teethStr),
              diagnosis: diagnosis.trim() || null,
              items,
            }),
          })
          const json = (await res.json()) as {
            success?: boolean
            data?: { id: string }
            error?: string
          }
          if (!res.ok || !json.success || !json.data)
            throw new Error(json.error || 'create failed')
          const id = json.data.id
          // Record the new act id immediately so a failed sign PATCH (below)
          // becomes an update-retry, not a second POST that duplicates the act
          // (review #1).
          setActId(id)
          // POST always lands as 'draft'; sign it with a follow-up PATCH.
          if (nextStatus && nextStatus !== 'draft') {
            const r2 = await fetch(`/api/treatment-records/${id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ status: nextStatus }),
            })
            const j2 = (await r2.json()) as {
              success?: boolean
              error?: string
            }
            if (!r2.ok || !j2.success)
              throw new Error(j2.error || 'sign failed')
          }
          return id
        }
        // Existing act — PATCH the editable fields (+ status when signing).
        const body: Record<string, unknown> = {
          diagnosis: diagnosis.trim() || null,
          toothNumbers: parseTeeth(teethStr),
          items,
        }
        if (nextStatus) body.status = nextStatus
        const res = await fetch(`/api/treatment-records/${actId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body),
        })
        const json = (await res.json()) as { success?: boolean; error?: string }
        if (!res.ok || !json.success)
          throw new Error(json.error || 'update failed')
        return actId
      } catch (e) {
        captureException(e instanceof Error ? e : new Error(String(e)))
        showError(t('common.error'))
        return null
      }
    },
    [actId, selected, lines, teethStr, diagnosis, user?.doctorId, csrf, t]
  )

  const saveDraft = async () => {
    setSaving(true)
    const id = await persist()
    setSaving(false)
    if (id) {
      setActStatus('draft')
      showSuccess(t('admin.workspacePage.draftSaved'))
    }
  }

  const signAct = async () => {
    if (linesToPayload(lines).length === 0) {
      showError(t('admin.workspacePage.needServices'))
      return
    }
    const patient = selected?.patient_name || selected?.guest_name || ''
    const ok = await confirm({
      severity: 'significant',
      title: t('admin.workspacePage.signConfirmTitle'),
      description: t('admin.workspacePage.signConfirmDesc', { patient }),
      confirmLabel: t('admin.workspacePage.signAct'),
    })
    if (!ok) return
    setSaving(true)
    const id = await persist('signed')
    setSaving(false)
    if (id) {
      setActStatus('signed')
      showSuccess(t('admin.workspacePage.actSigned'))
    }
  }

  const apptName = (a: Appt) => a.patient_name || a.guest_name || '—'
  const svcName = (a: Appt) => getJoinedFieldValue(a.services, 'name_uk', '—')
  const dateLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    } catch {
      return ''
    }
  }, [i18n.language])

  const editable = actStatus === 'draft'

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {confirmDialog}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-dental-dark">
            {t('admin.workspacePage.title')}
          </h1>
          <p className="mt-1 text-sm text-dental-muted">
            {/* Only doctors are scoped to their own day; a non-doctor admin sees
                every doctor's appointments, so don't mislead them (review #1). */}
            {isDoctor
              ? t('admin.appointmentsPage.doctorScopeNotice')
              : t('admin.workspacePage.allAppointmentsNotice')}
          </p>
        </div>
        <div className="text-sm font-medium text-dental-muted">
          {dateLabel}
          {user?.name ? ` · ${user.name}` : ''}
        </div>
      </div>

      {error ? (
        <ErrorState title={error} onRetry={() => void load()} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* ── Left: today's appointments ── */}
          <div className="flex flex-col gap-2">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </>
            ) : appts.length === 0 ? (
              <div className="rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-sm text-dental-muted">
                {t('admin.workspacePage.emptyToday')}
              </div>
            ) : (
              appts.map(a => {
                const live = isLive(a)
                const active = a.id === selectedId
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => void openAct(a)}
                    aria-pressed={active}
                    // Block switching appointments mid-save: otherwise a slow
                    // persist() for the previous appointment can resolve after a
                    // new one is selected and clobber its actId/actStatus, so the
                    // next save would PATCH the wrong record (review #6).
                    disabled={saving}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      active
                        ? 'border-dental-primary-400 bg-dental-primary-50 ring-1 ring-dental-primary-200'
                        : 'border-dental-secondary-200 bg-white hover:border-dental-primary-300 hover:bg-dental-secondary-50'
                    }`}
                  >
                    <span className="w-12 shrink-0 pt-0.5 text-sm font-semibold text-dental-dark tabular-nums">
                      {a.appointment_time.slice(0, 5)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-dental-dark">
                        {apptName(a)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-dental-muted">
                        {svcName(a)}
                        {a.duration_minutes
                          ? ` · ${a.duration_minutes} ${t('admin.workspacePage.minutesShort')}`
                          : ''}
                      </span>
                    </span>
                    {live ? (
                      <StatusBadge tone="accent" live>
                        {t('admin.workspacePage.liveNow')}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone={APPT_TONE[a.status]}>
                        {t(`admin.appointmentStatuses.${a.status}`)}
                      </StatusBadge>
                    )}
                  </button>
                )
              })
            )}

            {isDoctor && (
              <div className="mt-1 flex items-start gap-2 rounded-xl bg-dental-primary-50 px-4 py-3 text-xs leading-relaxed text-dental-text">
                <Info
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-dental-primary-600"
                />
                {t('admin.workspacePage.roleNotice')}
              </div>
            )}
          </div>

          {/* ── Right: act editor ── */}
          <div className="rounded-2xl border border-dental-secondary-200 bg-white p-6">
            {!selected ? (
              <p className="py-16 text-center text-sm text-dental-muted">
                {t('admin.workspacePage.selectHint')}
              </p>
            ) : !selected.patient_id ? (
              <p className="py-16 text-center text-sm text-dental-muted">
                {t('admin.workspacePage.guestNoAct')}
              </p>
            ) : (
              <>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-dental-dark">
                    {t('admin.workspacePage.actTitle')} —{' '}
                    {selected.patient_name || selected.guest_name}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    {ACT_FLOW.map((s, i) => (
                      <span key={s} className="flex items-center gap-1.5">
                        {i > 0 && (
                          <span
                            aria-hidden="true"
                            className="text-dental-secondary-400"
                          >
                            →
                          </span>
                        )}
                        {s === actStatus ? (
                          <StatusBadge tone={ACT_TONE[s]}>
                            {t(`admin.treatmentsPage.statuses.${s}`)}
                          </StatusBadge>
                        ) : (
                          <span className="text-xs text-dental-secondary-400">
                            {t(`admin.treatmentsPage.statuses.${s}`)}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mb-5 text-sm text-dental-text">
                  {t('admin.workspacePage.actSubtitle')}
                </p>

                {actLoading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <>
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem]">
                      <div>
                        <label
                          htmlFor="ws-diagnosis"
                          className="mb-1.5 block text-sm font-medium text-dental-dark"
                        >
                          {t('admin.treatmentsPage.modal.diagnosis')}
                        </label>
                        <Textarea
                          id="ws-diagnosis"
                          rows={2}
                          fullWidth
                          disabled={!editable}
                          value={diagnosis}
                          onChange={e => setDiagnosis(e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="ws-teeth"
                          className="mb-1.5 block text-sm font-medium text-dental-dark"
                        >
                          {t('admin.treatmentsPage.modal.teeth')}
                        </label>
                        <Input
                          id="ws-teeth"
                          fullWidth
                          disabled={!editable}
                          value={teethStr}
                          onChange={e => setTeethStr(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Services table */}
                    <div className="overflow-hidden rounded-xl border border-dental-secondary-200">
                      <div className="hidden grid-cols-12 gap-2 bg-dental-secondary-50 px-3 py-2 text-[11px] font-semibold tracking-wider text-dental-muted uppercase sm:grid">
                        <span className="col-span-6">
                          {t('admin.treatmentsPage.modal.service')}
                        </span>
                        <span className="col-span-2">
                          {t('admin.treatmentsPage.modal.tooth')}
                        </span>
                        <span className="col-span-2">
                          {t('admin.treatmentsPage.modal.quantity')}
                        </span>
                        <span className="col-span-2">
                          {t('admin.treatmentsPage.modal.price')}
                        </span>
                      </div>
                      {lines.map((l, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 items-center gap-2 border-t border-dental-secondary-100 px-3 py-2 sm:grid-cols-12"
                        >
                          <div className="sm:col-span-6">
                            <Select
                              fullWidth
                              disabled={!editable}
                              value={l.serviceId}
                              onChange={e => onServicePick(idx, e.target.value)}
                              aria-label={t(
                                'admin.treatmentsPage.modal.service'
                              )}
                            >
                              <option value="">—</option>
                              {services.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name_uk}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              fullWidth
                              disabled={!editable}
                              value={l.toothNumber}
                              onChange={e =>
                                patchLine(idx, { toothNumber: e.target.value })
                              }
                              aria-label={t('admin.treatmentsPage.modal.tooth')}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              type="number"
                              min={1}
                              fullWidth
                              disabled={!editable}
                              value={l.quantity}
                              onChange={e =>
                                patchLine(idx, { quantity: e.target.value })
                              }
                              aria-label={t(
                                'admin.treatmentsPage.modal.quantity'
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-1 sm:col-span-2">
                            <Input
                              type="number"
                              min={0}
                              fullWidth
                              disabled={!editable}
                              value={l.price}
                              onChange={e =>
                                patchLine(idx, { price: e.target.value })
                              }
                              aria-label={t('admin.treatmentsPage.modal.price')}
                            />
                            {editable && lines.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setLines(prev =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                aria-label={t(
                                  'admin.treatmentsPage.removeLineAria'
                                )}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-status-error-700 hover:bg-status-error-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {editable && (
                      <button
                        type="button"
                        onClick={() => setLines(prev => [...prev, emptyLine()])}
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-dental-primary-300 px-4 text-sm font-semibold text-dental-primary-600 hover:bg-dental-primary-50"
                      >
                        <Plus className="h-4 w-4" />
                        {t('admin.treatmentsPage.modal.addLine')}
                      </button>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-status-neutral-100 pt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-dental-dark">
                          {t('admin.workspacePage.total')}:{' '}
                          {formatCurrency(total)}
                        </span>
                        <StatusBadge tone={PAY_TONE[payStatus]}>
                          {t(`admin.treatmentsPage.payStatuses.${payStatus}`)}
                        </StatusBadge>
                      </div>
                      {editable && (
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-11"
                            isLoading={saving}
                            disabled={!canCreate || saving}
                            onClick={() => void saveDraft()}
                          >
                            {t('admin.workspacePage.saveDraft')}
                          </Button>
                          {canSign && (
                            <Button
                              type="button"
                              size="sm"
                              className="min-h-11"
                              isLoading={saving}
                              disabled={saving}
                              onClick={() => void signAct()}
                            >
                              {t('admin.workspacePage.signAct')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
