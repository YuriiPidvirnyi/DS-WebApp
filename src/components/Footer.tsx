import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold text-dental-teal mb-4">
              Dental Story
            </div>
            <p className="text-gray-300 mb-4">
              {SITE_INFO.description}
            </p>
            <div className="flex space-x-4" role="list" aria-label="Соціальні мережі">
              <a href="#" className="text-gray-300 hover:text-dental-teal transition-colors" aria-label="Facebook">
                Facebook
              </a>
              <a href="#" className="text-gray-300 hover:text-dental-teal transition-colors" aria-label="Instagram">
                Instagram
              </a>
              <a href="#" className="text-gray-300 hover:text-dental-teal transition-colors" aria-label="Telegram">
                Telegram
              </a>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Підписка на новини</h4>
              <p className="text-xs text-gray-400 mb-3">Отримуйте акції та корисні поради від наших лікарів</p>
              <div className="max-w-sm">
                <NewsletterSubscribe />
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Навігація</h3>
            <nav aria-label="Навігація по сайту">
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
                <Link to="/gallery" className="text-gray-300 hover:text-dental-teal transition-colors">
                  Галерея
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-dental-teal transition-colors">
                  Контакти
                </Link>
              </li>
            </ul>
            </nav>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Контакти</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-dental-teal" aria-hidden="true" />
                <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="text-gray-300 hover:text-dental-teal transition-colors">
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-dental-teal" aria-hidden="true" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="text-gray-300 hover:text-dental-teal transition-colors">
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-dental-teal mt-1" aria-hidden="true" />
                <address className="text-gray-300 not-italic">
                  {CONTACT_INFO.address.full}<br />
                  {CONTACT_INFO.address.postalCode}
                </address>
              </li>
              <li className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-dental-teal mt-1" aria-hidden="true" />
                <div className="text-gray-300">
                  <div>{CONTACT_INFO.workingHours.weekdays}</div>
                  <div>{CONTACT_INFO.workingHours.saturday}</div>
                  <div>{CONTACT_INFO.workingHours.sunday}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2024 {SITE_INFO.name}. Усі права захищені.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-gray-300 hover:text-dental-teal text-sm transition-colors">
                Політика конфіденційності
              </Link>
              <Link to="/terms-of-service" className="text-gray-300 hover:text-dental-teal text-sm transition-colors">
                Умови використання
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer