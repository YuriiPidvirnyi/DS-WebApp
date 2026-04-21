import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

type PaymentStatus =
  | 'created'
  | 'processing'
  | 'success'
  | 'failure'
  | 'expired'
  | 'reversed'
type PaymentMode = 'full' | 'deposit'

interface Payment {
  id: string
  invoice_id: string | null
  amount_kopecks: number
  payment_mode: PaymentMode
  status: PaymentStatus
  created_at: string
  paid_at: string | null
  // Supabase returns arrays for relations even when foreign-key is singular
  appointments:
    | {
        appointment_date: string
        appointment_time: string
        services: { name_uk: string }[] | null
      }[]
    | null
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  created: 'Очікує',
  processing: 'Очікує',
  success: 'Оплачено',
  failure: 'Не завершено',
  expired: 'Не завершено',
  reversed: 'Повернуто',
}

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  created: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-yellow-100 text-yellow-800',
  success: 'bg-green-100 text-green-800',
  failure: 'bg-red-100 text-red-800',
  expired: 'bg-red-100 text-red-800',
  reversed: 'bg-gray-100 text-gray-600',
}

const MODE_LABELS: Record<PaymentMode, string> = {
  full: 'Повна оплата',
  deposit: 'Завдаток',
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default async function PaymentsPage() {
  const supabase = await createClient()

  if (!supabase) {
    redirect('/auth/login')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: payments } = await supabase
    .from('payments')
    .select(
      'id, invoice_id, amount_kopecks, payment_mode, status, created_at, paid_at, appointments(appointment_date, appointment_time, services(name_uk))'
    )
    .order('created_at', { ascending: false })

  const list = (payments ?? []) as unknown as Payment[]

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-dental-dark mb-6">Платежі</h1>

      {list.length === 0 ? (
        <EmptyState
          icon={
            <div className="w-20 h-20 bg-dental-primary-50 rounded-full flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-dental-primary-600" />
            </div>
          }
          title="Немає платежів"
          description="Тут відображатимуться ваші онлайн-платежі за послуги клініки."
          action={{ href: '/booking', label: 'Записатися на прийом' }}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-dental-secondary-100 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dental-secondary-100 bg-dental-primary-50">
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    Дата
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    Послуга
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    Сума
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    Тип
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-dental-dark">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dental-secondary-100">
                {list.map(payment => (
                  <tr
                    key={payment.id}
                    className="hover:bg-dental-primary-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-dental-text whitespace-nowrap">
                      {formatDate(
                        payment.appointments?.[0]?.appointment_date ??
                          payment.created_at
                      )}
                    </td>
                    <td className="px-6 py-4 text-dental-text">
                      {payment.appointments?.[0]?.services?.[0]?.name_uk ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-dental-dark font-medium whitespace-nowrap">
                      {(payment.amount_kopecks / 100).toFixed(2)} грн
                    </td>
                    <td className="px-6 py-4 text-dental-text whitespace-nowrap">
                      {MODE_LABELS[payment.payment_mode] ??
                        payment.payment_mode}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[payment.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABELS[payment.status] ?? payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <ul className="sm:hidden divide-y divide-dental-secondary-100">
            {list.map(payment => (
              <li key={payment.id} className="px-4 py-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-dental-dark text-sm">
                    {payment.appointments?.[0]?.services?.[0]?.name_uk ?? '—'}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_CLASSES[payment.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_LABELS[payment.status] ?? payment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-dental-muted">
                  <span>
                    {formatDate(
                      payment.appointments?.[0]?.appointment_date ??
                        payment.created_at
                    )}
                  </span>
                  <span className="font-medium text-dental-dark">
                    {(payment.amount_kopecks / 100).toFixed(2)} грн
                  </span>
                </div>
                <p className="text-xs text-dental-muted">
                  {MODE_LABELS[payment.payment_mode] ?? payment.payment_mode}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
