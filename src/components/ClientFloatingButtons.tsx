'use client'

import dynamic from 'next/dynamic'
import DraggableWrapper from './DraggableWrapper'

const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })

export default function ClientFloatingButtons() {
  return (
    <>
      <DraggableWrapper
        storageKey="fab-ai-assistant-v2"
        label="AI Асистент"
        className="fixed bottom-24 right-6 z-40"
      >
        <AIAssistant />
      </DraggableWrapper>

      <DraggableWrapper
        storageKey="fab-chat-v2"
        label="Чат"
        className="fixed bottom-6 right-6 z-50"
      >
        <ChatWidget />
      </DraggableWrapper>
    </>
  )
}
