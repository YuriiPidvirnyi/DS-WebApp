import { useState, useEffect } from 'react'
import {
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  User,
  Download,
} from 'lucide-react'
import { getPatient } from '@/services/patientManagement'
import type { EnhancedPatient } from '@/types'

export default function PatientDashboard({ patientId }: { patientId: string }) {
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
    return <div className="p-6 text-center">Пацієнта не знайдено</div>
  }

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
                <p className="text-gray-600">Особистий кабінет</p>
              </div>
            </div>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download className="w-5 h-5 inline mr-2" />
              Завантажити дані
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">
                {patient.nextAppointmentDate
                  ? new Date(patient.nextAppointmentDate).toLocaleDateString(
                      'uk'
                    )
                  : '—'}
              </p>
              <p className="text-sm text-blue-700">Наступний візит</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <FileText className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-sm text-green-700">Активних планів</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-2xl font-bold">
                {patient.outstandingBalance} грн
              </p>
              <p className="text-sm text-orange-700">До сплати</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-sm text-purple-700">Нових повідомлень</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex gap-2 p-2">
              {[
                { id: 'appointments', label: 'Записи', icon: Calendar },
                { id: 'treatments', label: 'Лікування', icon: FileText },
                { id: 'payments', label: 'Платежі', icon: CreditCard },
                { id: 'messages', label: 'Повідомлення', icon: MessageSquare },
              ].map(tab => (
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
                <h2 className="text-xl font-bold mb-4">Майбутні записи</h2>
                <p className="text-gray-500">
                  Тут будуть ваші записи на прийом
                </p>
              </div>
            )}

            {activeTab === 'treatments' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Плани лікування</h2>
                <p className="text-gray-500">Тут будуть ваші плани лікування</p>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Історія платежів</h2>
                <p className="text-gray-500">Тут буде історія ваших платежів</p>
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Повідомлення</h2>
                <p className="text-gray-500">
                  Тут будуть ваші повідомлення з клінікою
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
