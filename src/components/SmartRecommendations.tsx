'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useCSRF } from '@/hooks/useCSRF'
import {
  Sparkles,
  ChevronDown,
  Loader2,
  CheckCircle,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react'
import { AsyncState } from '@/components/ui'

interface Recommendation {
  primaryRecommendation: {
    serviceName: string
    reason: string
    urgency: 'routine' | 'soon' | 'urgent'
    estimatedDuration: string
  }
  additionalRecommendations: Array<{
    serviceName: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>
  preventiveCare: string[]
  lifestyleTips: string[]
  disclaimer: string
}

interface QuickConcern {
  id: string
  label: string
}

interface LastVisitOption {
  value: string
  label: string
}

const urgencyColors = {
  routine: 'bg-dental-primary-100 text-dental-primary-800',
  soon: 'bg-amber-100 text-amber-800',
  urgent: 'bg-red-100 text-red-800',
}

export default function SmartRecommendations() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'uk') as 'uk' | 'en' | 'pl'
  const { token: csrfToken } = useCSRF()

  const translatedConcerns = t('ai.recommendations.quickConcerns', {
    returnObjects: true,
  }) as unknown
  const quickConcerns = Array.isArray(translatedConcerns)
    ? (translatedConcerns as QuickConcern[])
    : []

  const translatedLastVisitOptions = t('ai.recommendations.lastVisitOptions', {
    returnObjects: true,
  }) as unknown
  const lastVisitOptions = Array.isArray(translatedLastVisitOptions)
    ? (translatedLastVisitOptions as LastVisitOption[])
    : []

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([])
  const [lastVisit, setLastVisit] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const toggleConcern = (id: string) => {
    setSelectedConcerns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const getRecommendations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const concernLabels = selectedConcerns.map(id => {
        const concern = quickConcerns.find(c => c.id === id)
        return concern ? concern.label : id
      })
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          symptoms: concernLabels,
          lastVisit,
          concerns: additionalInfo,
          language: lang,
        }),
      })
      if (!response.ok) throw new Error('Failed to get recommendations')
      const result = await response.json()
      setRecommendations(result.data)
      setStep(4)
    } catch {
      setError(t('ai.recommendations.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setSelectedConcerns([])
    setLastVisit('')
    setAdditionalInfo('')
    setRecommendations(null)
    setError(null)
  }

  const close = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <div className="inline-block text-left w-full max-w-lg mx-auto">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="inline-flex items-center gap-2 text-sm font-medium text-dental-primary-600 hover:text-dental-primary-700 border border-dental-primary-200 hover:border-dental-primary-400 bg-dental-primary-50 hover:bg-dental-primary-100 px-4 py-2.5 rounded-lg transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>{t('ai.recommendations.triggerButton')}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Inline panel */}
      {isOpen && (
        <div className="mt-3 bg-white border border-dental-secondary-200 rounded-xl shadow-soft overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-dental-secondary-100 bg-dental-secondary-50">
            <div className="flex items-center gap-2">
              {/* Step dots */}
              {step < 4 && (
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(s => (
                    <div
                      key={s}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        s <= step
                          ? 'bg-dental-primary-600'
                          : 'bg-dental-secondary-300'
                      }`}
                    />
                  ))}
                </div>
              )}
              <span className="text-sm font-medium text-dental-dark">
                {t('ai.recommendations.modalTitle')}
              </span>
            </div>
            <button
              onClick={close}
              className="p-1 text-dental-muted hover:text-dental-dark rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-dental-dark">
                  {t('ai.recommendations.step1.title')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickConcerns.map(concern => (
                    <button
                      key={concern.id}
                      onClick={() => toggleConcern(concern.id)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all ${
                        selectedConcerns.includes(concern.id)
                          ? 'border-dental-primary-600 bg-dental-primary-600 text-white'
                          : 'border-dental-secondary-200 text-dental-text hover:border-dental-primary-400 hover:bg-dental-primary-50'
                      }`}
                    >
                      {concern.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedConcerns.length === 0}
                  className="w-full py-2 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {t('common.next')}
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-dental-dark">
                  {t('ai.recommendations.step2.title')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lastVisitOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setLastVisit(option.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all ${
                        lastVisit === option.value
                          ? 'border-dental-primary-600 bg-dental-primary-600 text-white'
                          : 'border-dental-secondary-200 text-dental-text hover:border-dental-primary-400 hover:bg-dental-primary-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 border border-dental-secondary-200 text-dental-text text-sm font-semibold rounded-lg hover:bg-dental-secondary-50 transition-colors"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!lastVisit}
                    className="flex-1 py-2 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-dental-dark">
                  {t('ai.recommendations.step3.title')}
                </p>
                <textarea
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  placeholder={t('ai.recommendations.step3.placeholder')}
                  className="w-full h-24 px-3 py-2 border border-dental-secondary-200 rounded-lg text-sm text-dental-text placeholder:text-dental-text-light focus:outline-hidden focus:ring-2 focus:ring-dental-primary-400 focus:border-transparent resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-2 border border-dental-secondary-200 text-dental-text text-sm font-semibold rounded-lg hover:bg-dental-secondary-50 transition-colors"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={getRecommendations}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-dental-primary-700 hover:bg-dental-primary-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('ai.recommendations.actions.analyzing')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t('ai.recommendations.actions.getRecommendations')}
                      </>
                    )}
                  </button>
                </div>
                {error && <AsyncState variant="error" message={error} />}
              </div>
            )}

            {/* Step 4: Results */}
            {step === 4 && recommendations && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-dental-primary-50 border border-dental-primary-200 rounded-xl">
                  <div className="w-9 h-9 bg-dental-primary-600 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-dental-dark text-sm">
                        {recommendations.primaryRecommendation.serviceName}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgencyColors[recommendations.primaryRecommendation.urgency]}`}
                      >
                        {t(
                          `ai.recommendations.urgency.${recommendations.primaryRecommendation.urgency}`
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-dental-text mb-1.5">
                      {recommendations.primaryRecommendation.reason}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-dental-muted">
                      <Clock className="w-3 h-3" />
                      {recommendations.primaryRecommendation.estimatedDuration}
                    </div>
                  </div>
                </div>

                {recommendations.additionalRecommendations.length > 0 && (
                  <div className="space-y-1.5">
                    {recommendations.additionalRecommendations
                      .slice(0, 2)
                      .map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-dental-text"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-dental-primary-400 shrink-0 mt-1" />
                          <span>
                            <strong className="text-dental-dark">
                              {rec.serviceName}
                            </strong>{' '}
                            — {rec.reason}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                <p className="text-xs text-dental-muted italic">
                  {recommendations.disclaimer}
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={reset}
                    className="flex-1 py-2 border border-dental-secondary-200 text-dental-text text-sm font-semibold rounded-lg hover:bg-dental-secondary-50 transition-colors"
                  >
                    {t('ai.recommendations.actions.startOver')}
                  </button>
                  <Link
                    href="/booking"
                    onClick={close}
                    className="flex-1 py-2 bg-dental-primary-700 hover:bg-dental-primary-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {t('buttons.bookAppointment')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
