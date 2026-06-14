'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { CheckCircle, Circle, X, ChevronRight } from 'lucide-react'

const DISMISSED_KEY = 'onboarding_dismissed'

interface ChecklistStep {
  key: string
  labelKey: string
  href: string
}

const STEPS: ChecklistStep[] = [
  {
    key: 'services',
    labelKey: 'admin.onboardingChecklist.step.services',
    href: '/admin/services',
  },
  {
    key: 'doctors',
    labelKey: 'admin.onboardingChecklist.step.doctors',
    href: '/admin/doctors',
  },
  {
    key: 'materials',
    labelKey: 'admin.onboardingChecklist.step.materials',
    href: '/admin/materials',
  },
  {
    key: 'appointment',
    labelKey: 'admin.onboardingChecklist.step.appointment',
    href: '/admin/appointments',
  },
  {
    key: 'workingHours',
    labelKey: 'admin.onboardingChecklist.step.workingHours',
    href: '/admin/settings',
  },
]

type CheckStatus = Record<string, boolean>

function Skeleton() {
  return (
    <div className="rounded-2xl border border-dental-primary bg-dental-primary/30 p-5 mb-6 animate-pulse">
      <div className="h-5 w-48 bg-dental-primary rounded mb-4" />
      <div className="space-y-3">
        {STEPS.map(s => (
          <div key={s.key} className="h-4 bg-dental-primary rounded w-full" />
        ))}
      </div>
    </div>
  )
}

export default function OnboardingChecklist() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<CheckStatus>({})

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') {
        setLoading(false)
        return
      }
    } catch {
      setLoading(false)
      return
    }

    const run = async () => {
      try {
        const [servicesRes, doctorsRes, materialsRes, appointmentsRes] =
          await Promise.all([
            fetch('/api/services?limit=1'),
            fetch('/api/doctors?limit=1'),
            fetch('/api/materials?limit=1'),
            fetch('/api/appointments?limit=1'),
          ])

        const parseCount = async (res: Response): Promise<number> => {
          if (!res.ok) return 0
          try {
            const json = await res.json()
            // Support { data: [...], total: N } or plain array
            if (Array.isArray(json)) return json.length
            if (typeof json.total === 'number') return json.total
            if (typeof json.count === 'number') return json.count
            if (Array.isArray(json.data)) return json.data.length
            return 0
          } catch {
            return 0
          }
        }

        const [servicesCount, doctorsCount, materialsCount, appointmentsCount] =
          await Promise.all([
            parseCount(servicesRes),
            parseCount(doctorsRes),
            parseCount(materialsRes),
            parseCount(appointmentsRes),
          ])

        // Check working_hours via Supabase client (no dedicated API route exists)
        let workingHoursDone = false
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          if (supabase) {
            const { count } = await supabase
              .from('working_hours')
              .select('*', { count: 'exact', head: true })
            workingHoursDone = (count ?? 0) > 0
          }
        } catch {
          // ignore — treat as incomplete
        }

        const newStatus: CheckStatus = {
          services: servicesCount > 0,
          doctors: doctorsCount > 0,
          materials: materialsCount > 0,
          appointment: appointmentsCount > 0,
          workingHours: workingHoursDone,
        }

        const allDone = Object.values(newStatus).every(Boolean)
        setStatus(newStatus)

        if (allDone) {
          try {
            localStorage.setItem(DISMISSED_KEY, 'true')
          } catch {
            // ignore
          }
          setVisible(false)
        } else {
          setVisible(true)
        }
      } catch {
        // On error hide silently
        setVisible(false)
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  const doneCount = Object.values(status).filter(Boolean).length

  if (loading) return <Skeleton />
  if (!visible) return null

  return (
    <div
      role="region"
      aria-label={t('admin.onboardingChecklist.title')}
      className="rounded-2xl border border-dental-primary bg-dental-primary/20 p-5 mb-6 relative"
    >
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label={t('admin.onboardingChecklist.dismiss')}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-dental-text hover:bg-dental-primary/40 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Title row */}
      <div className="pr-8 mb-1">
        <h2 className="text-base font-bold text-dental-dark">
          {t('admin.onboardingChecklist.title')}
        </h2>
        <p className="text-sm text-dental-text mt-0.5">
          {t('admin.onboardingChecklist.subtitle', {
            done: doneCount,
            total: STEPS.length,
          })}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-3 mb-4 h-1.5 rounded-full bg-dental-primary overflow-hidden">
        <div
          className="h-full rounded-full bg-dental-primary-600 transition-all duration-500"
          style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          role="progressbar"
        />
      </div>

      {/* Steps list */}
      <ul className="space-y-2">
        {STEPS.map(step => {
          const done = status[step.key] ?? false
          return (
            <li
              key={step.key}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {done ? (
                  <CheckCircle className="w-5 h-5 text-dental-primary-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-dental-secondary shrink-0" />
                )}
                <span
                  className={`text-sm truncate ${done ? 'text-dental-text line-through' : 'text-dental-dark'}`}
                >
                  {t(step.labelKey)}
                </span>
              </div>
              {!done && (
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-dental-primary-600 hover:text-dental-primary-700 whitespace-nowrap shrink-0 transition-colors focus:outline-hidden focus:underline"
                >
                  {t('admin.onboardingChecklist.go')}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      {/* Footer dismiss */}
      <div className="mt-4 pt-3 border-t border-dental-primary flex justify-end">
        <button
          onClick={dismiss}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 focus:ring-offset-2"
        >
          {t('admin.onboardingChecklist.gotIt')}
        </button>
      </div>
    </div>
  )
}
