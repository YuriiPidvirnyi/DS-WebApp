'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
} from 'lucide-react'

const symptoms = [
  { id: 'toothache', icon: '🦷' },
  { id: 'sensitivity', icon: '❄️' },
  { id: 'swelling', icon: '🔴' },
  { id: 'bleeding', icon: '💉' },
  { id: 'badBreath', icon: '💨' },
  { id: 'looseTooth', icon: '↔️' },
  { id: 'discoloration', icon: '🎨' },
  { id: 'chewingPain', icon: '🍎' },
  { id: 'jawPain', icon: '😣' },
  { id: 'abscess', icon: '⚠️' },
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
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: Clock,
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: AlertTriangle,
  },
  emergency: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
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
  const [painLevel, setPainLevel] = useState<number>(5)
  const [duration, setDuration] = useState<string>('')
  const [showResults, setShowResults] = useState(false)
  const [expandedConditions, setExpandedConditions] = useState<string[]>([])

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
    setShowResults(false)
  }

  const analyzeSymptoms = () => {
    if (selectedSymptoms.length === 0) return
    setShowResults(true)
  }

  const getOverallUrgency = (): Urgency => {
    const urgencies = selectedSymptoms.map(
      s => symptomAnalysis[s]?.urgency || 'low'
    )
    if (urgencies.includes('emergency') || painLevel >= 9) return 'emergency'
    if (urgencies.includes('high') || painLevel >= 7) return 'high'
    if (urgencies.includes('medium')) return 'medium'
    return 'low'
  }

  const overallUrgency = getOverallUrgency()
  const UrgencyIcon = urgencyColors[overallUrgency].icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <Stethoscope className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {t('ai.symptomChecker.title')}
          </h1>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            {t('ai.symptomChecker.selectSymptoms')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symptoms.map(symptom => (
              <button
                key={symptom.id}
                onClick={() => toggleSymptom(symptom.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedSymptoms.includes(symptom.id)
                    ? 'border-teal-500 bg-teal-50 text-teal-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-2xl">{symptom.icon}</span>
                <span className="font-medium">
                  {t(`ai.symptomChecker.symptoms.${symptom.id}`)}
                </span>
                {selectedSymptoms.includes(symptom.id) && (
                  <CheckCircle className="w-5 h-5 text-teal-600 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pain Level */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {t('ai.symptomChecker.painLevel')}:{' '}
            <span className="text-teal-600">{painLevel}/10</span>
          </h2>

          <input
            type="range"
            min="1"
            max="10"
            value={painLevel}
            onChange={e => setPainLevel(parseInt(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-slate-500 mt-2">
            <span>{t('ai.symptomChecker.scale.mild')}</span>
            <span>{t('ai.symptomChecker.scale.moderate')}</span>
            <span>{t('ai.symptomChecker.scale.severe')}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {t('ai.symptomChecker.duration')}
          </h2>

          <div className="flex flex-wrap gap-3">
            {durationOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setDuration(option.value)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  duration === option.value
                    ? 'border-teal-500 bg-teal-50 text-teal-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeSymptoms}
          disabled={selectedSymptoms.length === 0}
          className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed mb-8"
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
                      ? 'bg-red-200'
                      : overallUrgency === 'high'
                        ? 'bg-orange-200'
                        : overallUrgency === 'medium'
                          ? 'bg-yellow-200'
                          : 'bg-green-200'
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
                  <p className="text-slate-700">
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
                    href="tel:+380671234567"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {t('ai.symptomChecker.actions.callNow')}
                  </a>
                  <Link
                    href="/booking"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-xl border-2 border-slate-200 transition-colors"
                  >
                    {t('ai.symptomChecker.actions.bookOnline')}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">
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
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedConditions(prev =>
                            isExpanded
                              ? prev.filter(id => id !== symptomId)
                              : [...prev, symptomId]
                          )
                        }
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{symptom.icon}</span>
                          <span className="font-medium text-slate-900">
                            {t(`ai.symptomChecker.symptoms.${symptom.id}`)}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100">
                          <div className="pt-4">
                            <p className="text-sm text-slate-500 mb-3">
                              {t('ai.symptomChecker.possibleCauses')}:
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {conditions.map((condition, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
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
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-6 text-white text-center">
                <h3 className="text-xl font-bold mb-2">
                  {t('ai.symptomChecker.cta.title')}
                </h3>
                <p className="text-teal-100 mb-4">
                  {t('ai.symptomChecker.cta.subtitle')}
                </p>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-teal-700 font-semibold rounded-xl transition-colors"
                >
                  {t('buttons.bookAppointment')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-sm text-slate-500 italic">
              {t('ai.symptomChecker.disclaimerDetailed')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
