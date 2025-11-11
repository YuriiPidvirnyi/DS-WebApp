import React, { useState, useEffect } from 'react'
import {
  Calendar,
  CreditCard,
  FileText,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  getCliniCardsApi,
  type TreatmentPlan,
  type Payment,
  type Appointment,
} from '../services/clinicardsApi'

interface PatientInfo {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  birthDate?: string
  address?: string
}

/**
 * Patient portal with full CliniCards integration
 */
export const PatientPortal: React.FC<{ patientPhone: string }> = ({
  patientPhone,
}) => {
  const [activeTab, setActiveTab] = useState<
    'info' | 'appointments' | 'treatments' | 'payments'
  >('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [appointments, _setAppointments] = useState<Appointment[]>([])
  const [treatments, setTreatments] = useState<TreatmentPlan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const loadPatientData = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const api = getCliniCardsApi()

      // Load patient info
      const patientResponse = await api.getPatientByPhone(patientPhone)
      if (!patientResponse.success || !patientResponse.data) {
        throw new Error('Patient not found')
      }

      const patient = patientResponse.data
      setPatientInfo({
        id: patient.id!,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        email: patient.email,
        birthDate: patient.birthDate,
        address: patient.address,
      })

      // Load treatment plans (last 12 months)
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const endDate = new Date().toISOString().split('T')[0]

      const treatmentsResponse = await api.getTreatmentPlans({
        startDate,
        endDate,
        patientId: patient.id,
      })

      if (treatmentsResponse.success && treatmentsResponse.data) {
        setTreatments(treatmentsResponse.data)
      }

      // Load payments
      const paymentsResponse = await api.getPatientPayments(patient.id!)
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load patient data'
      )
    } finally {
      setLoading(false)
    }
  }, [patientPhone])

  useEffect(() => {
    void loadPatientData()
  }, [loadPatientData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження даних...</p>
        </div>
      </div>
    )
  }

  if (error || !patientInfo) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Помилка</h2>
          <p className="text-red-700">{error || 'Пацієнта не знайдено'}</p>
        </div>
      </div>
    )
  }

  const totalDebt =
    treatments
      .filter(t => t.status === 'active')
      .reduce((sum, t) => sum + t.totalCost, 0) -
    payments.reduce((sum, p) => sum + p.amount, 0)

  const completedProcedures = treatments
    .flatMap(t => t.procedures)
    .filter(p => p.completed).length

  const upcomingAppointments = appointments.filter(
    a => a.status === 'scheduled' || a.status === 'confirmed'
  ).length

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patientInfo.firstName} {patientInfo.lastName}
              </h1>
              <p className="text-gray-600">Особистий кабінет пацієнта</p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Edit className="w-5 h-5" />
            Редагувати
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-900">
              {upcomingAppointments}
            </p>
            <p className="text-sm text-blue-700">Майбутні візити</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-900">
              {completedProcedures}
            </p>
            <p className="text-sm text-green-700">Виконано процедур</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <FileText className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-900">
              {treatments.length}
            </p>
            <p className="text-sm text-purple-700">Планів лікування</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <CreditCard className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-900">
              {totalDebt.toFixed(0)} грн
            </p>
            <p className="text-sm text-orange-700">До сплати</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b">
          <div className="flex gap-1 p-2">
            {[
              { id: 'info', label: 'Особисті дані', icon: User },
              { id: 'appointments', label: 'Візити', icon: Calendar },
              { id: 'treatments', label: 'Лікування', icon: FileText },
              { id: 'payments', label: 'Платежі', icon: CreditCard },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
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
          {/* Personal Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Особисті дані</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Повне ім'я</p>
                    <p className="font-medium">
                      {patientInfo.firstName} {patientInfo.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Телефон</p>
                    <p className="font-medium">{patientInfo.phone}</p>
                  </div>
                </div>

                {patientInfo.email && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{patientInfo.email}</p>
                    </div>
                  </div>
                )}

                {patientInfo.birthDate && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Дата народження</p>
                      <p className="font-medium">
                        {new Date(patientInfo.birthDate).toLocaleDateString(
                          'uk-UA'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {patientInfo.address && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Адреса</p>
                      <p className="font-medium">{patientInfo.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Історія візитів</h2>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                  Записатися на прийом
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>У вас поки немає записів</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map(apt => (
                    <div
                      key={apt.id}
                      className="p-6 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-lg font-bold">
                            {new Date(apt.date).toLocaleDateString('uk-UA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {apt.time}
                            </span>
                            <span>{apt.duration} хв</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            apt.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : apt.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="text-gray-600 text-sm">{apt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Treatments Tab */}
          {activeTab === 'treatments' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Плани лікування</h2>

              {treatments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Немає активних планів лікування</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {treatments.map(plan => {
                    const completedProcedures = plan.procedures.filter(
                      p => p.completed
                    ).length
                    const progress =
                      (completedProcedures / plan.procedures.length) * 100

                    return (
                      <div
                        key={plan.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="p-6 bg-gray-50">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold">
                                План №{plan.id}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Створено:{' '}
                                {new Date(plan.createdDate).toLocaleDateString(
                                  'uk-UA'
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {plan.totalCost.toFixed(0)} грн
                              </p>
                              <span
                                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                                  plan.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : plan.status === 'active'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {plan.status}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">
                                Прогрес виконання
                              </span>
                              <span className="font-medium">
                                {completedProcedures}/{plan.procedures.length}{' '}
                                процедур
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Procedures List */}
                        <div className="p-6">
                          <h4 className="font-bold mb-4">Процедури:</h4>
                          <div className="space-y-3">
                            {plan.procedures.map(proc => (
                              <div
                                key={proc.id}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded"
                              >
                                <div className="flex items-center gap-3">
                                  {proc.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-gray-400" />
                                  )}
                                  <div>
                                    <p className="font-medium">{proc.name}</p>
                                    {proc.completedDate && (
                                      <p className="text-xs text-gray-500">
                                        Виконано:{' '}
                                        {new Date(
                                          proc.completedDate
                                        ).toLocaleDateString('uk-UA')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">
                                    {proc.cost.toFixed(0)} грн
                                  </p>
                                  {proc.quantity > 1 && (
                                    <p className="text-xs text-gray-500">
                                      x{proc.quantity}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Історія платежів</h2>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Download className="w-5 h-5" />
                  Завантажити звіт
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">Всього сплачено</p>
                  <p className="text-2xl font-bold text-green-900">
                    {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(0)}{' '}
                    грн
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700">Залишок до сплати</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {totalDebt.toFixed(0)} грн
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Транзакцій</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {payments.length}
                  </p>
                </div>
              </div>

              {/* Payments List */}
              {payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Немає історії платежів</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Дата
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Призначення
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Спосіб оплати
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Сума
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Квитанція
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map(payment => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(payment.date).toLocaleDateString('uk-UA')}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {payment.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                payment.method === 'cash'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.method === 'card'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {payment.method === 'cash'
                                ? 'Готівка'
                                : payment.method === 'card'
                                  ? 'Картка'
                                  : 'Переказ'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {payment.amount.toFixed(0)} грн
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payment.invoiceNumber ? (
                              <button className="text-primary hover:underline">
                                №{payment.invoiceNumber}
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
