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
import Logo from '@/components/ui/Logo'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  doctors: { first_name: string; last_name: string; specialization: string } | null
  services: { name_uk: string; price_uah: number } | null
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
      setAppointments(appointmentsData || [])

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('uk-UA', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'long' 
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-primary/10 text-primary',
      completed: 'bg-muted text-muted-foreground',
      cancelled: 'bg-destructive/10 text-destructive',
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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = profile?.first_name || user?.user_metadata?.first_name || 'Пацієнт'

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo variant="default" size="sm" />
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Вітаємо, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Ваш особистий кабінет пацієнта Dental Story
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Profile */}
          <div className="space-y-6">
            {/* Quick Book */}
            <Link
              href="/booking"
              className="block bg-primary text-primary-foreground rounded-2xl p-6 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Записатися на прийом</h3>
                  <p className="text-primary-foreground/70 text-sm">Оберіть зручний час</p>
                </div>
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </Link>

            {/* Profile Card */}
            <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Мій профіль</h3>
                <Link href="/cabinet/profile" className="text-primary hover:text-primary/80 text-sm">
                  Редагувати
                </Link>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <User className="w-5 h-5" />
                  <span>{profile?.first_name} {profile?.last_name}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-5 h-5" />
                  <span>{profile?.phone || 'Не вказано'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-5 h-5" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border">
              <Link
                href="/cabinet/appointments"
                className="flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Мої записи</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/cabinet/history"
                className="flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="font-medium text-foreground">Історія лікування</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/cabinet/reviews"
                className="flex items-center justify-between p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="font-medium text-foreground">Мої відгуки</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Right Column - Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl shadow-soft border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="font-semibold text-foreground">Останні записи</h3>
                <Link href="/cabinet/appointments" className="text-primary hover:text-primary/80 text-sm">
                  Всі записи
                </Link>
              </div>

              {appointments.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">Записів поки немає</h4>
                  <p className="text-muted-foreground mb-4">Запишіться на прийом до наших спеціалістів</p>
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Записатися
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {new Date(apt.appointment_date).getDate()}
                            </span>
                            <span className="text-xs text-primary/70">
                              {new Date(apt.appointment_date).toLocaleDateString('uk-UA', { month: 'short' })}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {apt.services?.name_uk || 'Консультація'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {apt.doctors?.last_name} {apt.doctors?.first_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {apt.appointment_time.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(apt.status)}
                          {apt.services?.price_uah && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {apt.services.price_uah.toLocaleString('uk-UA')} грн
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
