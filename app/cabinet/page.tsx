'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  LogOut, 
  Plus,
  ChevronRight,
  Star,
  Phone,
  Mail
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Appointment data from Supabase with joined relations
interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  doctors: { first_name: string; last_name: string; specialization: string }[] | null
  services: { name_uk: string; price_uah: number }[] | null
}

interface PatientProfile {
  first_name: string | null
  last_name: string | null
  phone: string | null
  date_of_birth: string | null
}

export default function CabinetPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Get profile
      const { data: profileData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Get appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          doctors (first_name, last_name, specialization),
          services (name_uk, price_uah)
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false })
        .limit(5)
      setAppointments((appointmentsData as unknown as Appointment[]) || [])

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Get status badge styling and label
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-teal-100 text-teal-700',
      completed: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      pending: 'Очікує',
      confirmed: 'Підтверджено',
      completed: 'Завершено',
      cancelled: 'Скасовано',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dental-secondary-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-dental-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = profile?.first_name || user?.user_metadata?.first_name || 'Пацієнт'

  return (
    <div className="min-h-screen bg-dental-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-dental-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-dental-dark">
              Dental<span className="text-dental-primary-600">Story</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-dental-muted hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-dental-muted hover:text-dental-dark transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Вийти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dental-dark mb-2">
            Вітаємо, {displayName}!
          </h1>
          <p className="text-dental-muted">
            Ваш особистий кабінет пацієнта Dental Story
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Profile */}
          <div className="space-y-6">
            {/* Quick Book */}
            <Link
              href="/booking"
              className="block bg-gradient-to-br from-dental-primary-500 to-dental-primary-600 text-white rounded-2xl p-6 hover:from-dental-primary-600 hover:to-dental-primary-700 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Записатися на прийом</h3>
                  <p className="text-dental-primary-100 text-sm">Оберіть зручний час</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </Link>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-dental-dark">Мій профіль</h3>
                <Link href="/cabinet/profile" className="text-dental-primary-600 hover:text-dental-primary-700 text-sm">
                  Редагувати
                </Link>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-dental-muted">
                  <User className="w-5 h-5 text-dental-secondary-400" />
                  <span>{profile?.first_name} {profile?.last_name}</span>
                </div>
                <div className="flex items-center gap-3 text-dental-muted">
                  <Phone className="w-5 h-5 text-dental-secondary-400" />
                  <span>{profile?.phone || 'Не вказано'}</span>
                </div>
                <div className="flex items-center gap-3 text-dental-muted">
                  <Mail className="w-5 h-5 text-dental-secondary-400" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <Link
                href="/cabinet/appointments"
                className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors border-b border-dental-secondary-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-dental-primary-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-dental-primary-600" />
                  </div>
                  <span className="font-medium text-dental-dark">Мої записи</span>
                </div>
                <ChevronRight className="w-5 h-5 text-dental-muted" />
              </Link>
              <Link
                href="/cabinet/history"
                className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors border-b border-dental-secondary-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-dental-dark">Історія лікування</span>
                </div>
                <ChevronRight className="w-5 h-5 text-dental-muted" />
              </Link>
              <Link
                href="/cabinet/reviews"
                className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <span className="font-medium text-dental-dark">Мої відгуки</span>
                </div>
                <ChevronRight className="w-5 h-5 text-dental-muted" />
              </Link>
            </div>
          </div>

          {/* Right Column - Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-soft">
              <div className="flex items-center justify-between p-6 border-b border-dental-secondary-100">
                <h3 className="font-semibold text-dental-dark">Останні записи</h3>
                <Link href="/cabinet/appointments" className="text-dental-primary-600 hover:text-dental-primary-700 text-sm">
                  Всі записи
                </Link>
              </div>

              {appointments.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-dental-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-dental-muted" />
                  </div>
                  <h4 className="font-medium text-dental-dark mb-2">Записів поки немає</h4>
                  <p className="text-dental-muted mb-4">Запишіться на прийом до наших спеціалістів</p>
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Записатися
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-dental-secondary-100">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-4 hover:bg-dental-secondary-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-dental-primary-50 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-dental-primary-600">
                              {new Date(apt.appointment_date).getDate()}
                            </span>
                            <span className="text-xs text-dental-primary-500">
                              {new Date(apt.appointment_date).toLocaleDateString('uk-UA', { month: 'short' })}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-dental-dark">
                              {apt.services?.[0]?.name_uk || 'Консультація'}
                            </h4>
                            <p className="text-sm text-dental-muted">
                              {apt.doctors?.[0]?.last_name} {apt.doctors?.[0]?.first_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-dental-muted">
                              <Clock className="w-4 h-4" />
                              {apt.appointment_time.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(apt.status)}
                          {apt.services?.[0]?.price_uah && (
                            <p className="text-sm text-dental-muted mt-2">
                              {apt.services[0].price_uah.toLocaleString('uk-UA')} грн
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
