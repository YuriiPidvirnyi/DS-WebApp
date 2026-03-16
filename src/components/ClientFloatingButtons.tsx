'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

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
      {/* Radial menu - hidden when any widget is open */}
      {!chatOpen && !aiOpen && !accessibilityOpen && (
        <RadialMenu
          onOpenChat={() => setChatOpen(true)}
          onOpenAI={() => setAiOpen(true)}
          onOpenAccessibility={() => setAccessibilityOpen(true)}
        />
      )}

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
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setAccessibilityOpen(false)}
            aria-hidden="true"
          />
          
          {/* Panel container - centered on mobile, bottom-right on desktop */}
          <div className="fixed z-50 inset-x-4 bottom-24 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-72">
            <AccessibilityPanel defaultOpen={true} hideToggle={true} />
          </div>
        </>
      )}
    </>
  )
}
