'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { localizedServiceName } from '@/utils/serviceName'

interface PatientRow {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  total_visits: number
  total_spent_uah: number
  created_at: string
}

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  status: string
  notes: string | null
  price_uah: number | null
  created_at: string
  doctor: { first_name: string; last_name: string } | null
  service: {
    name_uk: string
    name_en: string | null
    name_pl: string | null
  } | null
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; className: string }
> = {
  completed: {
    icon: CheckCircle,
    className: 'text-status-success-700 bg-status-success-100',
  },
  confirmed: {
    icon: Clock,
    className: 'text-status-accent-700 bg-status-accent-100',
  },
  pending: {
    icon: AlertCircle,
    className: 'text-status-warning-700 bg-status-warning-100',
  },
  cancelled: {
    icon: XCircle,
    className: 'text-status-neutral-700 bg-status-neutral-100',
  },
  no_show: {
    icon: XCircle,
    className: 'text-status-neutral-700 bg-status-neutral-100',
  },
}

export default function PatientDashboard({ patientId }: { patientId: string }) {
  const { t, i18n } = useTranslation()
  const [patient, setPatient] = useState<PatientRow | null>(null)
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [activeTab, setActiveTab] = useState<
    'appointments' | 'treatments' | 'payments' | 'messages'
  >('appointments')
  const [loading, setLoading] = useState(true)

  const locale =
    i18n.language === 'pl'
      ? 'pl-PL'
      : i18n.language === 'en'
        ? 'en-US'
        : 'uk-UA'

  const loadData = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const [patientRes, appointmentsRes] = await Promise.all([
        supabase
          .from('patients')
          .select(
            'id, first_name, last_name, phone, email, total_visits, total_spent_uah, created_at'
          )
          .eq('id', patientId)
          .maybeSingle(),
        supabase
          .from('appointments')
          .select(
            'id, appointment_date, appointment_time, duration_minutes, status, notes, price_uah, created_at, doctor:doctors(first_name, last_name), service:services(name_uk, name_en, name_pl)'
          )
          .eq('patient_id', patientId)
          .order('appointment_date', { ascending: false })
          .limit(50),
      ])

      if (patientRes.data) setPatient(patientRes.data as PatientRow)
      if (appointmentsRes.data)
        setAppointments(appointmentsRes.data as unknown as AppointmentRow[])
    } catch (error) {
      import('@sentry/nextjs').then(Sentry => Sentry.captureException(error))
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dental-teal" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">{t('patientDashboard.notFound')}</div>
    )
  }

  const upcomingAppointments = appointments.filter(
    a =>
      new Date(`${a.appointment_date}T${a.appointment_time}`) > new Date() &&
      a.status !== 'cancelled'
  )

  const completedCount = appointments.filter(
    a => a.status === 'completed'
  ).length

  const tabs = [
    {
      id: 'appointments',
      label: t('patientDashboard.tabs.appointments'),
      icon: Calendar,
    },
    {
      id: 'treatments',
      label: t('patientDashboard.tabs.treatments'),
      icon: FileText,
    },
    {
      id: 'payments',
      label: t('patientDashboard.tabs.payments'),
      icon: CreditCard,
    },
    {
      id: 'messages',
      label: t('patientDashboard.tabs.messages'),
      icon: MessageSquare,
    },
  ] as const

  const getServiceName = (svc: AppointmentRow['service']) =>
    localizedServiceName(svc, i18n.language)

  return (
    <div className="min-h-screen bg-dental-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-dental-teal/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-dental-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-dental-muted">
                {t('patientDashboard.subtitle')}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-dental-primary-50 rounded-lg">
              <Calendar className="w-6 h-6 text-dental-primary-ink mb-2" />
              <p className="text-2xl font-bold">
                {upcomingAppointments.length > 0
                  ? new Date(
                      upcomingAppointments[0].appointment_date
                    ).toLocaleDateString(locale)
                  : '—'}
              </p>
              <p className="text-sm text-dental-primary-ink">
                {t('patientDashboard.cards.nextVisit')}
              </p>
            </div>
            <div className="p-4 bg-status-success-100 rounded-lg">
              <FileText className="w-6 h-6 text-dental-success mb-2" />
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-status-success-700">
                {t('patientDashboard.cards.completedVisits')}
              </p>
            </div>
            <div className="p-4 bg-status-warning-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-dental-warning mb-2" />
              <p className="text-2xl font-bold">
                {patient.total_spent_uah.toLocaleString(locale)}{' '}
                {t('cabinet.currency')}
              </p>
              <p className="text-sm text-status-warning-700">
                {t('patientDashboard.cards.totalSpent')}
              </p>
            </div>
            <div className="p-4 bg-dental-secondary-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-dental-primary-ink mb-2" />
              <p className="text-2xl font-bold">{appointments.length}</p>
              <p className="text-sm text-dental-primary-ink">
                {t('patientDashboard.cards.totalAppointments')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <div className="flex gap-2 p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-dental-teal text-white'
                      : 'text-dental-muted hover:bg-dental-secondary-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'appointments' && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {t('patientDashboard.sections.appointments.title')}
                </h2>
                {appointments.length === 0 ? (
                  <p className="text-dental-muted">
                    {t('patientDashboard.sections.appointments.empty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map(apt => {
                      const cfg =
                        STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending
                      const StatusIcon = cfg.icon
                      return (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-4 border border-dental-secondary-100 rounded-lg hover:bg-dental-secondary-50"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.className}`}
                            >
                              <StatusIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-dental-dark">
                                {getServiceName(apt.service)}
                              </p>
                              <p className="text-sm text-dental-muted">
                                {new Date(
                                  apt.appointment_date
                                ).toLocaleDateString(locale)}{' '}
                                {t('patientDashboard.sections.appointments.at')}{' '}
                                {apt.appointment_time?.slice(0, 5)}
                                {apt.doctor &&
                                  ` — ${apt.doctor.last_name} ${apt.doctor.first_name}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
                            >
                              {t(
                                `patientDashboard.sections.appointments.statuses.${apt.status}`
                              )}
                            </span>
                            {apt.price_uah != null && (
                              <p className="text-sm text-dental-muted mt-1">
                                {apt.price_uah.toLocaleString(locale)}{' '}
                                {t('cabinet.currency')}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'treatments' && (
              <ComingSoonTab
                title={t('patientDashboard.sections.treatments.title')}
                description={t(
                  'patientDashboard.sections.treatments.comingSoon'
                )}
                icon={FileText}
              />
            )}

            {activeTab === 'payments' && (
              <ComingSoonTab
                title={t('patientDashboard.sections.payments.title')}
                description={t('patientDashboard.sections.payments.comingSoon')}
                icon={CreditCard}
              />
            )}

            {activeTab === 'messages' && (
              <ComingSoonTab
                title={t('patientDashboard.sections.messages.title')}
                description={t('patientDashboard.sections.messages.comingSoon')}
                icon={MessageSquare}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ComingSoonTab({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: typeof FileText
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-dental-secondary-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-dental-muted" />
      </div>
      <h2 className="text-xl font-bold mb-2 text-dental-dark">{title}</h2>
      <p className="text-dental-muted max-w-md mx-auto">{description}</p>
    </div>
  )
}
