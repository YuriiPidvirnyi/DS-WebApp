import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold text-dental-teal mb-4">
              Dental Story
            </div>
            <p className="text-gray-300 mb-4">
              Сучасна стоматологічна клініка, що надає повний спектр послуг 
              з догляду за здоров'ям ваших зубів. Професійні лікарі, 
              новітнє обладнання та індивідуальний підхід до кожного пацієнта.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-dental-teal transition-colors">
                Facebook
              </a>
              <a href="#" className="text-gray-300 hover:text-dental-teal transition-colors">
                Instagram
              </a>
              <a href="#" className="text-gray-300 hover:text-dental-teal transition-colors">
                Telegram
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Навігація</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-dental-teal transition-colors">
                  Головна
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-dental-teal transition-colors">
                  Послуги
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-dental-teal transition-colors">
                  Про нас
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-dental-teal transition-colors">
                  Контакти
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Контакти</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-dental-teal" />
                <span className="text-gray-300">+380 44 123 45 67</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-dental-teal" />
                <span className="text-gray-300">info@dentalstory.ua</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-dental-teal mt-1" />
                <span className="text-gray-300">
                  м. Київ, вул. Хрещатик, 25<br />
                  офіс 301
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-dental-teal mt-1" />
                <div className="text-gray-300">
                  <div>Пн-Пт: 8:00-20:00</div>
                  <div>Сб: 9:00-17:00</div>
                  <div>Нд: вихідний</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2024 Dental Story. Усі права захищені.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-dental-teal text-sm transition-colors">
                Політика конфіденційності
              </a>
              <a href="#" className="text-gray-300 hover:text-dental-teal text-sm transition-colors">
                Умови використання
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer