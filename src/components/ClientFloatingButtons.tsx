'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'

const RadialMenu = dynamic(() => import('./RadialMenu'), { ssr: false })
const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })
const AccessibilityPanel = dynamic(() => import('./AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })), { ssr: false })

export default function ClientFloatingButtons() {
  const [mounted, setMounted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <RadialMenu
        onOpenChat={() => setChatOpen(true)}
        onOpenAI={() => setAiOpen(true)}
        onOpenAccessibility={() => setAccessibilityOpen(true)}
      />

      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <ChatWidget onClose={() => setChatOpen(false)} />
        </div>
      )}

      {aiOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <AIAssistant onClose={() => setAiOpen(false)} />
        </div>
      )}

      {accessibilityOpen && (
        <>
          {/* Backdrop for mobile modal view */}
          <div 
            className="fixed inset-0 bg-black/50 md:hidden z-40"
            onClick={() => setAccessibilityOpen(false)}
            aria-hidden="true"
          />
          
          {/* Mobile: bottom sheet modal, Desktop: fixed panel */}
          <div className="fixed z-50 md:bottom-24 md:right-6 inset-x-0 bottom-0 md:inset-auto">
            <div className="bg-white rounded-t-2xl md:rounded-2xl max-h-[80vh] md:max-h-none overflow-y-auto md:overflow-visible p-6 md:p-0">
              <button 
                onClick={() => setAccessibilityOpen(false)}
                className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Закрити"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mt-8 md:mt-0">
                <AccessibilityPanel defaultOpen={true} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
