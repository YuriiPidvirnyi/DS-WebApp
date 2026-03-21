'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calculator, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { createContact } from '@/services/contacts'

interface Service {
  id: string
  nameKey: string
  priceFrom: number
  priceTo: number
  categoryKey: string
}

const services: Service[] = [
  {
    id: 'consultation',
    nameKey: 'priceCalculator.services.consultation',
    priceFrom: 300,
    priceTo: 500,
    categoryKey: 'priceCalculator.categories.therapy',
  },
  {
    id: 'filling-simple',
    nameKey: 'priceCalculator.services.fillingSimple',
    priceFrom: 800,
    priceTo: 1200,
    categoryKey: 'priceCalculator.categories.therapy',
  },
  {
    id: 'filling-composite',
    nameKey: 'priceCalculator.services.fillingComposite',
    priceFrom: 1500,
    priceTo: 2500,
    categoryKey: 'priceCalculator.categories.therapy',
  },
  {
    id: 'canal-treatment',
    nameKey: 'priceCalculator.services.canalTreatment',
    priceFrom: 2000,
    priceTo: 3500,
    categoryKey: 'priceCalculator.categories.therapy',
  },

  {
    id: 'extraction-simple',
    nameKey: 'priceCalculator.services.extractionSimple',
    priceFrom: 800,
    priceTo: 1500,
    categoryKey: 'priceCalculator.categories.surgery',
  },
  {
    id: 'extraction-complex',
    nameKey: 'priceCalculator.services.extractionComplex',
    priceFrom: 2000,
    priceTo: 4000,
    categoryKey: 'priceCalculator.categories.surgery',
  },
  {
    id: 'wisdom-tooth',
    nameKey: 'priceCalculator.services.wisdomTooth',
    priceFrom: 3000,
    priceTo: 6000,
    categoryKey: 'priceCalculator.categories.surgery',
  },

  {
    id: 'crown-metal-ceramic',
    nameKey: 'priceCalculator.services.crownMetalCeramic',
    priceFrom: 3500,
    priceTo: 5000,
    categoryKey: 'priceCalculator.categories.prosthetics',
  },
  {
    id: 'crown-zirconia',
    nameKey: 'priceCalculator.services.crownZirconia',
    priceFrom: 7000,
    priceTo: 12000,
    categoryKey: 'priceCalculator.categories.prosthetics',
  },
  {
    id: 'veneer',
    nameKey: 'priceCalculator.services.veneer',
    priceFrom: 8000,
    priceTo: 15000,
    categoryKey: 'priceCalculator.categories.prosthetics',
  },

  {
    id: 'implant',
    nameKey: 'priceCalculator.services.implant',
    priceFrom: 15000,
    priceTo: 25000,
    categoryKey: 'priceCalculator.categories.implantation',
  },
  {
    id: 'bone-grafting',
    nameKey: 'priceCalculator.services.boneGrafting',
    priceFrom: 8000,
    priceTo: 15000,
    categoryKey: 'priceCalculator.categories.implantation',
  },

  {
    id: 'braces-metal',
    nameKey: 'priceCalculator.services.bracesMetal',
    priceFrom: 20000,
    priceTo: 30000,
    categoryKey: 'priceCalculator.categories.orthodontics',
  },
  {
    id: 'braces-ceramic',
    nameKey: 'priceCalculator.services.bracesCeramic',
    priceFrom: 30000,
    priceTo: 45000,
    categoryKey: 'priceCalculator.categories.orthodontics',
  },
  {
    id: 'aligners',
    nameKey: 'priceCalculator.services.aligners',
    priceFrom: 50000,
    priceTo: 120000,
    categoryKey: 'priceCalculator.categories.orthodontics',
  },

  {
    id: 'whitening',
    nameKey: 'priceCalculator.services.whitening',
    priceFrom: 3000,
    priceTo: 8000,
    categoryKey: 'priceCalculator.categories.aesthetics',
  },
  {
    id: 'hygiene',
    nameKey: 'priceCalculator.services.hygiene',
    priceFrom: 1200,
    priceTo: 2000,
    categoryKey: 'priceCalculator.categories.aesthetics',
  },
]

