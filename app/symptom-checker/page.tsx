'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { trackEvent, AIEvent, AnalyticsEventCategory } from '@/utils/analytics'
import { CONTACT_INFO } from '@/utils/constants'
import Link from 'next/link'
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles,
  Shield,
  Zap,
  Thermometer,
  CircleDot,
  Droplet,
  Wind,
  MoveHorizontal,
  Palette,
  Apple,
  Frown,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

/* Lucide-іконки замість емодзі — одна іконографіка з рештою продукту (А2) */
const symptoms: { id: string; icon: LucideIcon }[] = [
  { id: 'toothache', icon: Zap },
  { id: 'sensitivity', icon: Thermometer },
  { id: 'swelling', icon: CircleDot },
  { id: 'bleeding', icon: Droplet },
  { id: 'badBreath', icon: Wind },
  { id: 'looseTooth', icon: MoveHorizontal },
  { id: 'discoloration', icon: Palette },
  { id: 'chewingPain', icon: Apple },
  { id: 'jawPain', icon: Frown },
  { id: 'abscess', icon: TriangleAlert },
]

type Urgency = 'low' | 'medium' | 'high' | 'emergency'

const symptomAnalysis: Record<
  string,
  {
    conditionsKey: string
    urgency: Urgency
    recommendationKey: string
  }
> = {
  toothache: {
    conditionsKey: 'ai.symptomChecker.analysis.toothache.conditions',
    urgency: 'medium',
    recommendationKey: 'ai.symptomChecker.analysis.toothache.recommendation',
  },
  sensitivity: {
    conditionsKey: 'ai.symptomChecker.analysis.sensitivity.conditions',
    urgency: 'low',
    recommendationKey: 'ai.symptomChecker.analysis.sensitivity.recommendation',
  },
  swelling: {
    conditionsKey: 'ai.symptomChecker.analysis.swelling.conditions',
    urgency: 'emergency',
    recommendationKey: 'ai.symptomChecker.analysis.swelling.recommendation',
  },
  bleeding: {
    conditionsKey: 'ai.symptomChecker.analysis.bleeding.conditions',
    urgency: 'low',
    recommendationKey: 'ai.symptomChecker.analysis.bleeding.recommendation',
  },
  badBreath: {
    conditionsKey: 'ai.symptomChecker.analysis.badBreath.conditions',
    urgency: 'low',
    recommendationKey: 'ai.symptomChecker.analysis.badBreath.recommendation',
  },
  looseTooth: {
    conditionsKey: 'ai.symptomChecker.analysis.looseTooth.conditions',
    urgency: 'high',
    recommendationKey: 'ai.symptomChecker.analysis.looseTooth.recommendation',
  },
  discoloration: {
    conditionsKey: 'ai.symptomChecker.analysis.discoloration.conditions',
    urgency: 'medium',
    recommendationKey:
      'ai.symptomChecker.analysis.discoloration.recommendation',
  },
  chewingPain: {
    conditionsKey: 'ai.symptomChecker.analysis.chewingPain.conditions',
    urgency: 'medium',
    recommendationKey: 'ai.symptomChecker.analysis.chewingPain.recommendation',
  },
  jawPain: {
    conditionsKey: 'ai.symptomChecker.analysis.jawPain.conditions',
    urgency: 'medium',
    recommendationKey: 'ai.symptomChecker.analysis.jawPain.recommendation',
  },
  abscess: {
    conditionsKey: 'ai.symptomChecker.analysis.abscess.conditions',
    urgency: 'emergency',
    recommendationKey: 'ai.symptomChecker.analysis.abscess.recommendation',
  },
}

const urgencyColors: Record<
  Urgency,
  { bg: string; border: string; text: string; icon: typeof CheckCircle }
> = {
  low: {
    bg: 'bg-status-success-100',
    border: 'border-dental-success/30',
    text: 'text-status-success-700',
    icon: CheckCircle,
  },
  medium: {
    bg: 'bg-status-warning-100',
    border: 'border-dental-warning/30',
    text: 'text-status-warning-700',
    icon: Clock,
  },
  high: {
    bg: 'bg-status-warning-100',
    border: 'border-dental-warning/50',
    text: 'text-status-warning-700',
    icon: AlertTriangle,
  },
  emergency: {
    bg: 'bg-status-error-100',
    border: 'border-dental-error/20',
    text: 'text-status-error-700',
    icon: AlertTriangle,
  },
}

const urgencyLabelKeys: Record<Urgency, string> = {
  low: 'ai.symptomChecker.urgencyLevels.low',
  medium: 'ai.symptomChecker.urgencyLevels.medium',
  high: 'ai.symptomChecker.urgencyLevels.high',
  emergency: 'ai.symptomChecker.urgencyLevels.emergency',
}

const durationOptions = [
  { value: 'today', labelKey: 'ai.symptomChecker.durations.today' },
  { value: 'days', labelKey: 'ai.symptomChecker.durations.days' },
  { value: 'week', labelKey: 'ai.symptomChecker.durations.week' },
  { value: 'weeks', labelKey: 'ai.symptomChecker.durations.weeks' },
  { value: 'months', labelKey: 'ai.symptomChecker.durations.months' },
]

