'use client'

import dynamic from 'next/dynamic'
import DraggableWrapper from './DraggableWrapper'

const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })

export default function ClientFloatingButtons() {
  return (
    <>
      <DraggableWrapper
        storageKey="fab-ai-assistant"
        defaultPosition={{ x: 24, y: -1 }}
        label="AI Асистент"
        className="fixed bottom-24 left-6 z-40"
      >
        <AIAssistant />
      </DraggableWrapper>

      <DraggableWrapper
        storageKey="fab-chat"
        defaultPosition={{ x: 24, y: -1 }}
        label="Чат"
        className="fixed bottom-6 left-6 z-50"
      >
        <ChatWidget />
      </DraggableWrapper>
    </>
  )
}
