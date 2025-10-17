import { useState, useMemo } from 'react'
import { Phone, Navigation, Send, MessageCircle, X, Plus } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

export default function FloatingQuickActions() {
  const [open, setOpen] = useState(false)

  const links = useMemo(() => {
    const tel = `tel:${CONTACT_INFO.phoneRaw}`
    const tg = CONTACT_INFO.social?.telegram || 'https://t.me/'
    const viberNum = CONTACT_INFO.social?.viber?.replace(/\D/g, '') || CONTACT_INFO.phoneRaw.replace(/\D/g, '')
    const viber = `viber://chat?number=%2B${viberNum.replace(/^\+/, '')}`
    const maps = SITE_INFO.googleMaps
    return { tel, tg, viber, maps }
  }, [])

  return (
    <div className="fixed z-50 right-4 bottom-4 md:right-6 md:bottom-6" aria-live="polite">
      {/* Panel */}
      {open && (
        <div className="mb-3 rounded-xl shadow-lg bg-white border border-gray-200 p-3 w-64" role="dialog" aria-label="Швидкі дії">
          <div className="space-y-2">
            <a
              href={links.tel}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-900"
              data-track-id="quick_call"
              data-track-category="navigation"
              data-track-label="floating_call"
            >
              <Phone className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Подзвонити</div>
                <div className="text-xs text-gray-500">{CONTACT_INFO.phone}</div>
              </div>
            </a>

            <a
              href={links.tg}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-900"
              data-track-id="quick_telegram"
              data-track-category="navigation"
              data-track-label="floating_telegram"
            >
              <Send className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Написати в Telegram</div>
                <div className="text-xs text-gray-500">Відповімо швидко</div>
              </div>
            </a>

            <a
              href={links.viber}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-900"
              data-track-id="quick_viber"
              data-track-category="navigation"
              data-track-label="floating_viber"
            >
              <MessageCircle className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Написати у Viber</div>
                <div className="text-xs text-gray-500">Зручне листування</div>
              </div>
            </a>

            <a
              href={links.maps}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-900"
              data-track-id="quick_directions"
              data-track-category="navigation"
              data-track-label="floating_directions"
            >
              <Navigation className="h-5 w-5 text-dental-teal" />
              <div>
                <div className="text-sm font-medium">Маршрут до клініки</div>
                <div className="text-xs text-gray-500">Відкрити в Google Maps</div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Закрити швидкі дії' : 'Відкрити швидкі дії'}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full shadow-lg bg-dental-teal hover:bg-teal-600 text-white w-14 h-14 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-teal"
        data-track-id="quick_actions_toggle"
        data-track-category="engagement"
      >
        {open ? <X className="h-7 w-7" aria-hidden="true" /> : <Plus className="h-7 w-7" aria-hidden="true" />}
      </button>
    </div>
  )
}