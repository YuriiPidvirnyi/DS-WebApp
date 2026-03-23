'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const RadialMenu = dynamic(() => import('./RadialMenu'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })
const LiveChat = dynamic(() => import('./LiveChat'), { ssr: false })
const AccessibilityPanel = dynamic(
  () =>
    import('./AccessibilityPanel').then(m => ({
      default: m.AccessibilityPanel,
    })),
  { ssr: false }
)

export default function ClientFloatingButtons() {
  const [mounted, setMounted] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const anyOpen = aiOpen || chatOpen || accessibilityOpen

  return (
    <>
      {/* Radial menu — hidden when any widget is open */}
      {!anyOpen && (
        <RadialMenu
          onOpenAI={() => setAiOpen(true)}
          onOpenChat={() => setChatOpen(true)}
          onOpenAccessibility={() => setAccessibilityOpen(true)}
        />
      )}

      {/* AI Assistant (GPT-powered) */}
      {aiOpen && (
        <div className="fixed z-50 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))]">
          <AIAssistant onClose={() => setAiOpen(false)} />
        </div>
      )}

      {/* Live Chat (Supabase Realtime) */}
      {chatOpen && (
        <div className="fixed z-50 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))]">
          <LiveChat onClose={() => setChatOpen(false)} />
        </div>
      )}

      {/* Accessibility Panel */}
      {accessibilityOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setAccessibilityOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed z-50 inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:inset-auto sm:bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:right-[calc(1.5rem+env(safe-area-inset-right,0px))] sm:w-72">
            <AccessibilityPanel defaultOpen={true} hideToggle={true} />
          </div>
        </>
      )}
    </>
  )
}