export default function PriceCalculator() {
  const { t } = useTranslation()
  const [selectedServices, setSelectedServices] = useState<
    Record<string, number>
  >({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleServiceChange = (serviceId: string, quantity: number) => {
    setSelectedServices(prev => {
      if (quantity === 0) {
        const { [serviceId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [serviceId]: quantity }
    })
  }

  const calculateTotal = () => {
    let min = 0
    let max = 0

    Object.entries(selectedServices).forEach(([serviceId, quantity]) => {
      const service = services.find(s => s.id === serviceId)
      if (service) {
        min += service.priceFrom * quantity
        max += service.priceTo * quantity
      }
    })

    return { min, max }
  }

  const total = calculateTotal()
  const hasSelection = Object.keys(selectedServices).length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone) {
      toast.error(t('priceCalculator.fillAllFields'))
      return
    }

    setIsSubmitting(true)
    try {
      // Build a message with selected services and estimated cost
      const selectedList = Object.entries(selectedServices)
        .map(([id, qty]) => {
          const svc = services.find(s => s.id === id)
          return svc
            ? `${t(svc.nameKey)} x${qty} (${svc.priceFrom}-${svc.priceTo} ${t('priceCalculator.currency')})`
            : null
        })
        .filter(Boolean)
        .join('\n')

      const message = [
        `[${t('priceCalculator.title')}]`,
        selectedList,
        `${t('priceCalculator.estimatedCost')}: ${total.min.toLocaleString()} - ${total.max.toLocaleString()} ${t('priceCalculator.currency')}`,
      ].join('\n')

      const res = await createContact({
        name,
        phone,
        email: '',
        message,
        consent: true,
      })

      if (!res.success) throw new Error()
      toast.success(t('priceCalculator.successMessage'))
      setShowForm(false)
      setName('')
      setPhone('')
    } catch {
      toast.error(t('priceCalculator.errorMessage'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryKeys = Array.from(new Set(services.map(s => s.categoryKey)))

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <Calculator className="h-8 w-8 text-dental-teal mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('priceCalculator.title')}
          </h2>
          <p className="text-gray-600 text-sm">
            {t('priceCalculator.subtitle')}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {categoryKeys.map(categoryKey => (
          <div key={categoryKey}>
            <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              {t(categoryKey)}
            </h3>
            <div className="space-y-2">
              {services
                .filter(s => s.categoryKey === categoryKey)
                .map(service => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {t(service.nameKey)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.priceFrom} - {service.priceTo}{' '}
                        {t('priceCalculator.currency')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleServiceChange(
                            service.id,
                            Math.max(0, (selectedServices[service.id] || 0) - 1)
                          )
                        }
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        disabled={!selectedServices[service.id]}
                        aria-label={`${t('priceCalculator.decreaseQuantity')}: ${t(service.nameKey)}`}
                      >
                        −
                      </button>
                      <span
                        className="w-8 text-center font-semibold"
                        aria-live="polite"
                      >
                        {selectedServices[service.id] || 0}
                      </span>
                      <button
                        onClick={() =>
                          handleServiceChange(
                            service.id,
                            (selectedServices[service.id] || 0) + 1
                          )
                        }
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        aria-label={`${t('priceCalculator.increaseQuantity')}: ${t(service.nameKey)}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {hasSelection && (
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="bg-dental-blue/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">
                {t('priceCalculator.estimatedCost')}:
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold text-dental-teal">
                  {total.min.toLocaleString()} - {total.max.toLocaleString()}{' '}
                  {t('priceCalculator.currency')}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {t('priceCalculator.exactCostDisclaimer')}
                </p>
              </div>
            </div>

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-dental-teal text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                {t('priceCalculator.getExactCalculation')}
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label
                    htmlFor="calc-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('priceCalculator.nameLabel')}
                  </label>
                  <input
                    type="text"
                    id="calc-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-transparent"
                    placeholder={t('priceCalculator.namePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="calc-phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('priceCalculator.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    id="calc-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-transparent"
                    placeholder={t('priceCalculator.phonePlaceholder')}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    {t('priceCalculator.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-dental-teal text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? t('priceCalculator.sending')
                      : t('priceCalculator.send')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {!hasSelection && (
        <div className="mt-6 text-center text-gray-500 text-sm">
          {t('priceCalculator.selectServicesHint')}
        </div>
      )}
    </div>
  )
}