export default function SymptomCheckerPage() {
  const { t } = useTranslation()

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  // Слайдер болю стартує «не вказано» й не рахується, поки його не торкнулись (А4)
  const [painLevel, setPainLevel] = useState<number | null>(null)
  const [duration, setDuration] = useState<string>('')
  const [showResults, setShowResults] = useState(false)
  const [expandedConditions, setExpandedConditions] = useState<string[]>([])

  useEffect(() => {
    try {
      trackEvent(AIEvent.SymptomCheckerStarted, AnalyticsEventCategory.AI)
    } catch {
      // analytics may fail silently
    }
  }, [])

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
    setShowResults(false)
  }

  const analyzeSymptoms = () => {
    if (selectedSymptoms.length === 0 || !duration) return
    setShowResults(true)
    try {
      trackEvent(AIEvent.SymptomCheckerCompleted, AnalyticsEventCategory.AI, {
        symptom_count: selectedSymptoms.length,
      })
    } catch {
      // analytics may fail silently
    }
  }

  const getOverallUrgency = (): Urgency => {
    const urgencies = selectedSymptoms.map(
      s => symptomAnalysis[s]?.urgency || 'low'
    )
    if (urgencies.includes('emergency') || (painLevel ?? 0) >= 9)
      return 'emergency'
    let urgency: Urgency = 'low'
    if (urgencies.includes('high') || (painLevel ?? 0) >= 7) urgency = 'high'
    else if (urgencies.includes('medium')) urgency = 'medium'
    // «Тривалість» впливає на терміновість (А3): затяжні симптоми — вище
    if ((duration === 'weeks' || duration === 'months') && urgency !== 'high') {
      urgency = urgency === 'medium' ? 'high' : 'medium'
    }
    return urgency
  }

  const overallUrgency = getOverallUrgency()
  const UrgencyIcon = urgencyColors[overallUrgency].icon

  return (
    <div className="min-h-screen bg-dental-secondary-50">
      {/* Header */}
      <section className="py-16 bg-dental-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <Stethoscope className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {t('ai.symptomChecker.title')}
          </h1>
          <p className="text-xl text-dental-primary-100 max-w-2xl mx-auto">
            {t('ai.symptomChecker.description')}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm">
            <Shield className="w-4 h-4" />
            <span>{t('ai.symptomChecker.disclaimer')}</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Symptom Selection */}
        <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-dental-dark mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-dental-primary-ink" />
            {t('ai.symptomChecker.selectSymptoms')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symptoms.map(symptom => {
              const selected = selectedSymptoms.includes(symptom.id)
              const SymptomIcon = symptom.icon
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  aria-pressed={selected}
                  className={`flex min-h-12 items-center gap-3 p-3.5 rounded-[14px] border-[1.5px] transition-all duration-200 text-left ${
                    selected
                      ? 'border-dental-primary-600 bg-dental-primary-50'
                      : 'border-dental-secondary-300 bg-white hover:border-dental-primary-400'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
                      selected
                        ? 'bg-dental-primary-600 text-white'
                        : 'bg-status-neutral-100 text-dental-primary-600'
                    }`}
                  >
                    <SymptomIcon className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-dental-dark">
                    {t(`ai.symptomChecker.symptoms.${symptom.id}`)}
                  </span>
                  {selected && (
                    <CheckCircle className="w-5 h-5 text-dental-primary-ink ml-auto" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pain Level */}
        <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-dental-dark mb-6">
            {t('ai.symptomChecker.painLevel')}:{' '}
            {painLevel === null ? (
              <span className="text-dental-muted italic font-normal text-base">
                {t('ai.symptomChecker.notSpecified')}
              </span>
            ) : (
              <span className="text-dental-primary-ink">{painLevel}/10</span>
            )}
          </h2>

          <input
            type="range"
            min="1"
            max="10"
            value={painLevel ?? 1}
            onChange={e => setPainLevel(parseInt(e.target.value))}
            className={`w-full h-3 bg-dental-secondary-200 rounded-lg appearance-none cursor-pointer accent-dental-primary-600 ${painLevel === null ? 'opacity-60' : ''}`}
            aria-label={t('ai.symptomChecker.painLevel')}
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={painLevel ?? 1}
            aria-valuetext={
              painLevel === null
                ? t('ai.symptomChecker.notSpecified')
                : `${painLevel}/10`
            }
          />
          <div className="flex justify-between text-sm text-dental-muted mt-2">
            <span>{t('ai.symptomChecker.scale.mild')}</span>
            <span>{t('ai.symptomChecker.scale.moderate')}</span>
            <span>{t('ai.symptomChecker.scale.severe')}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-dental-dark mb-6">
            {t('ai.symptomChecker.duration')}{' '}
            <span className="text-dental-error" aria-hidden="true">
              *
            </span>
          </h2>

          <div className="flex flex-wrap gap-3">
            {durationOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setDuration(option.value)}
                aria-pressed={duration === option.value}
                className={`min-h-11 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  duration === option.value
                    ? 'border-dental-primary-600 bg-dental-primary-600 text-white'
                    : 'border-dental-secondary-300 hover:border-dental-primary-400 text-dental-muted'
                }`}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-dental-muted">
            {t('ai.symptomChecker.durationHint')}
          </p>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeSymptoms}
          disabled={selectedSymptoms.length === 0 || !duration}
          className="w-full py-4 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:bg-dental-secondary-300 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed mb-8"
        >
          <Sparkles className="w-5 h-5" />
          {t('ai.symptomChecker.analyze')}
        </button>

        {/* Results */}
        {showResults && selectedSymptoms.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            {/* Overall Assessment */}
            <div
              className={`rounded-2xl border-2 p-6 ${urgencyColors[overallUrgency].bg} ${urgencyColors[overallUrgency].border}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    overallUrgency === 'emergency'
                      ? 'bg-dental-error/20'
                      : overallUrgency === 'high'
                        ? 'bg-dental-warning/30'
                        : overallUrgency === 'medium'
                          ? 'bg-dental-warning/20'
                          : 'bg-dental-success/20'
                  }`}
                >
                  <UrgencyIcon
                    className={`w-6 h-6 ${urgencyColors[overallUrgency].text}`}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-xl font-bold mb-2 ${urgencyColors[overallUrgency].text}`}
                  >
                    {t('ai.symptomChecker.urgency')}:{' '}
                    {t(urgencyLabelKeys[overallUrgency])}
                  </h3>
                  <p className="text-dental-text">
                    {overallUrgency === 'emergency' ||
                    overallUrgency === 'high' ? (
                      <span className="font-semibold">
                        {t('ai.symptomChecker.assessment.immediate')}
                      </span>
                    ) : (
                      <span>{t('ai.symptomChecker.assessment.soon')}</span>
                    )}
                  </p>
                </div>
              </div>

              {(overallUrgency === 'emergency' ||
                overallUrgency === 'high') && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <a
                    href={`tel:${CONTACT_INFO.emergencyPhoneRaw}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-dental-error hover:bg-dental-error-dark text-white font-semibold rounded-xl transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {t('ai.symptomChecker.actions.callNow')}
                  </a>
                  <Link
                    href="/booking"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-dental-secondary-50 text-dental-dark font-semibold rounded-xl border-2 border-dental-secondary-200 transition-colors"
                  >
                    {t('ai.symptomChecker.actions.bookOnline')}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-200 p-6">
              <h3 className="text-xl font-semibold text-dental-dark mb-6">
                {t('ai.symptomChecker.possibleCauses')}
              </h3>

              <div className="space-y-4">
                {selectedSymptoms.map(symptomId => {
                  const symptom = symptoms.find(s => s.id === symptomId)
                  const analysis = symptomAnalysis[symptomId]
                  if (!symptom || !analysis) return null

                  const isExpanded = expandedConditions.includes(symptomId)
                  const conditions = t(analysis.conditionsKey, {
                    returnObjects: true,
                  }) as string[]

                  return (
                    <div
                      key={symptomId}
                      className="border border-dental-secondary-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedConditions(prev =>
                            isExpanded
                              ? prev.filter(id => id !== symptomId)
                              : [...prev, symptomId]
                          )
                        }
                        className="w-full flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-neutral-100 text-dental-primary-600"
                          >
                            <symptom.icon className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-dental-dark">
                            {t(`ai.symptomChecker.symptoms.${symptom.id}`)}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-dental-secondary-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-dental-secondary-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-dental-secondary-100">
                          <div className="pt-4">
                            <p className="text-sm text-dental-muted mb-3">
                              {t('ai.symptomChecker.possibleCauses')}:
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {conditions.map((condition, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-dental-secondary-100 text-dental-text rounded-full text-sm"
                                >
                                  {condition}
                                </span>
                              ))}
                            </div>
                            <div
                              className={`p-3 rounded-lg ${urgencyColors[analysis.urgency].bg}`}
                            >
                              <p
                                className={`text-sm font-medium ${urgencyColors[analysis.urgency].text}`}
                              >
                                {t(analysis.recommendationKey)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            {overallUrgency !== 'emergency' && overallUrgency !== 'high' && (
              <div className="bg-dental-primary-600 rounded-2xl p-6 text-white text-center">
                <h3 className="text-xl font-bold mb-2">
                  {t('ai.symptomChecker.cta.title')}
                </h3>
                <p className="text-dental-primary-100 mb-4">
                  {t('ai.symptomChecker.cta.subtitle')}
                </p>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-dental-secondary-100 text-dental-primary-700 font-semibold rounded-xl transition-colors"
                >
                  {t('buttons.bookAppointment')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-sm text-dental-muted italic">
              {t('ai.symptomChecker.disclaimerDetailed')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
