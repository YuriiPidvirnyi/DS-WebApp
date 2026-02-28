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
  Shield
} from 'lucide-react'

// Symptom definitions with translations
const symptoms = [
  { id: 'toothache', uk: 'Біль у зубі', en: 'Toothache', pl: 'Ból zęba', icon: '🦷' },
  { id: 'sensitivity', uk: 'Чутливість до холодного/гарячого', en: 'Sensitivity to hot/cold', pl: 'Wrażliwość na ciepło/zimno', icon: '❄️' },
  { id: 'swelling', uk: 'Набряк ясен або обличчя', en: 'Gum or face swelling', pl: 'Obrzęk dziąseł lub twarzy', icon: '🔴' },
  { id: 'bleeding', uk: 'Кровоточивість ясен', en: 'Bleeding gums', pl: 'Krwawienie dziąseł', icon: '💉' },
  { id: 'badBreath', uk: 'Неприємний запах з рота', en: 'Bad breath', pl: 'Nieświeży oddech', icon: '💨' },
  { id: 'looseTooth', uk: 'Розхитування зуба', en: 'Loose tooth', pl: 'Ruszający się ząb', icon: '↔️' },
  { id: 'discoloration', uk: 'Зміна кольору зуба', en: 'Tooth discoloration', pl: 'Przebarwienie zęba', icon: '🎨' },
  { id: 'chewingPain', uk: 'Біль при жуванні', en: 'Pain when chewing', pl: 'Ból przy żuciu', icon: '🍎' },
  { id: 'jawPain', uk: 'Біль у щелепі', en: 'Jaw pain', pl: 'Ból szczęki', icon: '😣' },
  { id: 'abscess', uk: 'Гнійник на ясні', en: 'Gum abscess', pl: 'Ropień dziąsła', icon: '⚠️' },
]

