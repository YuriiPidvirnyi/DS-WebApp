'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useDragMode } from '@/context/DragModeContext'

const RadialMenu = dynamic(() => import('./RadialMenu'), { ssr: false })
const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })
const AccessibilityPanel = dynamic(() => import('./AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })), { ssr: false })

export default function ClientFloatingButtons() {
  const [mounted, setMounted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const { toggleDragMode } = useDragMode()

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
        onToggleDragMode={toggleDragMode}
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
        <div className="fixed bottom-24 right-6 z-50">
          <AccessibilityPanel defaultOpen={true} />
        </div>
      )}
    </>
  )
}
