'use client'

import { useState, useMemo } from 'react'
import {
  Phone,
  Navigation,
  Send,
  MessageCircle,
  X,
  Plus,
  Calendar,
  Instagram,
  Facebook,
} from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

export default function FloatingQuickActions() {
  const [open, setOpen] = useState(false)

  const links = useMemo(() => {
    const tel = `tel:${CONTACT_INFO.phoneRaw}`
    const tg = CONTACT_INFO.social?.telegram || 'https://t.me/'
    const viberNum =
      CONTACT_INFO.social?.viber?.replace(/\D/g, '') ||
      CONTACT_INFO.phoneRaw.replace(/\D/g, '')
    const viber = `viber://chat?number=%2B${viberNum.replace(/^\+/, '')}`
    const maps = SITE_INFO.googleMaps
    const instagram = CONTACT_INFO.social?.instagram || ''
    const facebook = CONTACT_INFO.social?.facebook || ''
    return { tel, tg, viber, maps, instagram, facebook }
  }, [])

  return (
    <div
      className="relative"
      aria-live="polite"
    >
      {/* Panel */}
      {open && (
        <div
          className="mb-3 rounded-xl shadow-lg bg-white border border-dental-secondary-200 p-3 w-64"
          role="dialog"
          aria-label="Швидкі дії"
        >
          <div className="space-y-2">
            <a
              href={links.tel}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dental-secondary-50 text-dental-dark"
              data-track-id="quick_call"
              data-track-category="navigation"
              data-track-label="floating_call"
            >
              <Phone className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Подзвонити</div>
                <div className="text-xs text-dental-muted">
                  {CONTACT_INFO.phone}
                </div>
              </div>
            </a>

            <a
              href={links.tg}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dental-secondary-50 text-dental-dark"
              data-track-id="quick_telegram"
              data-track-category="navigation"
              data-track-label="floating_telegram"
            >
              <Send className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Написати в Telegram</div>
                <div className="text-xs text-dental-muted">Відповімо швидко</div>
              </div>
            </a>

            <a
              href={links.viber}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dental-secondary-50 text-dental-dark"
              data-track-id="quick_viber"
              data-track-category="navigation"
              data-track-label="floating_viber"
            >
              <MessageCircle className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Написати у Viber</div>
                <div className="text-xs text-dental-muted">Зручне листування</div>
              </div>
            </a>

            <a
              href={links.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dental-secondary-50 text-dental-dark"
              data-track-id="quick_directions"
              data-track-category="navigation"
              data-track-label="floating_directions"
            >
              <Navigation className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Маршрут до клініки</div>
                <div className="text-xs text-dental-muted">
                  Відкрити в Google Maps
                </div>
              </div>
            </a>

            <a
              href="/booking"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dental-teal/10 bg-dental-teal/5 text-dental-dark border border-dental-teal/20"
              data-track-id="quick_booking"
              data-track-category="navigation"
              data-track-label="floating_booking"
            >
              <Calendar className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Записатися на прийом</div>
                <div className="text-xs text-dental-muted">Онлайн-запис</div>
              </div>
            </a>

            <div className="border-t border-dental-secondary-200 my-2"></div>

            <div className="flex items-center justify-around px-3 py-2">
              <a
                href={links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-dental-secondary-100 text-dental-muted hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-dental-secondary-100 text-dental-muted hover:text-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FAB with tooltip */}
      <div className="relative group">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Закрити швидкі дії' : 'Відкрити швидкі дії'}
          onClick={() => setOpen(v => !v)}
          className="relative rounded-full shadow-lg bg-gradient-to-br from-dental-primary-600 to-dental-primary-700 hover:from-dental-primary-700 hover:to-dental-primary-800 text-white w-14 h-14 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-dental-primary-500/30"
          data-track-id="quick_actions_toggle"
          data-track-category="engagement"
        >
          <span className={`absolute inset-0 rounded-full bg-dental-primary-400 animate-ping opacity-20 ${open ? 'hidden' : ''}`} />
          <span className={`transition-transform duration-300 ${open ? 'rotate-45' : 'rotate-0'}`}>
            {open ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Plus className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
        </button>
        {/* Tooltip */}
        {!open && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-dental-dark text-white text-sm font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Швидкі дії
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-dental-dark" />
          </div>
        )}
      </div>
    </div>
  )
}