// Analysis results mapping
const symptomAnalysis: Record<string, {
  conditions: { uk: string; en: string; pl: string }[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  recommendation: { uk: string; en: string; pl: string };
}> = {
  toothache: {
    conditions: [
      { uk: 'Карієс', en: 'Tooth decay', pl: 'Próchnica' },
      { uk: 'Пульпіт', en: 'Pulpitis', pl: 'Zapalenie miazgi' },
      { uk: 'Періодонтит', en: 'Periodontitis', pl: 'Zapalenie przyzębia' },
    ],
    urgency: 'medium',
    recommendation: {
      uk: 'Рекомендуємо записатися на огляд протягом 1-3 днів',
      en: 'We recommend scheduling an examination within 1-3 days',
      pl: 'Zalecamy umówienie wizyty w ciągu 1-3 dni',
    },
  },
  sensitivity: {
    conditions: [
      { uk: 'Оголення шийки зуба', en: 'Exposed tooth neck', pl: 'Odsłonięcie szyjki zęba' },
      { uk: 'Тріщина емалі', en: 'Enamel crack', pl: 'Pęknięcie szkliwa' },
      { uk: 'Початковий карієс', en: 'Early cavity', pl: 'Wczesna próchnica' },
    ],
    urgency: 'low',
    recommendation: {
      uk: 'Запишіться на діагностику найближчим часом',
      en: 'Schedule a diagnostic appointment soon',
      pl: 'Umów się na wizytę diagnostyczną wkrótce',
    },
  },
  swelling: {
    conditions: [
      { uk: 'Абсцес', en: 'Abscess', pl: 'Ropień' },
      { uk: 'Періодонтит', en: 'Periodontitis', pl: 'Zapalenie przyzębia' },
      { uk: 'Перикороніт', en: 'Pericoronitis', pl: 'Zapalenie okołokoronkowe' },
    ],
    urgency: 'emergency',
    recommendation: {
      uk: 'Потрібна ТЕРМІНОВА консультація! Зателефонуйте негайно',
      en: 'URGENT consultation needed! Call immediately',
      pl: 'Potrzebna PILNA konsultacja! Zadzwoń natychmiast',
    },
  },
  bleeding: {
    conditions: [
      { uk: 'Гінгівіт', en: 'Gingivitis', pl: 'Zapalenie dziąseł' },
      { uk: 'Пародонтит', en: 'Periodontitis', pl: 'Paradontoza' },
    ],
    urgency: 'low',
    recommendation: {
      uk: 'Рекомендуємо професійну чистку та огляд пародонтолога',
      en: 'We recommend professional cleaning and periodontal examination',
      pl: 'Zalecamy profesjonalne czyszczenie i badanie przyzębia',
    },
  },
  badBreath: {
    conditions: [
      { uk: 'Зубний камінь', en: 'Tartar buildup', pl: 'Kamień nazębny' },
      { uk: 'Карієс', en: 'Tooth decay', pl: 'Próchnica' },
      { uk: 'Захворювання ясен', en: 'Gum disease', pl: 'Choroba dziąseł' },
    ],
    urgency: 'low',
    recommendation: {
      uk: 'Рекомендуємо професійну гігієну порожнини рота',
      en: 'We recommend professional oral hygiene',
      pl: 'Zalecamy profesjonalną higienę jamy ustnej',
    },
  },
  looseTooth: {
    conditions: [
      { uk: 'Пародонтит', en: 'Periodontitis', pl: 'Paradontoza' },
      { uk: 'Травма', en: 'Injury', pl: 'Uraz' },
    ],
    urgency: 'high',
    recommendation: {
      uk: 'Необхідна консультація протягом 24 годин',
      en: 'Consultation needed within 24 hours',
      pl: 'Konsultacja potrzebna w ciągu 24 godzin',
    },
  },
  discoloration: {
    conditions: [
      { uk: 'Некроз пульпи', en: 'Pulp necrosis', pl: 'Martwica miazgi' },
      { uk: 'Травма', en: 'Injury', pl: 'Uraz' },
      { uk: 'Внутрішнє забарвлення', en: 'Internal staining', pl: 'Wewnętrzne przebarwienie' },
    ],
    urgency: 'medium',
    recommendation: {
      uk: 'Запишіться на консультацію для визначення причини',
      en: 'Schedule a consultation to determine the cause',
      pl: 'Umów się na konsultację w celu ustalenia przyczyny',
    },
  },
  chewingPain: {
    conditions: [
      { uk: 'Карієс', en: 'Tooth decay', pl: 'Próchnica' },
      { uk: 'Тріщина зуба', en: 'Cracked tooth', pl: 'Pęknięty ząb' },
      { uk: 'Періодонтит', en: 'Periodontitis', pl: 'Zapalenie przyzębia' },
    ],
    urgency: 'medium',
    recommendation: {
      uk: 'Рекомендуємо огляд протягом кількох днів',
      en: 'We recommend an examination within a few days',
      pl: 'Zalecamy badanie w ciągu kilku dni',
    },
  },
  jawPain: {
    conditions: [
      { uk: 'Дисфункція СНЩС', en: 'TMJ dysfunction', pl: 'Dysfunkcja stawu skroniowo-żuchwowego' },
      { uk: 'Бруксизм', en: 'Bruxism', pl: 'Bruksizm' },
      { uk: 'Артрит', en: 'Arthritis', pl: 'Zapalenie stawów' },
    ],
    urgency: 'medium',
    recommendation: {
      uk: 'Рекомендуємо консультацію спеціаліста',
      en: 'We recommend a specialist consultation',
      pl: 'Zalecamy konsultację specjalisty',
    },
  },
  abscess: {
    conditions: [
      { uk: 'Периапікальний абсцес', en: 'Periapical abscess', pl: 'Ropień okołowierzchołkowy' },
      { uk: 'Пародонтальний абсцес', en: 'Periodontal abscess', pl: 'Ropień przyzębny' },
    ],
    urgency: 'emergency',
    recommendation: {
      uk: 'ТЕРМІНОВО! Зателефонуйте негайно для екстреного прийому',
      en: 'URGENT! Call immediately for emergency appointment',
      pl: 'PILNE! Zadzwoń natychmiast po wizytę nagłą',
    },
  },
}

const urgencyColors = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: Clock },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: AlertTriangle },
  emergency: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: AlertTriangle },
}

const urgencyLabels = {
  low: { uk: 'Низька терміновість', en: 'Low urgency', pl: 'Niska pilność' },
  medium: { uk: 'Середня терміновість', en: 'Medium urgency', pl: 'Średnia pilność' },
  high: { uk: 'Висока терміновість', en: 'High urgency', pl: 'Wysoka pilność' },
  emergency: { uk: 'ТЕРМІНОВО', en: 'URGENT', pl: 'PILNE' },
}

