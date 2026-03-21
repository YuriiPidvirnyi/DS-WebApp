'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import {
  Sparkles,
  ChevronRight,
  Loader2,
  CheckCircle,
  Clock,
  Heart,
  Lightbulb,
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

export default function SmartRecommendations() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'uk') as 'uk' | 'en' | 'pl'
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

      const csrfToken =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('csrf_token') || ''
          : ''

      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          symptoms: concernLabels,
          lastVisit: lastVisit,
          concerns: additionalInfo,
          language: lang,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
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

  const urgencyColors = {
    routine: 'bg-green-100 text-green-800',
    soon: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50',
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <Sparkles className="w-6 h-6 relative z-10" />
        <span className="relative z-10">
          {t('ai.recommendations.triggerButton')}
        </span>
        <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-xl font-bold">
                  {t('ai.recommendations.modalTitle')}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress */}
            {step < 4 && (
              <div className="px-6 pt-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map(s => (
                    <div
                      key={s}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        s <= step ? 'bg-purple-500' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Step 1: Concerns */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t('ai.recommendations.step1.title')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {quickConcerns.map(concern => (
                      <button
                        key={concern.id}
                        onClick={() => toggleConcern(concern.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedConcerns.includes(concern.id)
                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-medium">{concern.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedConcerns.length === 0}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed mt-4"
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}

              {/* Step 2: Last Visit */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t('ai.recommendations.step2.title')}
                  </h3>
                  <div className="space-y-2">
                    {lastVisitOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setLastVisit(option.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          lastVisit === option.value
                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {t('common.back')}
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!lastVisit}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                      {t('common.next')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Additional Info */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t('ai.recommendations.step3.title')}
                  </h3>
                  <textarea
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder={t('ai.recommendations.step3.placeholder')}
                    className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {t('common.back')}
                    </button>
                    <button
                      onClick={getRecommendations}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>
                            {t('ai.recommendations.actions.analyzing')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>
                            {t('ai.recommendations.actions.getRecommendations')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  {error && <AsyncState variant="error" message={error} />}
                </div>
              )}

              {/* Step 4: Results */}
              {step === 4 && recommendations && (
                <div className="space-y-6">
                  {/* Primary Recommendation */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-slate-900 text-lg">
                            {recommendations.primaryRecommendation.serviceName}
                          </h3>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${urgencyColors[recommendations.primaryRecommendation.urgency]}`}
                          >
                            {t(
                              `ai.recommendations.urgency.${recommendations.primaryRecommendation.urgency}`
                            )}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">
                          {recommendations.primaryRecommendation.reason}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>
                            {
                              recommendations.primaryRecommendation
                                .estimatedDuration
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Recommendations */}
                  {recommendations.additionalRecommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-purple-600" />
                        {t('ai.recommendations.results.alsoRecommended')}
                      </h4>
                      <div className="space-y-2">
                        {recommendations.additionalRecommendations.map(
                          (rec, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border-2 ${priorityColors[rec.priority]}`}
                            >
                              <h5 className="font-semibold text-slate-900">
                                {rec.serviceName}
                              </h5>
                              <p className="text-sm text-slate-600">
                                {rec.reason}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="grid grid-cols-2 gap-4">
                    {recommendations.preventiveCare.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {t('ai.recommendations.results.prevention')}
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {recommendations.preventiveCare
                            .slice(0, 3)
                            .map((tip, idx) => (
                              <li key={idx}>• {tip}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {recommendations.lifestyleTips.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          {t('ai.recommendations.results.tips')}
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {recommendations.lifestyleTips
                            .slice(0, 3)
                            .map((tip, idx) => (
                              <li key={idx}>• {tip}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Disclaimer */}
                  <p className="text-xs text-slate-500 italic">
                    {recommendations.disclaimer}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={reset}
                      className="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {t('ai.recommendations.actions.startOver')}
                    </button>
                    <Link
                      href="/booking"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {t('buttons.bookAppointment')}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
