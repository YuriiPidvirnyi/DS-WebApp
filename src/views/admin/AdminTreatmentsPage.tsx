'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Edit, Package, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { useCSRF } from '@/hooks/useCSRF'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import AdminModal from './components/AdminModal'
import { formatCurrency, formatDateTime } from './utils'

type TreatmentStatus = 'draft' | 'signed' | 'completed'
type PayStatus = 'unpaid' | 'partial' | 'paid' | 'waived' | 'refunded'
interface TrItem {
  service_id: string
  tooth_number: string | null
  quantity: number
  price_at_time: number
}
interface TreatmentRow {
  id: string
  appointment_id: string | null
  patient_id: string
  doctor_id: string
  tooth_numbers: string[] | null
  diagnosis: string | null
  notes: string | null
  status: TreatmentStatus
  total_cost: number
  payment_status: PayStatus
  created_at: string
  patients: { first_name: string | null; last_name: string | null } | null
  doctors: { first_name: string | null; last_name: string | null } | null
  treatment_record_items: TrItem[] | null
  treatment_materials_used?: Array<{
    material_id: string
    quantity_used: number
  }> | null
}
interface FormLine {
  serviceId: string
  toothNumber: string
  quantity: string
  price: string
}
type PatOpt = {
  id: string
  first_name: string | null
  last_name: string | null
}
type DocOpt = { id: string; first_name: string; last_name: string }
type SvcOpt = { id: string; name_uk: string; price_uah: number }
type ApptOpt = {
  id: string
  appointment_date: string
  appointment_time: string
  patient_name: string | null
  guest_name: string | null
}
type MatOpt = {
  id: string
  name_uk: string
  unit: string
  current_quantity: number
  image_url: string | null
}
interface MatUsedLine {
  materialId: string
  quantityUsed: string
}

const ST_CSS: Record<TreatmentStatus, string> = {
  draft: 'bg-amber-100 text-amber-800',
  signed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}
const PY_CSS: Record<PayStatus, string> = {
  unpaid: 'bg-red-100 text-red-800',
  partial: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  waived: 'bg-gray-100 text-gray-700',
  refunded: 'bg-slate-100 text-slate-700',
}
const TREATMENT_STATUSES: TreatmentStatus[] = ['draft', 'signed', 'completed']
const PAY_STATUSES: PayStatus[] = [
  'unpaid',
  'partial',
  'paid',
  'waived',
  'refunded',
]
const FILTER_STATUSES: ('all' | TreatmentStatus)[] = [
  'all',
  'draft',
  'signed',
  'completed',
]

function person(
  r: { first_name: string | null; last_name: string | null } | null
) {
  if (!r) return '—'
  const n = [r.first_name, r.last_name].filter(Boolean).join(' ')
  return n || '—'
}
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
const emptyLine = (): FormLine => ({
  serviceId: '',
  toothNumber: '',
  quantity: '1',
  price: '',
})
const emptyMatLine = (): MatUsedLine => ({ materialId: '', quantityUsed: '1' })