export default function SymptomCheckerPage() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'uk') as 'uk' | 'en' | 'pl'
  
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

  const getOverallUrgency = () => {
    const urgencies = selectedSymptoms.map(s => symptomAnalysis[s]?.urgency || 'low')
    if (urgencies.includes('emergency') || painLevel >= 9) return 'emergency'
    if (urgencies.includes('high') || painLevel >= 7) return 'high'
    if (urgencies.includes('medium')) return 'medium'
    return 'low'
  }

  const overallUrgency = getOverallUrgency()
  const UrgencyIcon = urgencyColors[overallUrgency].icon

  const durationOptions = [
    { value: 'today', uk: 'Сьогодні', en: 'Today', pl: 'Dzisiaj' },
    { value: 'days', uk: 'Кілька днів', en: 'A few days', pl: 'Kilka dni' },
    { value: 'week', uk: 'Тиждень', en: 'A week', pl: 'Tydzień' },
    { value: 'weeks', uk: 'Кілька тижнів', en: 'Several weeks', pl: 'Kilka tygodni' },
    { value: 'months', uk: 'Місяць або більше', en: 'A month or more', pl: 'Miesiąc lub więcej' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <Stethoscope className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('ai.symptomChecker.title')}</h1>
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
            {symptoms.map((symptom) => (
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
                <span className="font-medium">{symptom[lang]}</span>
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
            {t('ai.symptomChecker.painLevel')}: <span className="text-teal-600">{painLevel}/10</span>
          </h2>
          
          <input
            type="range"
            min="1"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-slate-500 mt-2">
            <span>{lang === 'uk' ? 'Легкий' : lang === 'pl' ? 'Lekki' : 'Mild'}</span>
            <span>{lang === 'uk' ? 'Помірний' : lang === 'pl' ? 'Umiarkowany' : 'Moderate'}</span>
            <span>{lang === 'uk' ? 'Сильний' : lang === 'pl' ? 'Silny' : 'Severe'}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {t('ai.symptomChecker.duration')}
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDuration(option.value)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  duration === option.value
                    ? 'border-teal-500 bg-teal-50 text-teal-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {option[lang]}
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
            <div className={`rounded-2xl border-2 p-6 ${urgencyColors[overallUrgency].bg} ${urgencyColors[overallUrgency].border}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallUrgency === 'emergency' ? 'bg-red-200' : overallUrgency === 'high' ? 'bg-orange-200' : overallUrgency === 'medium' ? 'bg-yellow-200' : 'bg-green-200'}`}>
                  <UrgencyIcon className={`w-6 h-6 ${urgencyColors[overallUrgency].text}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${urgencyColors[overallUrgency].text}`}>
                    {t('ai.symptomChecker.urgency')}: {urgencyLabels[overallUrgency][lang]}
                  </h3>
                  <p className="text-slate-700">
                    {overallUrgency === 'emergency' || overallUrgency === 'high' ? (
                      <span className="font-semibold">
                        {lang === 'uk' 
                          ? 'На основі ваших симптомів рекомендуємо негайно звернутися до лікаря!'
                          : lang === 'pl'
                          ? 'Na podstawie objawów zalecamy natychmiastową wizytę u lekarza!'
                          : 'Based on your symptoms, we recommend seeing a doctor immediately!'
                        }
                      </span>
                    ) : (
                      <span>
                        {lang === 'uk'
                          ? 'Рекомендуємо запланувати візит до стоматолога найближчим часом.'
                          : lang === 'pl'
                          ? 'Zalecamy umówienie wizyty u dentysty w najbliższym czasie.'
                          : 'We recommend scheduling a dental visit soon.'
                        }
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {(overallUrgency === 'emergency' || overallUrgency === 'high') && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:+380671234567"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {lang === 'uk' ? 'Зателефонувати зараз' : lang === 'pl' ? 'Zadzwoń teraz' : 'Call now'}
                  </a>
                  <Link
                    href="/booking"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-xl border-2 border-slate-200 transition-colors"
                  >
                    {lang === 'uk' ? 'Записатися онлайн' : lang === 'pl' ? 'Umów się online' : 'Book online'}
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
                {selectedSymptoms.map((symptomId) => {
                  const symptom = symptoms.find(s => s.id === symptomId)
                  const analysis = symptomAnalysis[symptomId]
                  if (!symptom || !analysis) return null
                  
                  const isExpanded = expandedConditions.includes(symptomId)
                  
                  return (
                    <div key={symptomId} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedConditions(prev => 
                          isExpanded ? prev.filter(id => id !== symptomId) : [...prev, symptomId]
                        )}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{symptom.icon}</span>
                          <span className="font-medium text-slate-900">{symptom[lang]}</span>
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
                              {analysis.conditions.map((condition, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                                >
                                  {condition[lang]}
                                </span>
                              ))}
                            </div>
                            <div className={`p-3 rounded-lg ${urgencyColors[analysis.urgency].bg}`}>
                              <p className={`text-sm font-medium ${urgencyColors[analysis.urgency].text}`}>
                                {analysis.recommendation[lang]}
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
                  {lang === 'uk' 
                    ? 'Готові записатися на прийом?' 
                    : lang === 'pl'
                    ? 'Gotowy umówić się na wizytę?'
                    : 'Ready to book an appointment?'
                  }
                </h3>
                <p className="text-teal-100 mb-4">
                  {lang === 'uk'
                    ? 'Безкоштовна консультація для нових пацієнтів'
                    : lang === 'pl'
                    ? 'Bezpłatna konsultacja dla nowych pacjentów'
                    : 'Free consultation for new patients'
                  }
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
              {lang === 'uk'
                ? '* Це попередня оцінка на основі описаних симптомів. Точний діагноз може поставити тільки лікар після огляду.'
                : lang === 'pl'
                ? '* To wstępna ocena na podstawie opisanych objawów. Dokładną diagnozę może postawić tylko lekarz po badaniu.'
                : '* This is a preliminary assessment based on described symptoms. Only a doctor can provide an accurate diagnosis after examination.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
