import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import ContactForm from '@/components/ContactForm'
import { CONTACT_INFO } from '@/utils/constants'

const Contact = () => {

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
          <ContactForm />

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
                    <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="hover:underline">
                      {CONTACT_INFO.phone}
                    </a>
                    <p className="text-sm text-blue-100">Робочі години: {CONTACT_INFO.workingHours.weekdays}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href={`mailto:${CONTACT_INFO.email}`} className="hover:underline">
                      {CONTACT_INFO.email}
                    </a>
                    <p className="text-sm text-blue-100">Відповідаємо протягом 2 годин</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Адреса</h3>
                    <p>{CONTACT_INFO.address.full}</p>
                    <p>{CONTACT_INFO.address.district}</p>
                    <a 
                      href={CONTACT_INFO.social ? 'https://maps.app.goo.gl/euKMW8R8eGTd2wJr9' : '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-100 hover:underline"
                    >
                      Переглянути на карті →
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Години роботи</h3>
                    <p>{CONTACT_INFO.workingHours.weekdays}</p>
                    <p>{CONTACT_INFO.workingHours.saturday}</p>
                    <p>{CONTACT_INFO.workingHours.sunday}</p>
                    <p className="text-sm text-blue-100">{CONTACT_INFO.workingHours.timezone}</p>
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
                У разі гострого болю або травми зв'яжіться з нами:
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-red-800">
                  <a href={`tel:${CONTACT_INFO.emergencyPhoneRaw}`} className="hover:underline">
                    📞 {CONTACT_INFO.emergencyPhone}
                  </a>
                </p>
                <p className="text-red-600 text-sm">
                  В робочі години та за необхідності
                </p>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-dental-teal mr-2" />
                  <h3 className="font-semibold text-gray-900">Наше розташування</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}
                </p>
              </div>
              <div className="relative h-80">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2574.600386934008!2d24.034215276362477!3d49.812380033100865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473ae7d471be0ba5%3A0xbc1336f142c1e357!2sDental%20Story!5e0!3m2!1suk!2sgr!4v1760715689970!5m2!1suk!2sgr"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Dental Story - Розташування клініки на карті"
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="p-4 bg-white border-t">
                <a 
                  href="https://maps.app.goo.gl/euKMW8R8eGTd2wJr9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-dental-teal hover:text-teal-600 font-medium text-sm"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Відкрити в Google Maps →
                </a>
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