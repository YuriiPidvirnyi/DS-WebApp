'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  CheckCircle,
  Stethoscope,
  Users,
  Calendar,
  Mail,
  ChevronRight,
} from 'lucide-react'

const TOUR_KEY = 'ds_admin_tour_done'

const STEP_ICONS = [Stethoscope, Stethoscope, Users, Calendar, Mail]

interface Step {
  titleKey: string
  bodyKey: string
}

const STEPS: Step[] = [
  {
    titleKey: 'admin.onboarding.step1.title',
    bodyKey: 'admin.onboarding.step1.body',
  },
  {
    titleKey: 'admin.onboarding.step2.title',
    bodyKey: 'admin.onboarding.step2.body',
  },
  {
    titleKey: 'admin.onboarding.step3.title',
    bodyKey: 'admin.onboarding.step3.body',
  },
  {
    titleKey: 'admin.onboarding.step4.title',
    bodyKey: 'admin.onboarding.step4.body',
  },
  {
    titleKey: 'admin.onboarding.step5.title',
    bodyKey: 'admin.onboarding.step5.body',
  },
]

interface OnboardingTourProps {
  role: string | undefined
}

export default function OnboardingTour({ role }: OnboardingTourProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (role !== 'superadmin' && role !== 'admin') return
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable
    }
  }, [role])

  const dismiss = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const Icon = STEP_ICONS[step]
  const current = STEPS[step]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dental-dark/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-dental-primary-600 px-6 py-5 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <h2
              id="onboarding-title"
              className="text-lg font-bold leading-tight"
            >
              {t(current.titleKey)}
            </h2>
          </div>
          <button
            onClick={dismiss}
            aria-label={t('admin.onboarding.skip')}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-dental-text leading-relaxed">
            {t(current.bodyKey)}
          </p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-dental-primary-600'
                    : i < step
                      ? 'w-3 bg-dental-primary-300'
                      : 'w-3 bg-dental-secondary-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-sm text-dental-muted hover:text-dental-dark transition-colors focus:outline-none focus:underline"
          >
            {t('admin.onboarding.skip')}
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-dental-primary-600 hover:bg-dental-primary-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500 focus:ring-offset-2"
          >
            {step < STEPS.length - 1 ? (
              <>
                {t('admin.onboarding.next')}
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                {t('admin.onboarding.finish')}
                <CheckCircle className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
