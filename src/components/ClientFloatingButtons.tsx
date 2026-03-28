'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const RadialMenu = dynamic(() => import('./RadialMenu'), { ssr: false })
const LiveChat = dynamic(() => import('./LiveChat'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })
const AccessibilityPanelDynamic = dynamic(
  () =>
    import('./AccessibilityPanel').then(m => ({
      default: m.AccessibilityPanel,
    })),
  { ssr: false }
)

type ChatMode = null | 'choose' | 'human' | 'ai'

export default function ClientFloatingButtons() {
  const [mounted, setMounted] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>(null)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const showRadial = chatMode === null && !accessibilityOpen

  return (
    <>
      {/* Radial menu — hidden when chat/accessibility is open */}
      {showRadial && (
        <RadialMenu
          onOpenChat={() => setChatMode('choose')}
          onOpenAccessibility={() => setAccessibilityOpen(true)}
        />
      )}

      {/* Chat mode chooser */}
      {chatMode === 'choose' && (
        <div className="fixed z-50 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))]">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-72">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-dental-dark font-semibold text-base">
                Чат підтримки
              </h3>
              <button
                onClick={() => setChatMode(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Закрити"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-dental-text mb-4">
              Оберіть спосіб зв&apos;язку:
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setChatMode('human')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dental-primary-600 text-white hover:bg-dental-primary-700 active:scale-[0.98] transition-all text-sm font-medium"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                Написати адміністратору
              </button>
              <button
                onClick={() => setChatMode('ai')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dental-dark text-white hover:bg-dental-dark/90 active:scale-[0.98] transition-all text-sm font-medium"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                  />
                </svg>
                AI-асистент
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human live chat */}
      {chatMode === 'human' && (
        <div className="fixed z-50 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))]">
          <LiveChat onClose={() => setChatMode(null)} />
        </div>
      )}

      {/* AI assistant */}
      {chatMode === 'ai' && (
        <div className="fixed z-50 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))]">
          <AIAssistant onClose={() => setChatMode(null)} />
        </div>
      )}

      {/* Accessibility panel */}
      {accessibilityOpen && (
        <div className="fixed z-50 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))]">
          <div className="relative">
            <AccessibilityPanelDynamic defaultOpen hideToggle />
            <button
              onClick={() => setAccessibilityOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Закрити панель доступності"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
