'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import {
  Sparkles,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Heart,
  Lightbulb,
  ArrowRight,
  X
} from 'lucide-react'

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

const quickConcerns = [
  { id: 'checkup', uk: 'Плановий огляд', en: 'Routine checkup', pl: 'Rutynowa kontrola' },
  { id: 'pain', uk: 'Біль у зубі', en: 'Toothache', pl: 'Ból zęba' },
  { id: 'whitening', uk: 'Відбілювання', en: 'Whitening', pl: 'Wybielanie' },
  { id: 'cleaning', uk: 'Чистка зубів', en: 'Teeth cleaning', pl: 'Czyszczenie zębów' },
  { id: 'braces', uk: 'Вирівнювання зубів', en: 'Teeth alignment', pl: 'Prostowanie zębów' },
  { id: 'implant', uk: 'Відсутній зуб', en: 'Missing tooth', pl: 'Brakujący ząb' },
]

const lastVisitOptions = [
  { value: 'less6months', uk: 'Менше 6 місяців тому', en: 'Less than 6 months ago', pl: 'Mniej niż 6 miesięcy temu' },
  { value: '6to12months', uk: '6-12 місяців тому', en: '6-12 months ago', pl: '6-12 miesięcy temu' },
  { value: 'more1year', uk: 'Більше року тому', en: 'More than a year ago', pl: 'Ponad rok temu' },
  { value: 'never', uk: 'Не пам\'ятаю', en: 'Don\'t remember', pl: 'Nie pamiętam' },
]

export default function SmartRecommendations() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'uk') as 'uk' | 'en' | 'pl'
  
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([])
  const [lastVisit, setLastVisit] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null)
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
        return concern ? concern.uk : id
      })
      
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setError(lang === 'uk' 
        ? 'Помилка при отриманні рекомендацій. Спробуйте ще раз.'
        : lang === 'pl'
        ? 'Błąd podczas uzyskiwania rekomendacji. Spróbuj ponownie.'
        : 'Error getting recommendations. Please try again.'
      )
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

  const urgencyLabels = {
    routine: { uk: 'Плановий', en: 'Routine', pl: 'Planowy' },
    soon: { uk: 'Найближчим часом', en: 'Soon', pl: 'Wkrótce' },
    urgent: { uk: 'Терміново', en: 'Urgent', pl: 'Pilne' },
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
          {lang === 'uk' 
            ? 'AI-підбір послуг' 
            : lang === 'pl'
            ? 'AI dobór usług'
            : 'AI Service Finder'
          }
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
                  {lang === 'uk' 
                    ? 'Розумний підбір послуг' 
                    : lang === 'pl'
                    ? 'Inteligentny dobór usług'
                    : 'Smart Service Finder'
                  }
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
                  {[1, 2, 3].map((s) => (
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
                    {lang === 'uk' 
                      ? 'Що вас турбує?' 
                      : lang === 'pl'
                      ? 'Co Cię niepokoi?'
                      : 'What concerns you?'
                    }
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {quickConcerns.map((concern) => (
                      <button
                        key={concern.id}
                        onClick={() => toggleConcern(concern.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedConcerns.includes(concern.id)
                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-medium">{concern[lang]}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedConcerns.length === 0}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed mt-4"
                  >
                    {lang === 'uk' ? 'Далі' : lang === 'pl' ? 'Dalej' : 'Next'}
                  </button>
                </div>
              )}

              {/* Step 2: Last Visit */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {lang === 'uk' 
                      ? 'Коли ви востаннє відвідували стоматолога?' 
                      : lang === 'pl'
                      ? 'Kiedy ostatnio byłeś u dentysty?'
                      : 'When did you last visit a dentist?'
                    }
                  </h3>
                  <div className="space-y-2">
                    {lastVisitOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLastVisit(option.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          lastVisit === option.value
                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {option[lang]}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {lang === 'uk' ? 'Назад' : lang === 'pl' ? 'Wstecz' : 'Back'}
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!lastVisit}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                      {lang === 'uk' ? 'Далі' : lang === 'pl' ? 'Dalej' : 'Next'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Additional Info */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {lang === 'uk' 
                      ? 'Щось додаткове?' 
                      : lang === 'pl'
                      ? 'Coś dodatkowego?'
                      : 'Anything else?'
                    }
                  </h3>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder={lang === 'uk' 
                      ? 'Опишіть детальніше вашу ситуацію (необов\'язково)...'
                      : lang === 'pl'
                      ? 'Opisz szczegółowo swoją sytuację (opcjonalnie)...'
                      : 'Describe your situation in detail (optional)...'
                    }
                    className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {lang === 'uk' ? 'Назад' : lang === 'pl' ? 'Wstecz' : 'Back'}
                    </button>
                    <button
                      onClick={getRecommendations}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{lang === 'uk' ? 'Аналіз...' : lang === 'pl' ? 'Analiza...' : 'Analyzing...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>{lang === 'uk' ? 'Отримати рекомендації' : lang === 'pl' ? 'Uzyskaj rekomendacje' : 'Get Recommendations'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}
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
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgencyColors[recommendations.primaryRecommendation.urgency]}`}>
                            {urgencyLabels[recommendations.primaryRecommendation.urgency][lang]}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">
                          {recommendations.primaryRecommendation.reason}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>{recommendations.primaryRecommendation.estimatedDuration}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Recommendations */}
                  {recommendations.additionalRecommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-purple-600" />
                        {lang === 'uk' ? 'Також рекомендуємо' : lang === 'pl' ? 'Również polecamy' : 'Also recommended'}
                      </h4>
                      <div className="space-y-2">
                        {recommendations.additionalRecommendations.map((rec, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border-2 ${priorityColors[rec.priority]}`}>
                            <h5 className="font-semibold text-slate-900">{rec.serviceName}</h5>
                            <p className="text-sm text-slate-600">{rec.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="grid grid-cols-2 gap-4">
                    {recommendations.preventiveCare.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {lang === 'uk' ? 'Профілактика' : lang === 'pl' ? 'Profilaktyka' : 'Prevention'}
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {recommendations.preventiveCare.slice(0, 3).map((tip, idx) => (
                            <li key={idx}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recommendations.lifestyleTips.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          {lang === 'uk' ? 'Поради' : lang === 'pl' ? 'Porady' : 'Tips'}
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {recommendations.lifestyleTips.slice(0, 3).map((tip, idx) => (
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
                      {lang === 'uk' ? 'Почати знову' : lang === 'pl' ? 'Zacznij od nowa' : 'Start over'}
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
