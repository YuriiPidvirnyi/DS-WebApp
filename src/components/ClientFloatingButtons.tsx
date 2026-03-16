'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const RadialMenu = dynamic(() => import('./RadialMenu'), { ssr: false })
const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })

export default function ClientFloatingButtons() {
  const [chatOpen, setChatOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <>
      {/* Radial menu - unified access point for all actions */}
      <RadialMenu 
        onOpenChat={() => setChatOpen(true)}
        onOpenAI={() => setAiOpen(true)}
      />

      {/* Chat widget - opens when triggered from radial menu */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <ChatWidget onClose={() => setChatOpen(false)} />
        </div>
      )}

      {/* AI Assistant - opens when triggered from radial menu */}
      {aiOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <AIAssistant onClose={() => setAiOpen(false)} />
        </div>
      )}
    </>
  )
}