export default function AdminTreatmentsPage() {
  const { t } = useTranslation()
  const { preferences } = useAdminPreferences()
  const { token: csrfToken, refreshToken } = useCSRF()
  const [rows, setRows] = useState<TreatmentRow[]>([])
  const [searchPatient, setSearchPatient] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TreatmentStatus>(
    'all'
  )
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [teethStr, setTeethStr] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TreatmentStatus>('draft')
  const [payStatus, setPayStatus] = useState<PayStatus>('unpaid')
  const [lines, setLines] = useState<FormLine[]>([emptyLine()])
  const [patients, setPatients] = useState<PatOpt[]>([])
  const [doctors, setDoctors] = useState<DocOpt[]>([])
  const [services, setServices] = useState<SvcOpt[]>([])
  const [appts, setAppts] = useState<ApptOpt[]>([])
  const [matCatalog, setMatCatalog] = useState<MatOpt[]>([])
  const [matLines, setMatLines] = useState<MatUsedLine[]>([])

  const csrf = useCallback(() => {
    return (
      csrfToken ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('csrf_token') || refreshToken()
        : '')
    )
  }, [csrfToken, refreshToken])

  const loadRefs = useCallback(async () => {
    const sb = createClient()
    if (!sb) return
    try {
      const [p, d, s, a] = await Promise.all([
        sb
          .from('patients')
          .select('id, first_name, last_name')
          .order('created_at', { ascending: false })
          .limit(300),
        sb
          .from('doctors')
          .select('id, first_name, last_name')
          .eq('is_active', true)
          .order('last_name'),
        sb
          .from('services')
          .select('id, name_uk, price_uah')
          .eq('is_active', true)
          .order('name_uk'),
        sb
          .from('appointments')
          .select(
            'id, appointment_date, appointment_time, patient_name, guest_name'
          )
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })
          .limit(80),
      ])
      if (p.data) setPatients(p.data as PatOpt[])
      if (d.data) setDoctors(d.data as DocOpt[])
      if (s.data) setServices(s.data as SvcOpt[])
      if (a.data) setAppts(a.data as ApptOpt[])
      // Load materials catalog for consumption tracking
      try {
        const mRes = await fetch('/api/materials?isActive=true')
        const mJson = (await mRes.json()) as {
          success?: boolean
          data?: MatOpt[]
        }
        if (mJson.success && mJson.data) setMatCatalog(mJson.data)
      } catch {
        /* non-critical */
      }
    } catch (e) {
      captureException(e instanceof Error ? e : new Error(String(e)))
    }
  }, [])

  const loadList = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const q =
          statusFilter === 'all'
            ? ''
            : `?status=${encodeURIComponent(statusFilter)}`
        const res = await fetch(`/api/treatment-records${q}`)
        const json = (await res.json()) as {
          success?: boolean
          data?: TreatmentRow[]
          error?: string
        }
        if (!res.ok || !json.success || !json.data)
          throw new Error(
            json.error || t('admin.treatmentsPage.errors.loadFailed')
          )
        setRows(json.data)
      } catch (e) {
        captureException(e instanceof Error ? e : new Error(String(e)))
        setError(t('admin.treatmentsPage.errors.loadFailed'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [statusFilter, t]
  )

  useEffect(() => {
    void loadRefs()
  }, [loadRefs])
  useEffect(() => {
    void loadList()
  }, [loadList])

  const filtered = useMemo(() => {
    const q = searchPatient.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => person(r.patients).toLowerCase().includes(q))
  }, [rows, searchPatient])

  const resetForm = () => {
    setEditId(null)
    setPatientId('')
    setDoctorId('')
    setAppointmentId('')
    setDiagnosis('')
    setTeethStr('')
    setNotes('')
    setStatus('draft')
    setPayStatus('unpaid')
    setLines([emptyLine()])
    setMatLines([])
  }

  const openEdit = (r: TreatmentRow) => {
    setEditId(r.id)
    setPatientId(r.patient_id)
    setDoctorId(r.doctor_id)
    setAppointmentId(r.appointment_id || '')
    setDiagnosis(r.diagnosis || '')
    setTeethStr((r.tooth_numbers || []).join(', '))
    setNotes(r.notes || '')
    setStatus(r.status)
    setPayStatus(r.payment_status)
    const its = r.treatment_record_items || []
    setLines(
      its.length
        ? its.map(i => ({
            serviceId: i.service_id,
            toothNumber: i.tooth_number || '',
            quantity: String(i.quantity ?? 1),
            price: String(i.price_at_time ?? ''),
          }))
        : [emptyLine()]
    )
    // Load materials used for this record
    const mats = r.treatment_materials_used ?? []
    setMatLines(
      mats.length
        ? mats.map(m => ({
            materialId: m.material_id,
            quantityUsed: String(m.quantity_used),
          }))
        : []
    )
    setModalOpen(true)
  }

  const onServicePick = (idx: number, serviceId: string) => {
    const svc = services.find(s => s.id === serviceId)
    setLines(prev =>
      prev.map((l, i) =>
        i === idx
          ? { ...l, serviceId, price: svc ? String(svc.price_uah) : l.price }
          : l
      )
    )
  }

  const patchLine = (idx: number, patch: Partial<FormLine>) => {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const save = async () => {
    const token = csrf()
    if (!token) {
      setError(t('admin.treatmentsPage.errors.csrfRefresh'))
      return
    }
    const items = linesToPayload(lines)
    if (!editId && (!patientId || !doctorId)) {
      setError(t('admin.treatmentsPage.errors.selectPatientDoctor'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (!editId) {
        const post = await fetch('/api/treatment-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
          },
          body: JSON.stringify({
            appointmentId: appointmentId.trim() || null,
            patientId,
            doctorId,
            toothNumbers: parseTeeth(teethStr),
            diagnosis: diagnosis.trim() || null,
            notes: notes.trim() || null,
            items,
            materialsUsed: matLines
              .filter(m => m.materialId && Number(m.quantityUsed) > 0)
              .map(m => ({
                materialId: m.materialId,
                quantityUsed: Number(m.quantityUsed),
              })),
          }),
        })
        const pj = (await post.json()) as {
          success?: boolean
          data?: { id: string }
          error?: string
        }
        if (!post.ok || !pj.success || !pj.data?.id)
          throw new Error(
            pj.error || t('admin.treatmentsPage.errors.saveFailed')
          )
        const newId = pj.data.id
        if (status !== 'draft' || payStatus !== 'unpaid') {
          const patch = await fetch(`/api/treatment-records/${newId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': token,
            },
            body: JSON.stringify({ status, paymentStatus: payStatus }),
          })
          const tj = (await patch.json()) as {
            success?: boolean
            error?: string
          }
          if (!patch.ok || !tj.success)
            throw new Error(
              tj.error || t('admin.treatmentsPage.errors.saveFailed')
            )
        }
      } else {
        const patch = await fetch(`/api/treatment-records/${editId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
          },
          body: JSON.stringify({
            diagnosis: diagnosis.trim() || null,
            notes: notes.trim() || null,
            toothNumbers: parseTeeth(teethStr),
            status,
            paymentStatus: payStatus,
            items,
            materialsUsed: matLines
              .filter(m => m.materialId && Number(m.quantityUsed) > 0)
              .map(m => ({
                materialId: m.materialId,
                quantityUsed: Number(m.quantityUsed),
              })),
          }),
        })
        const tj = (await patch.json()) as { success?: boolean; error?: string }
        if (!patch.ok || !tj.success)
          throw new Error(
            tj.error || t('admin.treatmentsPage.errors.saveFailed')
          )
      }
      setModalOpen(false)
      resetForm()
      await loadList(true)
    } catch (e) {
      captureException(e instanceof Error ? e : new Error(String(e)))
      setError(
        e instanceof Error
          ? e.message
          : t('admin.treatmentsPage.errors.saveFailed')
      )
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm(t('admin.treatmentsPage.deleteConfirm'))) return
    const token = csrf()
    if (!token) return
    try {
      const res = await fetch(`/api/treatment-records/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': token },
      })
      const j = (await res.json()) as { success?: boolean }
      if (!res.ok || !j.success) throw new Error('fail')
      await loadList(true)
    } catch (e) {
      captureException(e instanceof Error ? e : new Error(String(e)))
      setError(t('admin.treatmentsPage.errors.deleteFailed'))
    }
  }

  const cell = preferences.compactTables ? 'px-3 py-2' : 'px-4 py-3'
  const head = `${cell} text-left text-xs font-semibold uppercase text-gray-500`
  const editingRow = editId ? rows.find(x => x.id === editId) : undefined
  const TAB_H = [
    t('admin.treatmentsPage.columns.date'),
    t('admin.treatmentsPage.columns.patient'),
    t('admin.treatmentsPage.columns.doctor'),
    t('admin.treatmentsPage.columns.diagnosis'),
    t('admin.treatmentsPage.columns.procedures'),
    t('admin.treatmentsPage.columns.totalCost'),
    t('admin.treatmentsPage.columns.payStatus'),
    t('admin.treatmentsPage.columns.status'),
    t('admin.treatmentsPage.columns.actions'),
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.treatmentsPage.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.treatmentsPage.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadList(true)}
            disabled={refreshing}
            className="gap-2 border-dental-teal text-dental-teal"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {t('admin.treatmentsPage.refresh')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              resetForm()
              setModalOpen(true)
            }}
            className="gap-2 bg-dental-teal"
          >
            <Plus className="h-4 w-4" />
            {t('admin.treatmentsPage.createAct')}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 rounded-xl border border-dental-secondary-200 bg-white p-4 md:grid-cols-3">
        <Input
          value={searchPatient}
          onChange={e => setSearchPatient(e.target.value)}
          placeholder={t('admin.treatmentsPage.searchPlaceholder')}
          className="md:col-span-2"
        />
        <Select
          selectSize="compact"
          fullWidth
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          aria-label={t('admin.treatmentsPage.statusFilterAria')}
        >
          {FILTER_STATUSES.map(v => (
            <option key={v} value={v}>
              {v === 'all'
                ? t('admin.treatmentsPage.filterAll')
                : t(`admin.treatmentsPage.statuses.${v}`)}
            </option>
          ))}
        </Select>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-dental-secondary-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-dental-secondary-200 bg-dental-primary/30">
            <tr>
              {TAB_H.map(h => (
                <th key={h} className={head}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-dental-text-light"
                >
                  {t('admin.treatmentsPage.loading')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-dental-text-light"
                >
                  {t('admin.treatmentsPage.empty')}
                </td>
              </tr>
            ) : (
              filtered.map(r => {
                const sc = ST_CSS[r.status]
                const sl = t(`admin.treatmentsPage.statuses.${r.status}`)
                const pc = PY_CSS[r.payment_status]
                const pl = t(
                  `admin.treatmentsPage.payStatuses.${r.payment_status}`
                )
                return (
                  <tr
                    key={r.id}
                    className="border-b border-dental-secondary-100 hover:bg-dental-secondary-50/50"
                  >
                    <td
                      className={`${cell} whitespace-nowrap text-dental-dark`}
                    >
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className={cell}>{person(r.patients)}</td>
                    <td className={cell}>{person(r.doctors)}</td>
                    <td
                      className={`${cell} max-w-[180px] truncate`}
                      title={r.diagnosis || ''}
                    >
                      {r.diagnosis || '—'}
                    </td>
                    <td className={cell}>
                      {r.treatment_record_items?.length ?? 0}
                    </td>
                    <td className={`${cell} font-medium text-dental-dark`}>
                      {formatCurrency(Number(r.total_cost))}
                    </td>
                    <td className={cell}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${pc}`}
                      >
                        {pl}
                      </span>
                    </td>
                    <td className={cell}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc}`}
                      >
                        {sl}
                      </span>
                    </td>
                    <td className={cell}>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="rounded-lg p-2 text-dental-teal hover:bg-dental-primary/40"
                          aria-label={t('admin.treatmentsPage.editAria')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(r.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label={t('admin.treatmentsPage.deleteAria')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <AdminModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title={
          editId
            ? t('admin.treatmentsPage.modal.editTitle')
            : t('admin.treatmentsPage.modal.createTitle')
        }
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-4">
          {editId ? (
            <div className="grid gap-3 rounded-lg bg-dental-primary/20 p-3 text-sm md:grid-cols-2">
              <div>
                <span className="text-dental-text-light">
                  {t('admin.treatmentsPage.modal.patient')}:{' '}
                </span>
                <span className="font-medium text-dental-dark">
                  {person(editingRow?.patients || null)}
                </span>
              </div>
              <div>
                <span className="text-dental-text-light">
                  {t('admin.treatmentsPage.modal.doctor')}:{' '}
                </span>
                <span className="font-medium text-dental-dark">
                  {person(editingRow?.doctors || null)}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-dental-dark">
                {t('admin.treatmentsPage.modal.patient')}
                <Select
                  selectSize="compact"
                  fullWidth
                  className="mt-1"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  aria-label={t('admin.treatmentsPage.modal.patient')}
                >
                  <option value="">—</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {person(p)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm font-medium text-dental-dark">
                {t('admin.treatmentsPage.modal.doctor')}
                <Select
                  selectSize="compact"
                  fullWidth
                  className="mt-1"
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                  aria-label={t('admin.treatmentsPage.modal.doctor')}
                >
                  <option value="">—</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.first_name} {d.last_name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="col-span-full block text-sm font-medium text-dental-dark">
                {t('admin.treatmentsPage.modal.visit')}
                <Select
                  selectSize="compact"
                  fullWidth
                  className="mt-1"
                  value={appointmentId}
                  onChange={e => setAppointmentId(e.target.value)}
                  aria-label={t('admin.treatmentsPage.modal.visit')}
                >
                  <option value="">—</option>
                  {appts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.appointment_date} {a.appointment_time?.slice(0, 5)} —{' '}
                      {a.patient_name || a.guest_name || t('common.guest')}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          )}
          <label className="block text-sm font-medium text-dental-dark">
            {t('admin.treatmentsPage.modal.diagnosis')}
            <Textarea
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-dental-dark">
            {t('admin.treatmentsPage.modal.teeth')}
            <Input
              value={teethStr}
              onChange={e => setTeethStr(e.target.value)}
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-dental-dark">
            {t('admin.treatmentsPage.modal.notes')}
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-dental-dark">
                {t('admin.treatmentsPage.modal.procedures')}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-dental-teal text-dental-teal"
                onClick={() => setLines(prev => [...prev, emptyLine()])}
              >
                {t('admin.treatmentsPage.modal.addLine')}
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-lg border border-dental-secondary-200 p-2 md:grid-cols-12 md:items-end"
                >
                  <label className="md:col-span-5">
                    <span className="text-xs text-dental-text-light">
                      {t('admin.treatmentsPage.modal.service')}
                    </span>
                    <Select
                      selectSize="compact"
                      fullWidth
                      value={line.serviceId}
                      onChange={e => onServicePick(idx, e.target.value)}
                      aria-label={t('admin.treatmentsPage.modal.service')}
                    >
                      <option value="">—</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name_uk}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="md:col-span-2">
                    <span className="text-xs text-dental-text-light">
                      {t('admin.treatmentsPage.modal.tooth')}
                    </span>
                    <Input
                      value={line.toothNumber}
                      onChange={e =>
                        patchLine(idx, { toothNumber: e.target.value })
                      }
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className="text-xs text-dental-text-light">
                      {t('admin.treatmentsPage.modal.quantity')}
                    </span>
                    <Input
                      value={line.quantity}
                      onChange={e =>
                        patchLine(idx, { quantity: e.target.value })
                      }
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className="text-xs text-dental-text-light">
                      {t('admin.treatmentsPage.modal.price')}
                    </span>
                    <Input
                      value={line.price}
                      onChange={e => patchLine(idx, { price: e.target.value })}
                    />
                  </label>
                  <div className="flex justify-end md:col-span-1">
                    <button
                      type="button"
                      disabled={lines.length < 2}
                      onClick={() =>
                        setLines(prev => prev.filter((_, i) => i !== idx))
                      }
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                      aria-label={t('admin.treatmentsPage.removeLineAria')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Materials used section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-dental-dark">
                {t('admin.inventory.consumption.title')}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-dental-teal text-dental-teal"
                onClick={() => setMatLines(prev => [...prev, emptyMatLine()])}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.inventory.consumption.addMaterial')}
              </Button>
            </div>
            {matLines.length > 0 && (
              <div className="space-y-2">
                {matLines.map((ml, idx) => {
                  const mat = matCatalog.find(m => m.id === ml.materialId)
                  return (
                    <div
                      key={idx}
                      className="grid gap-2 rounded-lg border border-dental-secondary-200 p-2 md:grid-cols-12 md:items-end"
                    >
                      <label className="md:col-span-6">
                        <span className="text-xs text-dental-text-light">
                          {t('admin.inventory.consumption.material')}
                        </span>
                        <Select
                          selectSize="compact"
                          fullWidth
                          value={ml.materialId}
                          onChange={e =>
                            setMatLines(prev =>
                              prev.map((m, i) =>
                                i === idx
                                  ? { ...m, materialId: e.target.value }
                                  : m
                              )
                            )
                          }
                          aria-label={t('admin.inventory.consumption.material')}
                        >
                          <option value="">—</option>
                          {matCatalog.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name_uk} (
                              {t('admin.inventory.consumption.stockLabel')}:{' '}
                              {m.current_quantity} {m.unit})
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label className="md:col-span-3">
                        <span className="text-xs text-dental-text-light">
                          {t('admin.inventory.consumption.quantity')}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={ml.quantityUsed}
                          onChange={e =>
                            setMatLines(prev =>
                              prev.map((m, i) =>
                                i === idx
                                  ? { ...m, quantityUsed: e.target.value }
                                  : m
                              )
                            )
                          }
                        />
                      </label>
                      <div className="md:col-span-2 flex items-end">
                        {mat && (
                          <span className="flex items-center gap-1 text-xs text-dental-text-light pb-2">
                            {mat.image_url ? (
                              <Image
                                src={mat.image_url}
                                alt=""
                                width={20}
                                height={20}
                                className="h-5 w-5 rounded object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                            {mat.unit}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-end md:col-span-1">
                        <button
                          type="button"
                          onClick={() =>
                            setMatLines(prev =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-medium text-dental-dark">
              {t('admin.treatmentsPage.modal.actStatus')}
              <Select
                selectSize="compact"
                fullWidth
                className="mt-1"
                value={status}
                onChange={e => setStatus(e.target.value as TreatmentStatus)}
                aria-label={t('admin.treatmentsPage.modal.actStatus')}
              >
                {TREATMENT_STATUSES.map(v => (
                  <option key={v} value={v}>
                    {t(`admin.treatmentsPage.statuses.${v}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-medium text-dental-dark">
              {t('admin.treatmentsPage.modal.payStatus')}
              <Select
                selectSize="compact"
                fullWidth
                className="mt-1"
                value={payStatus}
                onChange={e => setPayStatus(e.target.value as PayStatus)}
                aria-label={t('admin.treatmentsPage.modal.payStatus')}
              >
                {PAY_STATUSES.map(v => (
                  <option key={v} value={v}>
                    {t(`admin.treatmentsPage.payStatuses.${v}`)}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-dental-secondary-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              {t('admin.treatmentsPage.modal.cancel')}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="bg-dental-teal"
            >
              {saving
                ? t('admin.treatmentsPage.modal.saving')
                : t('admin.treatmentsPage.modal.save')}
            </Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
