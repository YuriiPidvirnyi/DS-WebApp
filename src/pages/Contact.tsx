import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
    alert('Дякуємо за звернення! Ми зв\'яжемося з вами найближчим часом.')
    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      service: '',
      message: ''
    })
  }

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Контакти
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Зв'яжіться з нами зручним для вас способом або запишіться на прийом онлайн
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Записатися на прийом
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ім'я та прізвище *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal transition-colors"
                  placeholder="Введіть ваше ім'я та прізвище"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Номер телефону *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal transition-colors"
                  placeholder="+380 XX XXX XX XX"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal transition-colors"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                  Послуга
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal transition-colors"
                >
                  <option value="">Оберіть послугу</option>
                  <option value="consultation">Консультація</option>
                  <option value="treatment">Лікування зубів</option>
                  <option value="cleaning">Професійна гігієна</option>
                  <option value="implants">Імплантація</option>
                  <option value="orthodontics">Ортодонтія</option>
                  <option value="prosthetics">Протезування</option>
                  <option value="whitening">Відбілювання</option>
                  <option value="surgery">Хірургія</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Повідомлення
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal transition-colors"
                  placeholder="Опишіть ваші побажання або питання"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-dental-teal hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="h-5 w-5 mr-2" />
                Надіслати заявку
              </button>

              <p className="text-sm text-gray-500 text-center">
                * Обов'язкові поля. Ми зв'яжемося з вами протягом 30 хвилин.
              </p>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <div className="bg-gradient-to-br from-dental-blue to-dental-teal text-white rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">
                Контактна інформація
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Телефон</h3>
                    <p>+380 44 123 45 67</p>
                    <p className="text-sm text-blue-100">Цілодобова підтримка</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p>info@dentalstory.ua</p>
                    <p className="text-sm text-blue-100">Відповідаємо протягом 2 годин</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Адреса</h3>
                    <p>м. Київ, вул. Хрещатик, 25</p>
                    <p>офіс 301, 3-й поверх</p>
                    <p className="text-sm text-blue-100">5 хвилин від метро Хрещатик</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Години роботи</h3>
                    <p>Пн-Пт: 8:00 - 20:00</p>
                    <p>Субота: 9:00 - 17:00</p>
                    <p>Неділя: вихідний</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-red-800 mb-3">
                🚨 Екстрена допомога
              </h3>
              <p className="text-red-700 mb-4">
                У разі гострого болю або травми зв'яжіться з нами негайно:
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-red-800">
                  📞 +380 67 123 45 67 (цілодобово)
                </p>
                <p className="text-red-600 text-sm">
                  Екстрені виклики приймаємо 24/7
                </p>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-3" />
                <p className="font-medium">Інтерактивна карта</p>
                <p className="text-sm">вул. Хрещатик, 25, Київ</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Часті питання
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Чи потрібно записуватися заздалегідь?
              </h3>
              <p className="text-gray-600">
                Так, ми працюємо за попереднім записом. Це дозволяє нам приділити 
                кожному пацієнту достатньо часу та уваги.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Чи можна перенести прийом?
              </h3>
              <p className="text-gray-600">
                Так, ви можете перенести прийом, повідомивши нас за 24 години до 
                запланованого часу візиту.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Які документи потрібні для прийому?
              </h3>
              <p className="text-gray-600">
                Візьміть з собою паспорт або інший документ, що посвідчує особу. 
                Якщо є медична картка - також приносьте її.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Чи надаєте ви гарантію на лікування?
              </h3>
              <p className="text-gray-600">
                Так, ми надаємо гарантію на всі види робіт згідно з медичними 
                стандартами та вимогами.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact