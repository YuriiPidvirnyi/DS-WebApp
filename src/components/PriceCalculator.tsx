import { useState } from 'react'
import { Calculator, Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  priceFrom: number
  priceTo: number
  category: string
}

const services: Service[] = [
  // Терапевтична стоматологія
  {
    id: 'consultation',
    name: 'Консультація стоматолога',
    priceFrom: 300,
    priceTo: 500,
    category: 'Терапія',
  },
  {
    id: 'filling-simple',
    name: 'Пломба (проста)',
    priceFrom: 800,
    priceTo: 1200,
    category: 'Терапія',
  },
  {
    id: 'filling-composite',
    name: 'Пломба (композитна)',
    priceFrom: 1500,
    priceTo: 2500,
    category: 'Терапія',
  },
  {
    id: 'canal-treatment',
    name: 'Лікування каналу (1 канал)',
    priceFrom: 2000,
    priceTo: 3500,
    category: 'Терапія',
  },

  // Хірургічна стоматологія
  {
    id: 'extraction-simple',
    name: 'Видалення зуба (просте)',
    priceFrom: 800,
    priceTo: 1500,
    category: 'Хірургія',
  },
  {
    id: 'extraction-complex',
    name: 'Видалення зуба (складне)',
    priceFrom: 2000,
    priceTo: 4000,
    category: 'Хірургія',
  },
  {
    id: 'wisdom-tooth',
    name: 'Видалення зуба мудрості',
    priceFrom: 3000,
    priceTo: 6000,
    category: 'Хірургія',
  },

  // Протезування
  {
    id: 'crown-metal-ceramic',
    name: 'Коронка (металокераміка)',
    priceFrom: 3500,
    priceTo: 5000,
    category: 'Протезування',
  },
  {
    id: 'crown-zirconia',
    name: 'Коронка (цирконій)',
    priceFrom: 7000,
    priceTo: 12000,
    category: 'Протезування',
  },
  {
    id: 'veneer',
    name: 'Вінір (1 зуб)',
    priceFrom: 8000,
    priceTo: 15000,
    category: 'Протезування',
  },

  // Імплантація
  {
    id: 'implant',
    name: 'Імплант (з установкою)',
    priceFrom: 15000,
    priceTo: 25000,
    category: 'Імплантація',
  },
  {
    id: 'bone-grafting',
    name: 'Кісткова пластика',
    priceFrom: 8000,
    priceTo: 15000,
    category: 'Імплантація',
  },

  // Ортодонтія
  {
    id: 'braces-metal',
    name: 'Брекети (металеві)',
    priceFrom: 20000,
    priceTo: 30000,
    category: 'Ортодонтія',
  },
  {
    id: 'braces-ceramic',
    name: 'Брекети (керамічні)',
    priceFrom: 30000,
    priceTo: 45000,
    category: 'Ортодонтія',
  },
  {
    id: 'aligners',
    name: 'Елайнери (каппи)',
    priceFrom: 50000,
    priceTo: 120000,
    category: 'Ортодонтія',
  },

  // Естетична стоматологія
  {
    id: 'whitening',
    name: 'Відбілювання зубів',
    priceFrom: 3000,
    priceTo: 8000,
    category: 'Естетика',
  },
  {
    id: 'hygiene',
    name: 'Професійна чистка',
    priceFrom: 1200,
    priceTo: 2000,
    category: 'Естетика',
  },
]

export default function PriceCalculator() {
  const [selectedServices, setSelectedServices] = useState<
    Record<string, number>
  >({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showForm, setShowForm] = useState(false)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone) {
      toast.error('Будь ласка, заповніть усі поля')
      return
    }

    // Тут буде логіка відправки на backend
    const selectedItems = Object.entries(selectedServices)
      .map(([serviceId, qty]) => {
        const service = services.find(s => s.id === serviceId)
        return `${service?.name} x${qty}`
      })
      .join(', ')

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('Запит на розрахунок:', {
        name,
        phone,
        services: selectedItems,
        total,
      })
    }
    toast.success("Дякуємо! Ми зв'яжемося з вами найближчим часом")

    // Скидання форми
    setShowForm(false)
    setName('')
    setPhone('')
  }

  const categories = Array.from(new Set(services.map(s => s.category)))

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <Calculator className="h-8 w-8 text-dental-teal mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Калькулятор вартості
          </h2>
          <p className="text-gray-600 text-sm">
            Оберіть необхідні послуги для приблизного розрахунку
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              {category}
            </h3>
            <div className="space-y-2">
              {services
                .filter(s => s.category === category)
                .map(service => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {service.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.priceFrom} - {service.priceTo} грн
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
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold">
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
                Приблизна вартість:
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold text-dental-teal">
                  {total.min.toLocaleString()} - {total.max.toLocaleString()}{' '}
                  грн
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  *Точна вартість після консультації
                </p>
              </div>
            </div>

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-dental-teal text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                Отримати точний розрахунок
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label
                    htmlFor="calc-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ваше ім'я
                  </label>
                  <input
                    type="text"
                    id="calc-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-transparent"
                    placeholder="Іван Петренко"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="calc-phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Телефон
                  </label>
                  <input
                    type="tel"
                    id="calc-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-transparent"
                    placeholder="+380 XX XXX XX XX"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-dental-teal text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Надіслати
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {!hasSelection && (
        <div className="mt-6 text-center text-gray-500 text-sm">
          Оберіть послуги для розрахунку вартості
        </div>
      )}
    </div>
  )
}
