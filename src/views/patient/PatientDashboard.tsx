import { useState, useEffect } from 'react'
import {
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  User,
  Download,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getPatient } from '@/services/patientManagement'
import type { EnhancedPatient } from '@/types'

export default function PatientDashboard({ patientId }: { patientId: string }) {
  const { t, i18n } = useTranslation()
  const [patient, setPatient] = useState<EnhancedPatient | null>(null)
  const [activeTab, setActiveTab] = useState<
    'appointments' | 'treatments' | 'payments' | 'messages'
  >('appointments')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const patientRes = await getPatient(patientId)
        if (patientRes.success) setPatient(patientRes.data!)
      } catch (error) {
        console.error('Failed to load patient data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [patientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dental-teal"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">{t('patientDashboard.notFound')}</div>
    )
  }

  const locale =
    i18n.language === 'pl'
      ? 'pl-PL'
      : i18n.language === 'en'
        ? 'en-US'
        : 'uk-UA'

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-dental-teal/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-dental-teal" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-gray-600">
                  {t('patientDashboard.subtitle')}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download className="w-5 h-5 inline mr-2" />
              {t('patientDashboard.downloadData')}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">
                {patient.nextAppointmentDate
                  ? new Date(patient.nextAppointmentDate).toLocaleDateString(
                      locale
                    )
                  : t('patientDashboard.common.empty')}
              </p>
              <p className="text-sm text-blue-700">
                {t('patientDashboard.cards.nextVisit')}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <FileText className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-2xl font-bold">
                {t('patientDashboard.common.empty')}
              </p>
              <p className="text-sm text-green-700">
                {t('patientDashboard.cards.activePlans')}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-2xl font-bold">
                {patient.outstandingBalance} {t('cabinet.currency')}
              </p>
              <p className="text-sm text-orange-700">
                {t('patientDashboard.cards.amountDue')}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">
                {t('patientDashboard.common.empty')}
              </p>
              <p className="text-sm text-purple-700">
                {t('patientDashboard.cards.newMessages')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex gap-2 p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-dental-teal text-white'
                      : 'text-gray-600 hover:bg-gray-100'
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
                <p className="text-gray-500">
                  {t('patientDashboard.sections.appointments.description')}
                </p>
              </div>
            )}

            {activeTab === 'treatments' && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {t('patientDashboard.sections.treatments.title')}
                </h2>
                <p className="text-gray-500">
                  {t('patientDashboard.sections.treatments.description')}
                </p>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {t('patientDashboard.sections.payments.title')}
                </h2>
                <p className="text-gray-500">
                  {t('patientDashboard.sections.payments.description')}
                </p>
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {t('patientDashboard.sections.messages.title')}
                </h2>
                <p className="text-gray-500">
                  {t('patientDashboard.sections.messages.description')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
